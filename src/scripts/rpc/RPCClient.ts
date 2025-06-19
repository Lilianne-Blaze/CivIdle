import { Capacitor, registerPlugin } from "@capacitor/core";
import { decode, encode } from "@msgpack/msgpack";
import type { ServerImpl } from "../../../server/src/Server";
import type { Building } from "../../../shared/definitions/BuildingDefinitions";
import WorldMap from "../../../shared/definitions/WorldMap.json";
import { addPetraOfflineTime } from "../../../shared/logic/BuildingLogic";
import { Config } from "../../../shared/logic/Config";
import { GOOGLE_PLAY_GAMES_CLIENT_ID } from "../../../shared/logic/Constants";
import { PremiumTileTextures } from "../../../shared/logic/GameState";
import { checksum, getGameOptions, getGameState } from "../../../shared/logic/GameStateLogic";
import { RpcError, removeTrailingUndefs, rpcClient } from "../../../shared/thirdparty/TRPCClient";
import type {
   AllMessageTypes,
   IChat,
   IChatMessage,
   IClientMapEntry,
   IClientTrade,
   IMapMessage,
   IPendingClaimMessage,
   IPlatformInfo,
   IRPCMessage,
   ITradeMessage,
   IUser,
   IWelcomeMessage,
} from "../../../shared/utilities/Database";
import {
   AccountLevel,
   ChatAttributes,
   MessageType,
   ServerWSErrorCode,
   UserAttributes,
} from "../../../shared/utilities/Database";
import { vacuumChat } from "../../../shared/utilities/DatabaseShared";
import { SECOND, WEEK, clamp, forEach, hasFlag, shuffle, uuid4 } from "../../../shared/utilities/Helper";
import { srand } from "../../../shared/utilities/Random";
import { setServerNow } from "../../../shared/utilities/ServerNow";
import { TypedEvent } from "../../../shared/utilities/TypedEvent";
import { L, t } from "../../../shared/utilities/i18n";
import { saveGame } from "../Global";
import { getBuildNumber, getVersion } from "../logic/Version";
import { showToast } from "../ui/GlobalModal";
import { idbGet, idbSet } from "../utilities/BrowserStorage";
import { makeObservableHook } from "../utilities/Hook";
import { playBubble, playKaching } from "../visuals/Sound";
import { SteamClient, isSteam } from "./SteamClient";

let gt = globalThis as any;

let user: IUser | null = null;
let platformInfo: IPlatformInfo | null = null;

export const OnUserChanged = new TypedEvent<IUser | null>();
gt.OnUserChanged = OnUserChanged;

export const OnPlatformInfoChanged = new TypedEvent<IPlatformInfo | null>();
gt.OnPlatformInfoChanged = OnPlatformInfoChanged;

export const OnChatMessage = new TypedEvent<LocalChat[]>();
gt.OnChatMessage = OnChatMessage;

export const OnTradeChanged = new TypedEvent<IClientTrade[]>();
gt.OnTradeChanged = OnTradeChanged;

export const OnPlayerMapChanged = new TypedEvent<Map<string, IClientMapEntry>>();
gt.OnPlayerMapChanged = OnPlayerMapChanged;

export const OnPlayerMapMessage = new TypedEvent<IMapMessage>();
gt.OnPlayerMapMessage = OnPlayerMapMessage;

export const OnNewPendingClaims = new TypedEvent<void>();
gt.OnNewPendingClaims = OnNewPendingClaims;

export interface PlayGamesPlugin {
   requestServerSideAccess: (opt: { clientId: string }) => Promise<{ serverAuthToken: string }>;
}

export interface GameCenterPlugin {
   getAuthTicket: () => Promise<{ ticket: string }>;
}

const PlayGames = registerPlugin<PlayGamesPlugin>("PlayGames");
const GameCenter = registerPlugin<GameCenterPlugin>("GameCenter");

export interface IClientChat extends IChat {
   id: number;
}

interface ISystemMessage {
   id: number;
   message: string;
}

export type LocalChat = IClientChat | ISystemMessage;

let chatMessages: LocalChat[] = [];
const trades: Map<string, IClientTrade> = new Map();
const playerMap: Map<string, IClientMapEntry> = new Map();

export function getPlayerMap() {
   return playerMap;
}
gt.getPlayerMap = getPlayerMap;

let ws: WebSocket | null = null;

// added exposer for local ws variable
export function getWebSocket(): WebSocket | null {
   return ws;
}
gt.getWebSocket = getWebSocket;


export const client = rpcClient<ServerImpl>({
   request: (method: string, params: any[]) => {
      return new Promise((resolve, reject) => {
         if (!ws || ws.readyState !== WebSocket.OPEN) {
            return reject("WebSocket is not ready yet");
         }
         const id = ++requestId;
         const request = {
            jsonrpc: "2.0",
            id: id,
            method,
            params: removeTrailingUndefs(params),
         };
         ws.send(encode(request));
         rpcRequests[id] = { resolve, reject, time: Date.now() };
      });
   },
});
gt.client = client;

export function getServerAddress(): string {
   if (import.meta.env.DEV) {
      const url = new URLSearchParams(window.location.search);
      return url.get("server") ?? "ws://localhost:8000";
   }
   return "wss://de.cividle.com";
}
gt.getServerAddress = getServerAddress;

export function getTrades(): IClientTrade[] {
   return Array.from(trades.values()).filter((trade) => {
      if (Config.Resource[trade.buyResource] && Config.Resource[trade.sellResource]) {
         return true;
      }
      return false;
   });
}
gt.getTrades = getTrades;

export const usePlayerMap = makeObservableHook(OnPlayerMapChanged, () => playerMap);
export const useChatMessages = makeObservableHook(OnChatMessage, () => chatMessages);
export const useTrades = makeObservableHook(OnTradeChanged, getTrades);
export const useUser = makeObservableHook(OnUserChanged, getUser);
export const usePlatformInfo = makeObservableHook(OnPlatformInfoChanged, getPlatformInfo);

export function getUser(): IUser | null {
   return user;
}
gt.getUser = getUser;

export function getPlatformInfo(): IPlatformInfo | null {
   return platformInfo;
}
gt.getPlatformInfo = getPlatformInfo;

export function isOnlineUser(): boolean {
   if (import.meta.env.DEV) {
      return true;
   }
   return (user?.level ?? AccountLevel.Tribune) > AccountLevel.Tribune;
}
gt.isOnlineUser = isOnlineUser;

export function getUserLevel(): AccountLevel {
   return user?.level ?? AccountLevel.Tribune;
}
gt.getUserLevel = getUserLevel;

// TODO: Need to properly implement this after supporting offline run
export function canEarnGreatPeopleFromReborn(): boolean {
   if (isOnlineUser()) {
      getGameState().isOffline = false;
   } else {
      getGameState().isOffline = true;
   }
   return true;
}
gt.canEarnGreatPeopleFromReborn = canEarnGreatPeopleFromReborn;

let chatId = 0;

export function addSystemMessage(message: string): void {
   // make sure it never throws errors
   try {
      chatMessages.push({ id: ++chatId, message });
      OnChatMessage.emit(chatMessages);
   } catch (err) { }
}
gt.addSystemMessage = addSystemMessage;

export function clearSystemMessages(): void {
   // make sure it never throws errors
   try {
      chatMessages = chatMessages.filter((c) => "channel" in c);
      OnChatMessage.emit(chatMessages);
   } catch (err) { }
}
gt.clearSystemMessages = clearSystemMessages;

export const TileBuildings: Map<string, Building> = new Map();
export const OnTileBuildingsChanged = new TypedEvent<void>();

const TileBuildingsSeed = "TileBuildingsSeed";
let weekId = 0;
let intervalId = 0;

function startTileBuildingTimer() {
   if (intervalId) {
      clearInterval(intervalId);
      intervalId = 0;
   }
   populateTileBuildings();
   intervalId = window.setInterval(populateTileBuildings, 1000);
}

async function populateTileBuildings() {
   const currentWeek = Math.floor(Date.now() / WEEK);
   if (weekId === currentWeek) {
      return;
   }
   weekId = currentWeek;
   const buildings = await client.getBuildings();
   const rand = srand(TileBuildingsSeed);
   let i = 0;
   forEach(WorldMap, (xy) => {
      TileBuildings.set(xy, buildings[i++ % buildings.length]);
      if (i >= buildings.length) {
         shuffle(buildings, rand);
         i = 0;
      }
   });
   OnTileBuildingsChanged.emit();
}

export const CLIENT_ID = "CIVIDLE_CLIENT_ID";
gt.CLIENT_ID = CLIENT_ID;

let reconnect = 0;
let requestId = 0;
// biome-ignore lint/complexity/noBannedTypes: <explanation>
const rpcRequests: Record<number, { resolve: Function; reject: Function; time: number }> = {};

let steamTicket: string | null = null;
let steamTicketTime = 0;

export async function connectWebSocket(): Promise<IWelcomeMessage> {
   const platform = Capacitor.getPlatform();
   if (isSteam()) {
      if (!steamTicket || Date.now() - steamTicketTime > 30 * SECOND) {
         steamTicket = await SteamClient.getAuthSessionTicket();
         steamTicketTime = Date.now();
      }
      const steamId = await SteamClient.getSteamId();
      if (!getGameOptions().userId) {
         getGameOptions().userId = `steam:${steamId}`;
      }
      const params = [
         `appId=${await SteamClient.getAppId()}`,
         `ticket=${steamTicket}`,
         "platform=steam",
         `steamId=${steamId}`,
         `userId=${getGameOptions().userId}`,
         `version=${getVersion()}`,
         `build=${getBuildNumber()}`,
         `gameId=${getGameState().id}`,
         `checksum=${checksum.expected}${checksum.actual}`,
      ];
      ws = new WebSocket(`${getServerAddress()}/?${params.join("&")}`);
   } else if (platform === "android") {
      const token = await PlayGames.requestServerSideAccess({
         clientId: GOOGLE_PLAY_GAMES_CLIENT_ID,
      });
      const params = [
         `ticket=${token.serverAuthToken}`,
         "platform=android",
         `version=${getVersion()}`,
         `build=${getBuildNumber()}`,
         `userId=${getGameOptions().userId ?? ""}`,
         `gameId=${getGameState().id}`,
         `checksum=${checksum.expected}${checksum.actual}`,
      ];
      ws = new WebSocket(`${getServerAddress()}/?${params.join("&")}`);
   } else if (platform === "ios") {
      const result = await GameCenter.getAuthTicket();
      const params = [
         `ticket=${result.ticket}`,
         "platform=ios",
         `version=${getVersion()}`,
         `build=${getBuildNumber()}`,
         `userId=${getGameOptions().userId ?? ""}`,
         `gameId=${getGameState().id}`,
         `checksum=${checksum.expected}${checksum.actual}`,
      ];
      ws = new WebSocket(`${getServerAddress()}/?${params.join("&")}`);
   } else {
      if (!getGameOptions().userId) {
         getGameOptions().userId = `web:${uuid4()}`;
      }

      let key = await idbGet<string>(CLIENT_ID);

      if (!key) {
         key = uuid4();
         await idbSet(CLIENT_ID, key);
      }

      const params = [
         `ticket=${key}`,
         "platform=web",
         `version=${getVersion()}`,
         `build=${getBuildNumber()}`,
         `userId=${getGameOptions().userId}`,
         `gameId=${getGameState().id}`,
         `checksum=${checksum.expected}${checksum.actual}`,
      ];
      ws = new WebSocket(`${getServerAddress()}/?${params.join("&")}`);
   }

   if (!ws) {
      return Promise.reject("Failed to initialize WebSocket");
   }

   ws.binaryType = "arraybuffer";

   let resolve: ((v: IWelcomeMessage) => void) | null = null;

   const promise = new Promise<IWelcomeMessage>((resolve_) => {
      resolve = resolve_;
   });

   ws.onmessage = (e) => {
      const message = decode(e.data as ArrayBuffer) as AllMessageTypes;
      const type = message.type as MessageType;
      switch (type) {
         case MessageType.Chat: {
            const c = message as IChatMessage;
            if (c.flush) {
               chatMessages = c.chat.map((c) => ({ ...c, id: ++chatId }));
            } else {
               c.chat.forEach((m) => {
                  const mentionsMe =
                     user && m.message.toLowerCase().includes(` @${user.handle.toLowerCase()}`);
                  const isAnnounce = hasFlag(m.attr, ChatAttributes.Announce);
                  if (mentionsMe || isAnnounce) {
                     playBubble();
                     showToast(`${m.name}: ${m.message}`);
                  }
                  chatMessages.push({ ...m, id: ++chatId });
               });
            }
            chatMessages = vacuumChat(chatMessages);
            OnChatMessage.emit(chatMessages);
            break;
         }
         case MessageType.Welcome: {
            const w = message as IWelcomeMessage;
            user = w.user;
            const options = getGameOptions();
            if (!options.userId) {
               options.userId = user.userId;
            }
            saveGame().catch(console.error);
            OnUserChanged.emit(user);
            platformInfo = w.platformInfo;
            OnPlatformInfoChanged.emit(platformInfo);
            const tick = getGameState().tick;
            const offlineTicks = clamp(w.lastGameTick + w.offlineTime - tick, 0, Number.POSITIVE_INFINITY);
            console.log(
               "[WelcomeMessage]",
               "CurrentTick:",
               tick,
               "OfflineTicks:",
               offlineTicks,
               "OfflineTime:",
               w.offlineTime,
               "User:",
               JSON.stringify(w),
            );
            setServerNow(w.now);
            startTileBuildingTimer();
            w.offlineTime = Math.min(w.offlineTime, offlineTicks);
            resolve?.(w);
            OnAfterWelcomeMessageProcessed.emit();
            break;
         }
         case MessageType.Trade: {
            const tm = message as ITradeMessage;
            if (tm.upsert) {
               tm.upsert.forEach((trade) => {
                  trades.set(trade.id, trade);
               });
            }
            if (tm.remove) {
               tm.remove.forEach((id) => {
                  trades.delete(id);
               });
            }
            OnTradeChanged.emit(getTrades());
            break;
         }
         case MessageType.Map: {
            const m = message as IMapMessage;
            OnPlayerMapMessage.emit(m);
            if (m.upsert) {
               forEach(m.upsert, (xy, entry) => {
                  playerMap.set(xy, entry);
               });
            }
            if (m.remove) {
               m.remove.forEach((xy) => {
                  playerMap.delete(xy);
               });
            }
            OnPlayerMapChanged.emit({ ...playerMap });
            break;
         }
         case MessageType.PendingClaim: {
            const r = message as IPendingClaimMessage;
            if (user && r.claims[user.userId]) {
               if (getGameOptions().tradeFilledSound) {
                  playKaching();
               }
               showToast(t(L.PlayerTradeClaimAvailable, { count: r.claims[user.userId] }));
               OnNewPendingClaims.emit();
            }
            break;
         }
         case MessageType.RPC: {
            const r = message as IRPCMessage;
            handleRpcResponse(r.data);
            break;
         }
      }
   };

   ws.onopen = () => {
      reconnect = 0;
   };

   ws.onclose = (ev) => {
      ws = null;
      user = null;
      OnUserChanged.emit(null);
      console.log("WebSocket connection closed. Code:", ev.code);
      switch (ev.code) {
         case ServerWSErrorCode.BadRequest:
         case ServerWSErrorCode.NotAllowed:
         case ServerWSErrorCode.Background:
            break;
         case ServerWSErrorCode.InvalidTicket:
            steamTicket = null;
            retryConnect();
            break;
         default:
            retryConnect();
            break;
      }
   };

   return promise;
}
gt.connectWebSocket = connectWebSocket;

export function disconnectWebSocket() {
   ws?.close(ServerWSErrorCode.Background);
   reconnect = 0;
}
gt.disconnectWebSocket = disconnectWebSocket;

export function reconnectWebSocket() {
   if (!ws) {
      connectWebSocket().then(convertOfflineTimeToWarp);
   }
}
gt.reconnectWebSocket = reconnectWebSocket;

function retryConnect() {
   setTimeout(reconnectWebSocket, Math.min(Math.pow(2, reconnect++) * SECOND, 16 * SECOND));
}

export function convertOfflineTimeToWarp(w: IWelcomeMessage): void {
   const { offlineTime } = w;
   console.log("[convertOfflineTimeToWarp] offlineTime:", offlineTime);
   if (offlineTime >= 60) {
      playBubble();
      showToast(t(L.PetraOfflineTimeReconciliation, { count: offlineTime }));
      addPetraOfflineTime(offlineTime, getGameState());
   }
}

function handleRpcResponse(response: any) {
   if (!response || !response.id) {
      throw new Error(`Invalid RPC Response received: ${response}`);
   }
   if (!rpcRequests[response.id]) {
      throw new Error(`RPC Request ${response.id} is already handled`);
   }
   const { resolve, reject } = rpcRequests[response.id];
   delete rpcRequests[response.id];
   const { result, error } = response;
   if (error) {
      const { code, message, data } = error;
      reject(new RpcError(message, code, data));
   }
   resolve(result);
}

OnUserChanged.on((user) => {
   if (!user) {
      return;
   }
   if (PremiumTileTextures[getGameOptions().tileTexture] && !hasFlag(user.attr, UserAttributes.DLC1)) {
      getGameOptions().tileTexture = "Tile1";
      return;
   }
});
