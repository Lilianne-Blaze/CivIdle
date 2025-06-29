// added here for better organization

import { GameOptions, GameState, SavedGame } from "../logic/GameState";

const gt = globalThis as any;

export function lmcMigrateSavedGameAtStart(save: SavedGame) {
    console.log("lmcMigrateSavedGameAtStart called.");

}

export function lmcMigrateSavedGameAtEnd(save: SavedGame) {

}

export function lmcInitializeGameStateAtStart(gameState: GameState, options: GameOptions) {
    console.log("lmcInitializeGameStateAtStart called.");

}

export function lmcInitializeGameStateAtEnd(gameState: GameState, options: GameOptions) {

}

export function lmcSaveGameAtStart() {

}

export function lmcSerializeSaveAtStart(save: SavedGame) {
    console.log("lmcSerializeSaveAtStart called.");

}

export function lmcDeserializeSaveAtEnd(save: SavedGame) {
    console.log("lmcDeserializeSaveAtEnd called.");

}

