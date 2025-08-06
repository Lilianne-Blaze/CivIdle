import { lmcDeserializeSaveAtEnd, lmcSerializeSaveAtStart } from "../lmc/LmcSavedGame";
import { wyhash } from "../thirdparty/wyhash";
import { safeAdd } from "../utilities/Helper";
import { TypedEvent } from "../utilities/TypedEvent";
import { SavedGame, type GameOptions, type GameState } from "./GameState";

const gt = globalThis as any;

export const savedGame = new SavedGame();
gt.savedGame = savedGame;

export const TILE_SIZE = 64;
gt.TILE_SIZE = TILE_SIZE;

export const GameStateChanged = new TypedEvent<GameState>();
gt.GameStateChanged = GameStateChanged;


export const GameOptionsChanged = new TypedEvent<GameOptions>();
gt.GameOptionsChanged = GameOptionsChanged;

export function getGameState(): GameState {
   return savedGame.current;
}
gt.getGameState = getGameState;

export function getGameOptions(): GameOptions {
   return savedGame.options;
}
gt.getGameOptions = getGameOptions;

export function serializeSave(save: SavedGame = savedGame): string {
   lmcSerializeSaveAtStart(save);

   const transportation = save.current.transportationV2;
   save.current.transportationV2 = [];
   // Clone without transportation
   const cloned = structuredClone(save);
   save.current.transportationV2 = transportation;
   // Rewind transportation back to origin
   transportation.forEach((t) => {
      const resources = cloned.current.tiles.get(t.fromXy)?.building?.resources;
      if (resources) {
         safeAdd(resources, t.resource, t.amount);
      }
   });
   cloned.options.checksum = null;
   const checksum = wyhash(serializeSaveLite(cloned), BigInt(0)).toString(16);
   cloned.options.checksum = checksum;
   return JSON.stringify(cloned, replacer);
}
gt.serializeSave = serializeSave;

export function serializeSaveLite(gs: SavedGame = savedGame): Uint8Array {
   const transportation = gs.current.transportationV2;
   gs.current.transportationV2 = [];
   const json = JSON.stringify(gs, replacer);
   gs.current.transportationV2 = transportation;
   const result = new TextEncoder().encode(json);
   return result;
}
gt.serializeSaveLite = serializeSaveLite;

export const checksum = { expected: "", actual: "" };
gt.checksum = checksum;

export function deserializeSave(str: string): SavedGame {
   const saveGame = JSON.parse(str, reviver) as SavedGame;
   const expected = saveGame.options.checksum;
   if (!expected) {
      return saveGame;
   }
   checksum.expected = expected;
   saveGame.options.checksum = null;
   checksum.actual = wyhash(serializeSaveLite(saveGame), BigInt(0)).toString(16);
   // TODO: Remove this when everyone is migrated!
   if ("transportation" in saveGame.current) {
      checksum.actual = checksum.expected;
   }

   lmcDeserializeSaveAtEnd(saveGame);
   return saveGame;
}
gt.deserializeSave = deserializeSave;

export function notifyGameStateUpdate(gameState?: GameState): void {
   GameStateChanged.emit(gameState ?? getGameState());
}
gt.notifyGameStateUpdate = notifyGameStateUpdate;

export function notifyGameOptionsUpdate(gameOptions?: GameOptions): void {
   GameOptionsChanged.emit(gameOptions ?? getGameOptions());
}
gt.notifyGameOptionsUpdate = notifyGameOptionsUpdate;

export function watchGameState(cb: (gs: GameState) => void): () => void {
   cb(getGameState());
   function handleGameStateChanged(gs: GameState) {
      cb(gs);
   }
   GameStateChanged.on(handleGameStateChanged);
   return () => {
      GameStateChanged.off(handleGameStateChanged);
   };
}
gt.watchGameState = watchGameState;

export function watchGameOptions(cb: (gameOptions: GameOptions) => void): () => void {
   cb(getGameOptions());
   function handleGameOptionsChanged(gameOptions: GameOptions) {
      cb(gameOptions);
   }
   GameOptionsChanged.on(handleGameOptionsChanged);
   return () => {
      GameOptionsChanged.off(handleGameOptionsChanged);
   };
}
gt.watchGameOptions = watchGameOptions;

export function replacer(key: string, value: any): any {
   if (value instanceof Map) {
      return {
         $type: "Map",
         value: Array.from(value.entries()),
      };
   }
   if (value instanceof Set) {
      return {
         $type: "Set",
         value: Array.from(value.values()),
      };
   }
   return value;
}
gt.replacer = replacer;
gt.jsonReplacer = replacer;

export function reviver(key: string, value: any): any {
   if (typeof value === "object" && value !== null) {
      if (value.$type === "Map") {
         return new Map(value.value);
      }
      if (value.$type === "Set") {
         return new Set(value.value);
      }
   }
   return value;
}
gt.reviver = reviver;
gt.jsonReviver = reviver;
