
// ===== ===== =====
// LmcEvents.ts

import type { GameState } from "../logic/GameState";
import { ChatChannel, IUser } from "../utilities/Database";
import { TypedEvent } from "../utilities/TypedEvent";
import { CheckMarketTradeEvent } from "./LmcMarkets";

const gt = globalThis as any;

export type GameStateAndOfflineFlagEvent = {
   gs: GameState;
   offline: boolean;
};

export const OnAtBottomOfTickEverySecond = new TypedEvent<GameStateAndOfflineFlagEvent>();
gt.OnAtBottomOfTickEverySecond = OnAtBottomOfTickEverySecond;

export const OnSoonAfterGameStartedOrLoaded = new TypedEvent<GameStateAndOfflineFlagEvent>();
gt.OnSoonAfterGameStartedOrLoaded = OnSoonAfterGameStartedOrLoaded;

export type TileSelectedEvent = {
   tileX: number;
   tileY: number;
   isLeftClick: boolean;
   isCity?: boolean;
   isWorld?: boolean;
   gs?: GameState | null | undefined;
   fpEvent?: MouseEvent | TouchEvent | null | undefined;
};

// tileX, tileY, isLeftClick, grid.x,grid.y, gs, e
export const OnCityTileSelected = new TypedEvent<TileSelectedEvent>();
gt.OnCityTileSelected = OnCityTileSelected;

// tileX, tileY, isLeftClick
export const OnWorldTileSelected = new TypedEvent<TileSelectedEvent>();
gt.OnWorldTileSelected = OnWorldTileSelected;

// =====


export const OnEveryHour = new TypedEvent<GameStateAndOfflineFlagEvent>();
gt.OnEveryHour = OnEveryHour;

export const OnEveryFiveMins = new TypedEvent<GameStateAndOfflineFlagEvent>();
gt.OnEveryFiveMins = OnEveryFiveMins;

export const OnEveryMinute = new TypedEvent<GameStateAndOfflineFlagEvent>();
gt.OnEveryMinute = OnEveryMinute;

export const OnEveryFiveSecs = new TypedEvent<GameStateAndOfflineFlagEvent>();
gt.OnEveryFiveSecs = OnEveryFiveSecs;

// =====

export const OnAtEndOfSetCityOverride = new TypedEvent();
gt.OnAtEndOfSetCityOverride = OnAtEndOfSetCityOverride;

export const OnAfterWelcomeMessageProcessed = new TypedEvent();
gt.OnAfterWelcomeMessageProcessed = OnAfterWelcomeMessageProcessed;

// -----

export type UserIdChangedEvent = {
   prevUserId: string | null;
   newUserId: string | null;
};

export const OnUserIdChanged = new TypedEvent<UserIdChangedEvent>();
gt.OnUserIdChanged = OnUserIdChanged;

// -----

export const OnAtEndOfClearIntraTickCache = new TypedEvent();
gt.OnAtEndOfClearIntraTickCache = OnAtEndOfClearIntraTickCache;

export const OnCheckMarketTrade = new TypedEvent<CheckMarketTradeEvent>();
gt.OnCheckMarketTrade = OnCheckMarketTrade;

// -----

export class BeforeChatMessageSendEvent {
   constructor(
      public user: IUser,
      public channel: ChatChannel,
      public chat: string,
      public timeMillis: number = Date.now(),
      public blockSending = false,
   ) { }
}

export const OnBeforeChatMessageSend = new TypedEvent<BeforeChatMessageSendEvent>();
gt.OnBeforeChatMessageSend = OnBeforeChatMessageSend;

// LmcEvents.ts
// ===== ===== =====
