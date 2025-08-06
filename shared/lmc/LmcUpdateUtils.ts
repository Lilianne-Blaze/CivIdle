import type { ResourceDefinitions } from "../definitions/ResourceDefinitions";
import { getStorageFor } from "../logic/BuildingLogic";
import type { GameState } from "../logic/GameState";
import { getGameState } from "../logic/GameStateLogic";
import type { IBuildingData } from "../logic/Tile";
import type { Tile } from "../utilities/Helper";
import { GLOBAL_PARAMS } from "./LmcGlobalParams";

const gt = globalThis as any;

// WARNING: fragile, do not change without testing
export function decayBuildingResources(xy: Tile, building: IBuildingData, gs: GameState = getGameState()) {
   const { total, used } = getStorageFor(xy, gs);
   const negativeTotalStorage = used < 0;
   const storageOverflow = used > total;
   let negativeSomeStorages = false;

   const resKeys = Object.keys(building.resources) as Array<keyof ResourceDefinitions>;

   // check for very small negatives, zero each one first
   // to not trigger full decay cycle on tiny rounding errors
   for (const res of resKeys) {
      const amount = building.resources[res];
      if (amount != null && amount < 0 && amount >= -1000) {
         building.resources[res] = 0;
      }
   }

   // trigger decay cycle if we still have any negatives
   for (const res of resKeys) {
      const amount = building.resources[res];
      if (amount != null && amount < 0) {
         negativeSomeStorages = true;
      }
   }

   // on any negatives, decay all resources, negative and positive
   if (negativeTotalStorage || negativeSomeStorages) {
      for (const res of resKeys) {
         const amount = building.resources[res];
         if (amount != null) {
            if (amount < 0) {
               const newAmount = (amount < -1000) ? (amount * GLOBAL_PARAMS.FIXES_DECAY_BUILDING_PERCENTAGE) : 0;
               building.resources[res] = newAmount;
            } else if (amount > 0) {
               //const newAmount = amount * GLOBAL_PARAMS.FIXES_DECAY_BUILDING_PERCENTAGE;
               //building.resources[res] = newAmount;
            }
         }
      }
   } else if (storageOverflow) { // on overflow, decay only positive resources
      for (const res of resKeys) {
         const amount = building.resources[res];
         if (amount != null && amount > 0) {
            //const newAmount = amount * GLOBAL_PARAMS.FIXES_DECAY_BUILDING_PERCENTAGE;
            //building.resources[res] = newAmount;
         }
      }
   }

}
gt.decayBuildingResources = decayBuildingResources;
