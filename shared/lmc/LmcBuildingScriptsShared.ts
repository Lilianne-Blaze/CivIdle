// LmcBuildingScriptsShared.ts

import { getGameState } from "../logic/GameStateLogic";
import {
   atMostOncePerXSecs, shuffleMap,
   sortMapByValue
} from "./MiscFuncs";

import { isSpecialBuilding, isWorldOrNaturalWonder } from '../logic/BuildingLogic';
import { Config } from "../logic/Config";
import { getXyBuildings } from "../logic/IntraTickCache";
import { Tick } from "../logic/TickLogic";
import { clamp, tileToPoint } from "../utilities/Helper";
import { lilModCli, lilModOption } from "./LilModCli";
import { BuildingIsPowerPlant, BuildingIsPureProducer, BuildingIsStorage, PrimaryWonders, SecondaryWonders } from "./LmcConstsEarly";
import { type GameStateAndOfflineFlagEvent } from "./LmcEvents";
import { showToastSafe } from "./LmcScriptsShared";

const gt = globalThis as any;

export function maybeUpgradeBuildings(e: GameStateAndOfflineFlagEvent): void {
   const gs = e.gs ?? getGameState();
   const MAX = Number.MAX_SAFE_INTEGER;
   const aubEnabled = lilModCli.isOption("autoUpgradeBuildingsEnabled");
   const aubMinCount = clamp(lilModCli.getOption("autoUpgradeBuildingsMinCount"), 2, MAX);
   const aubOnePerX = clamp(lilModCli.getOption("autoUpgradeBuildingsOnePerX"), 2, MAX);
   const aubMaxLevel = clamp(lilModCli.getOption("autoUpgradeBuildingsMaxLevel"), 1, MAX);
   const aubPowerPlants = lilModCli.isOption("autoUpgradeBuildingsPowerPlants");
   const aubStorages = lilModCli.isOption(lilModOption.autoUpgradeBuildingsStorages);
   const aubPausedBuildings = lilModCli.isOption("autoUpgradeBuildingsPausedBuildings");
   const aubMinesNoMaxLevel = lilModCli.isOption("autoUpgradeBuildingsMinesNoMaxLevel");
   const aubPrimaryWonders = lilModCli.isOption(lilModOption.autoUpgradeBuildingsPrimaryWonders);
   const aubSecondaryWonders = lilModCli.isOption(lilModOption.autoUpgradeBuildingsSecondaryWonders);
   const aubSpecialWonders = lilModCli.isOption(lilModOption.autoUpgradeBuildingsSpecialWonders);

   //    addSystemMessage(`aubMinCount=${aubMinCount}, aubOnePerX=${aubOnePerX}`);

   if (!aubEnabled || aubMinCount < 2) {
      return;
   }

   if (!atMostOncePerXSecs("keepUpgradingBuildings", 5)) {
      return;
   }

   //addSystemMessage(`243 pp = ${aubPowerPlants} pb=${aubPausedBuildings}`);

   const mapXyBuilding = getXyBuildings(gs);
   const mapBuildingTypeCount = new Map();
   const mapBuildingTypeMinLevel = new Map();
   const mapBuildingTypeUpgrading = new Map();
   for (const [xy, building] of mapXyBuilding) {

      // ignore special buildings and world/natural wonders
      if (isSpecialBuilding(building.type) || isWorldOrNaturalWonder(building.type)) {
         continue;
      }

      // addSystemMessage(`Building1: ${building.type} ${building.level} ${building.desiredLevel} ${building.id} ${xy}`);
      mapBuildingTypeCount.set(building.type, (mapBuildingTypeCount.get(building.type) || 0) + 1);
      mapBuildingTypeMinLevel.set(
         building.type,
         Math.min(mapBuildingTypeMinLevel.get(building.type) || 1000, building.level),
      );

      // if (building.level >= 1 && building.desiredLevel !== building.level) {
      if (building.desiredLevel !== building.level) {
         mapBuildingTypeUpgrading.set(building.type, (mapBuildingTypeUpgrading.get(building.type) || 0) + 1);
      }
   }

   for (const [type, count] of mapBuildingTypeCount) {
      if (count < aubMinCount) {
         mapBuildingTypeCount.delete(type);
      }
   }

   if (!aubPowerPlants) {
      for (const [type, count] of mapBuildingTypeCount) {
         if (BuildingIsPowerPlant[type as keyof typeof BuildingIsPowerPlant]) {
            mapBuildingTypeCount.delete(type);
         }
      }
   }
   if (!aubStorages) {
      for (const [type, count] of mapBuildingTypeCount) {
         if (BuildingIsStorage[type as keyof typeof BuildingIsStorage]) {
            mapBuildingTypeCount.delete(type);
         }
      }
   }

   for (const [type, count] of mapBuildingTypeCount) {
      const minLevel = mapBuildingTypeMinLevel.get(type);
      //addSystemMessage(`Building4: ${type} ${count} ${minLevel} ${(mapBuildingTypeUpgrading.get(type) || 0)}`);
      const mapXyToLevel = new Map(); // buildings, not upgrading/building
      for (const [xy, building] of mapXyBuilding) {
         const sameType = building.type === type;
         const finished = building.level === building.desiredLevel;
         const turnedOff = building.capacity === 0;
         if (sameType && finished && (aubPausedBuildings || !turnedOff)) {
            mapXyToLevel.set(xy, building.level);
         }
      }
      if (mapXyToLevel.size <= 1) {
         continue;
      }

      let typeMaxLevel = aubMaxLevel;
      if (aubMinesNoMaxLevel) {
         if (BuildingIsPureProducer[type as keyof typeof BuildingIsPureProducer]) {
            typeMaxLevel = MAX;
         }
      }

      const mapXyToLevel2 = shuffleMap(mapXyToLevel);
      const mapXyToLevel3 = sortMapByValue(mapXyToLevel2);

      //        for (const [xy, level] of mapXyToLevel3) {
      //addSystemMessage(`Building5c: t=${type} l=${level} xy=${xy}`);
      //        }

      //const maxUpgradesCap = Math.floor(mapXyToLevel3.size / aubOnePerX); // max upgrades allowed total
      const maxUpgradesCap = clamp(Math.floor(mapXyToLevel3.size / aubOnePerX), 1, MAX); // max upgrades allowed total
      //        addSystemMessage(`maxUpgradesCap=${maxUpgradesCap}`);
      const upgradingNum = mapBuildingTypeUpgrading.get(type) || 0;
      //        addSystemMessage(`upgradingNum=${upgradingNum}`);
      const maxNewUpgrades = maxUpgradesCap - upgradingNum; // max new upgrades allowed now
      //        addSystemMessage(`maxNewUpgrades=${maxNewUpgrades}`);

      let cStartedUpgrading = 0;
      for (const [xy, level] of mapXyToLevel3) {
         const building = mapXyBuilding.get(xy);
         if (!building) {
            continue;
         }
         //            addSystemMessage(`xy=${xy} building.type=${building.type}`);
         if (cStartedUpgrading >= maxNewUpgrades || building.level >= typeMaxLevel) {
            break;
         }
         if (!aubPausedBuildings && building.capacity == 0) {
            continue;
         }

         const desiredLevel = building.level + 1;

         const xyPoint = tileToPoint(xy);
         //addSystemMessage(`Upgrading ${type} at ${xyPoint.x},${xyPoint.y} to ${desiredLevel}`);
         showToastSafe(`Upgrading ${type} at ${xyPoint.x},${xyPoint.y} to ${desiredLevel}`);

         building.desiredLevel = desiredLevel;
         building.status = "upgrading";
         cStartedUpgrading++;
      }
   }

   // process Wonders

   for (const [xy, building] of mapXyBuilding) {
      if (!isWorldOrNaturalWonder(building.type)) {
         continue;
      } else if (building.level != building.desiredLevel) {
         // already building or upgrading
         continue;
      }

      if ((aubPrimaryWonders && (building.type in PrimaryWonders)) ||
         (aubSecondaryWonders && (building.type in SecondaryWonders))) {

         const newDesiredLevel = building.level + 1;
         building.desiredLevel = newDesiredLevel;
         building.status = "upgrading";
      }

   }

}
gt.maybeUpgradeBuildings = maybeUpgradeBuildings;


export function hasSwissBank(): boolean {
   try {
      const sbTile = Tick.current.specialBuildings.get("SwissBank");
      return !!sbTile;
   } catch (err) {
      return false;
   }
}
gt.hasSwissBank = hasSwissBank;

export function hasPompidou(): boolean {
   try {
      const sbTile = Tick.current.specialBuildings.get("PompidouCentre" as keyof typeof Config.Building);
      return !!sbTile;
   } catch (err) {
      return false;
   }
}

gt.hasPompidou = hasPompidou;

export function hasNonEmptySwissBank(): boolean {
   try {
      const sbTile = Tick.current.specialBuildings.get("SwissBank");
      const sbBuilding = sbTile?.building;
      return (sbBuilding?.resources?.Koti ?? 0) > 0;
   } catch (err) {
      return false;
   }
}
gt.hasNonEmptySwissBank = hasNonEmptySwissBank;

export function hasCompletedOrUpgradingSwissBank(): boolean {
   try {
      const sbTile = Tick.current.specialBuildings.get("SwissBank");
      const sbBuilding = sbTile?.building;
      return sbBuilding?.status === "completed" || sbBuilding?.status === "upgrading";
   } catch (err) {
      return false;
   }
}
gt.hasCompletedOrUpgradingSwissBank = hasCompletedOrUpgradingSwissBank;


export function countBuildingByType(type: keyof typeof Config.Building, gs = getGameState()): number {
   const mapXyBuilding = getXyBuildings(gs);
   let count = 0;
   for (const building of mapXyBuilding.values()) {
      if (building.type === type) {
         count++;
      }
   }
   return count;
}
gt.countBuildingByType = countBuildingByType;

export function countBuildingLevelsByType(type: keyof typeof Config.Building, gs = getGameState()): number {
   const mapXyBuilding = getXyBuildings(gs);
   let count = 0;
   for (const building of mapXyBuilding.values()) {
      if (building.type === type) {
         count += building.level;
      }
   }
   return count;
}
gt.countBuildingLevelsByType = countBuildingLevelsByType;

export type LmcBuildingStats = {
   count: number;
   countWorking: number;
   countUpgrading: number;
   countPaused: number;
   levelSum: number;
   levelAvg: number;
   levelMin: number;
   levelMax: number;
   levelsWorking: number;
   levelsUpgrading: number;
   levelsPaused: number;
}

export function newEmptyLmcBuildingStats(): LmcBuildingStats {
   return {
      count: 0,
      countWorking: 0,
      countUpgrading: 0,
      countPaused: 0,
      levelSum: 0,
      levelAvg: 0,
      levelMin: 0,
      levelMax: 0,
      levelsWorking: 0,
      levelsUpgrading: 0,
      levelsPaused: 0,
   };
}
gt.newEmptyLmcBuildingStats = newEmptyLmcBuildingStats;

export function getBuildingStatsByType(
   type: keyof typeof Config.Building,
   gs = getGameState(),
): LmcBuildingStats {
   const retVal = newEmptyLmcBuildingStats();
   try {
      const mapXyBuilding = getXyBuildings(gs);
      for (const building of mapXyBuilding.values()) {
         if (building.type === type) {
            retVal.count++;
            retVal.levelSum += building.level;
            if (building.capacity == 0) {
               retVal.levelsPaused += building.level;
               retVal.countPaused++;
            } else if (building.status === "upgrading" || building.status === "building") {
               retVal.levelsUpgrading += building.level;
               retVal.countUpgrading++;
            } else if (building.status === "completed") {
               retVal.levelsWorking += building.level;
               retVal.countWorking++;
            }
            if (retVal.levelMin === 0 || building.level < retVal.levelMin) {
               retVal.levelMin = building.level;
            }
            if (building.level > retVal.levelMax) {
               retVal.levelMax = building.level;
            }
         }
      }
      retVal.levelAvg = retVal.count > 0 ? retVal.levelSum / retVal.count : 0;
   } catch (err) { }
   return retVal;
}
gt.getBuildingStatsByType = getBuildingStatsByType;

export function getBuildingStatsByTypeShortString(
   type: keyof typeof Config.Building,
   gs = getGameState(),
): string {
   const stats = getBuildingStatsByType(type, gs);
   //return `${stats.count} blds, ${stats.levelSum} lvls, ${stats.levelAvg.toFixed(2)} avg, ${stats.levelMin} min, ${stats.levelMax} max`;
   // return `${stats.count} blds, ${stats.levelSum} lvls, ${stats.levelMin}-${stats.levelMax} / ${stats.levelAvg.toFixed(2)} m-m/a`;
   return `${stats.count} blds, ${stats.levelSum} lvls, ${stats.levelMin} - ${stats.levelMax} / ${stats.levelAvg.toFixed(2)} m-m/a`;
}
gt.getBuildingStatsByTypeShortString = getBuildingStatsByTypeShortString;
