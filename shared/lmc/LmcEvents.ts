
// ===== ===== =====
// LmcEvents.ts

import type { GameState } from "../logic/GameState";
import { TypedEvent } from "../utilities/TypedEvent";

const gt = globalThis as any;

export type GameStateAndOfflineFlagEvent = {
   gs: GameState;
   offline: boolean;
};

export const OnAtBottomOfTickEverySecond = new TypedEvent<GameStateAndOfflineFlagEvent>();
gt.OnAtBottomOfTickEverySecond = OnAtBottomOfTickEverySecond;

export const OnSoonAfterGameStartedOrLoaded = new TypedEvent<GameStateAndOfflineFlagEvent>();
gt.OnSoonAfterGameStartedOrLoaded = OnSoonAfterGameStartedOrLoaded;

// tileX, tileY, isLeftClick, grid.x,grid.y, gs, e
export const OnCityTileSelected = new TypedEvent();
gt.OnCityTileSelected = OnCityTileSelected;

// tileX, tileY, isLeftClick
export const OnWorldTileSelected = new TypedEvent();
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

export type UserIdChangedEvent = {
   prevUserId: string | null;
   newUserId: string | null;
};

export const OnUserIdChanged = new TypedEvent<UserIdChangedEvent>();
gt.OnUserIdChanged = OnUserIdChanged;

export const OnAtEndOfClearIntraTickCache = new TypedEvent();
gt.OnAtEndOfClearIntraTickCache = OnAtEndOfClearIntraTickCache;

// LmcEvents.ts
// ===== ===== =====
