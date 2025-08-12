// LmcTechScriptsShared.ts

import { type Tech, type TechAge } from "../definitions/TechDefinitions";
import { Config } from "../logic/Config";
import type { GameState } from "../logic/GameState";
import { getGameState } from "../logic/GameStateLogic";
import { getAgeForTech, getCurrentAge, getNextAge, getScienceAmount, getTechUnlockCost, getTotalTechUnlockCost } from "../logic/TechLogic";
import { forEach } from "../utilities/Helper";
import { hasPompidou } from "./LmcBuildingScriptsShared";
import {
   addToSet,
   calcAtMostOncePerXSeconds,
   newSetValueIf
} from "./MiscFuncs";

const gt = globalThis as any;

/**
 * Get next unlockable techs, the ones with all direct prereqs unlocked, usually 4, can be 0-6 (?).
 */
export function getNextUnlockableTechsSet(gs: GameState = getGameState()): Set<Tech> {
   const result = new Set<Tech>();
   forEach(Config.Tech, (tech, def) => {
      if (gs.unlockedTech[tech]) {
         return;
      }
      if (def.requireTech.every((t) => gs.unlockedTech[t])) {
         result.add(tech);
      }
   });
   return result;
}
gt.getNextUnlockableTechsSet = getNextUnlockableTechsSet;


export function getNextAgeTechsSet(gs: GameState = getGameState()): Set<Tech> {
   const currentAge = getCurrentAge(gs);
   const nextAge = getNextAge(currentAge);
   if (!nextAge) {
      return new Set();
   }
   return getFirstColTechsForAgeSet(nextAge);
}
gt.getNextAgeTechsSet = getNextAgeTechsSet;

export function getInfoAgeTechsSet(gs: GameState = getGameState()): Set<Tech> {
   const infoAgeTechs = getFirstColTechsForAgeSet("InformationAge");
   return infoAgeTechs;
}


export function getSpecialTechsSet(gs: GameState = getGameState()): Set<Tech> {
   const specialTechs = new Set<Tech>([
      "Democracy",
      "Capitalism",
      "Skyscraper",
      "MonetarySystem", // Swiss bank
      "Software",
      "Future",
   ]);

   if (getGameState().city == "English") {
      specialTechs.add("Electricity"); // Tower bridge
      specialTechs.add("PrivateOwnership"); // EIC
   } else if (getGameState().city == "French" && !hasPompidou()) {
      specialTechs.add("Software");
   } else if (getGameState().city == "Ottoman") {
      specialTechs.add("FinancialLeverage"); // Penthouse
   }

   return sortTechSetByRemainingCost(specialTechs, gs);
}
gt.getSpecialTechsSet = getSpecialTechsSet;

/**
 * Get the cheapest tech in the Information Age, or empty set if all Info Age techs already researched.
 */
export function getCheapestInfoAgeTechSet(gs: GameState = getGameState()): Set<Tech> {
   const futureTechs = getFirstColTechsForAgeSet("InformationAge");
   let cheapestTech: Tech | null = null;
   let cheapestCost = Infinity;
   for (const tech of futureTechs) {
      const cost = getTotalTechUnlockCost(tech, gs).totalScience;
      if (cost != 0 && cost < cheapestCost) {
         cheapestCost = cost;
         cheapestTech = tech;
      }
   }
   return newSetValueIf(cheapestTech != null, cheapestTech);
}
gt.getCheapestInfoAgeTechSet = getCheapestInfoAgeTechSet;


export function getFirstColumnIndexForAge(age: TechAge): number {
   return Config.TechAge[age].from;
}
gt.getFirstColumnIndexForAge = getFirstColumnIndexForAge;

export function getFirstColTechsForAgeSet(age: TechAge): Set<Tech> {
   const firstCol = getFirstColumnIndexForAge(age);
   const result = new Set<Tech>();
   forEach(Config.Tech, (tech, def) => {
      if (getAgeForTech(tech) === age && def.column === firstCol) {
         result.add(tech);
      }
   });
   return result;
}
gt.getFirstColTechsForAge = getFirstColTechsForAgeSet;

/**
 * Get techs of interest, ie some preselected ones commonly considered milestones,
 * and optionally the next unlockable techs.
 */
export function getTechsOfInterest(gs: GameState = getGameState(), includeUnlockable = true): Set<Tech> {
   const result = new Set<Tech>();
   if (includeUnlockable) {
      forEach(Config.Tech, (techName, def) => {
         if (gs.unlockedTech[techName]) {
            return;
         }
         if (def.requireTech.every((t) => gs.unlockedTech[t])) {
            result.add(techName);
         }
      });
   }

   const currentAge = getCurrentAge(gs);
   if (currentAge !== "InformationAge") {
      const nextAge = getNextAge(currentAge)!;
      // for (const tech of getFirstColTechsForAge(nextAge)) {
      //    result.add(tech);
      // }
      addToSet(result, getFirstColTechsForAgeSet(nextAge));
   }

   const specialTechs = new Set<Tech>([
      "Democracy",
      "Capitalism",
      "Skyscraper",
      "MonetarySystem", // Swiss bank
      "Software",
      "Future"
   ]);
   addToSet(result, specialTechs);

   if (getGameState().city == "English") {
      specialTechs.add("Electricity"); // Tower bridge
      specialTechs.add("PrivateOwnership"); // EIC
   } else if (getGameState().city == "French" && !hasPompidou()) {
      specialTechs.add("Software");
   } else if (getGameState().city == "Ottoman") {
      specialTechs.add("FinancialLeverage"); // Penthouse
   }

   // delete already researched techs
   result.forEach((techName) => {
      if (gs.unlockedTech[techName]) {
         result.delete(techName);
      }
   });

   const sortedResult = Array.from(result).sort((a, b) => {
      return getTechUnlockCost(a) - getTechUnlockCost(b);
   });
   const sortedSet = new Set(sortedResult);
   return sortedSet;
}
gt.getTechsOfInterest = getTechsOfInterest;

export function getTechsOfInterestTable(gs: GameState = getGameState(), includeUnlockable = true): Partial<Record<Tech, boolean>> {
   const cacheSecs = 1;
   const cacheKey = `getTechsOfInterestTable,includeUnlockable=${includeUnlockable}`;
   const result = calcAtMostOncePerXSeconds(
      cacheKey, cacheSecs,
      () => {
         return getTechsOfInterestTable0(gs, includeUnlockable);
      });
   return result;
}
gt.getTechsOfInterestTable = getTechsOfInterestTable;

function getTechsOfInterestTable0(gs: GameState = getGameState(), includeUnlockable = true): Partial<Record<Tech, boolean>> {
   const result: Partial<Record<Tech, boolean>> = {};
   const techs = getTechsOfInterest(gs, includeUnlockable);
   const techList = Array.from(techs);
   techList.sort((a, b) => {
      return getTotalTechUnlockCost(a, gs).totalScience - getTotalTechUnlockCost(b, gs).totalScience;
   });
   techList.forEach((techName) => {
      result[techName] = true;
   });
   return result;
}


export function isTechUnlocked(tech: string, gs: GameState = getGameState()): boolean {
   return gs.unlockedTech[tech as keyof typeof Config.Tech] === true;
}
gt.isTechUnlocked = isTechUnlocked;


export function techSetRemoveResearched(techSet: Set<Tech>, gs: GameState = getGameState()): Set<Tech> {
   for (const tech of Array.from(techSet)) {
      if (gs.unlockedTech[tech]) {
         techSet.delete(tech);
      }
   }
   return techSet;
}
gt.techSetRemoveResearched = techSetRemoveResearched;

export function newTechSetWithoutResearched(techSet: Set<Tech>, gs: GameState = getGameState()): Set<Tech> {
   const result = new Set<Tech>();
   techSet.forEach((tech) => {
      if (!gs.unlockedTech[tech]) {
         result.add(tech);
      }
   });
   return result;
}
gt.newTechSetWithoutResearched = newTechSetWithoutResearched;

export function sortTechSetByUnlockCost(techSet: Set<Tech>, gs: GameState = getGameState()): Set<NonNullable<Tech>> {
   const techArray = Array.from(techSet);
   techArray.sort((a, b) => {
      return getTotalTechUnlockCost(a, gs).totalScience - getTotalTechUnlockCost(b, gs).totalScience;
   });
   return new Set(techArray);
}
gt.sortTechSetByUnlockCost = sortTechSetByUnlockCost;

export function sortTechSetByRemainingCost(techSet: Set<Tech>, gs: GameState = getGameState()): Set<NonNullable<Tech>> {
   const science = getScienceAmount(gs);
   const techArray = Array.from(techSet);
   techArray.sort((a, b) => {
      return getTotalTechUnlockCost(a, gs).totalScience - science - getTotalTechUnlockCost(b, gs).totalScience - science;
   });
   return new Set(techArray);
}
gt.sortTechSetByRemainingCost = sortTechSetByRemainingCost;