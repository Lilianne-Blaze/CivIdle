

import { getGameOptions, getGameState, savedGame } from "../logic/GameStateLogic";
import {
   atMostOnce,
   atMostOncePerXSecs,
   calcApproxDeltaAdaptive,
   ceilTo,
   shuffleMap,
   sortMapByValue,
   zeroAllButXHighestDigits
} from "./MiscFuncs";

import { NoPrice, NoStorage } from "../definitions/ResourceDefinitions";
import { isSpecialBuilding, isWorldOrNaturalWonder } from '../logic/BuildingLogic';
import { getXyBuildings, unlockedResources } from "../logic/IntraTickCache";
import { getRebirthGreatPeopleCount } from "../logic/RebirthLogic";
import { combineResources } from "../logic/ResourceLogic";
import { Tick } from "../logic/TickLogic";
import { IUser } from '../utilities/Database';
import { clamp, keysOf, tileToPoint } from "../utilities/Helper";
import { getAppDataRoaming, getCiSteamIdNumber, getEffectiveGpLevel } from "./CiScripts";
import { lilModCli, lilModOption } from "./LilModCli";
import { hasCompletedOrUpgradingSwissBank } from "./LmcBuildingScriptsShared";
import { BuildingIsPowerPlant, BuildingIsPureProducer, BuildingIsStorage, fs, isFsLoaded, LONG_TERM_BACKUPS_EVERY_X_SECONDS, path, PrimaryWonders, SecondaryWonders } from "./LmcConstsEarly";
import { OnAtBottomOfTickEverySecond, type GameStateAndOfflineFlagEvent } from "./LmcEvents";
import { calcAtMostOncePerXSeconds } from "./MiscFuncs";

const gt = globalThis as any;

// =====

OnAtBottomOfTickEverySecond.on((e: GameStateAndOfflineFlagEvent) => {
   // if (atMostOncePerXSecs("32532532532", 60)) {
   //    lilModCli.ensureLoaded();
   // }

   keepUpgradingBuildings(e);

   maybePrintLastLongTermBackupName();
   maybeMakeLongTermBackup(LONG_TERM_BACKUPS_EVERY_X_SECONDS);

});
// =====

export declare function addSystemMessage(message: string): void;

export function addSystemMessageSafe(message: string): void {
   if (typeof addSystemMessage === "function") {
      addSystemMessage(message);
   }
}
gt.addSystemMessageSafe = addSystemMessageSafe;

export declare function showToast(content: string, timeout: number): void;

export function showToastSafe(content: string, timeout = 5000): void {
   if (typeof showToast === "function") {
      showToast(content, timeout);
   }
}
gt.showToastSafe = showToastSafe;

// =====

export function getSeenResourceKeys() {
   const cacheSecs = 1;
   return calcAtMostOncePerXSeconds("seenResourceKeys.retVal", cacheSecs, getSeenResourceKeys0);
}
gt.getSeenResourceKeys = getSeenResourceKeys;

function getSeenResourceKeys0() {
   const gameState = getGameState();
   const unlockedResourceKeys = keysOf(unlockedResources(gameState)).filter(
      (t) => !NoStorage[t] && !NoPrice[t],
   );
   const availableResources = combineResources(
      Array.from(Tick.current.playerTradeBuildings.values()).map((t) => t.resources),
   );
   const storageResourceKeys = keysOf(availableResources);
   const seenResourceKeys = unlockedResourceKeys.slice();
   storageResourceKeys.forEach((item) => {
      if (!seenResourceKeys.includes(item)) { seenResourceKeys.push(item); }
   });
   if (hasCompletedOrUpgradingSwissBank()) {
      if (!seenResourceKeys.includes("Koti")) { seenResourceKeys.push("Koti"); }
   }
   return seenResourceKeys;
}

export function getSeenResourcesTable() {
   // returns map like {"Water":true}
   const seenResourceKeys = getSeenResourceKeys();
   const result = {};
   seenResourceKeys.forEach((t: string) => {
      result[t] = true;
   });
   return result;
}
gt.getSeenResourceKeys = getSeenResourceKeys;

// ====

export function keepUpgradingBuildings(e: GameStateAndOfflineFlagEvent): void {
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
//globalThis.keepUpgradingBuildings = keepUpgradingBuildings;

// -----

// =====

export function secondsSinceRebirth(gameState = getGameState()): number | null {
   if (!gameState) {
      return null;
   }

   return gameState.seconds;
}
gt.secondsSinceRebirth = secondsSinceRebirth;

const gameStartedMillis = Date.now();

export function secondsSinceGameStarted(): number {
   const now = Date.now();
   const deltaMillis = now - gameStartedMillis;
   return deltaMillis / 1000;
}
gt.secondsSinceGameStarted = secondsSinceGameStarted;

/**
 * Checks if at least X seconds passed since the game started or since the last rebirth.
 */
export function withInitialDelay(seconds = 5): boolean {
   if ((secondsSinceGameStarted() ?? 0) < seconds || (secondsSinceRebirth() ?? 0) < seconds) {
      return false;
   }

   return true;
}
gt.withInitialDelay = withInitialDelay;

// =====

export function createLongTermBackupFilename(time = Date.now(), egpl = getEffectiveGpLevel()) {
   const date = new Date(time);

   const yyyy = date.getFullYear();
   const mm = String(date.getMonth() + 1).padStart(2, "0");
   const dd = String(date.getDate()).padStart(2, "0");
   const hh = String(date.getHours()).padStart(2, "0");
   const min = String(date.getMinutes()).padStart(2, "0");
   const x = String(egpl).padStart(4, "0");

   return `CivIdle_${yyyy}-${mm}-${dd}_${hh}-${min}_${x}_eGPL`;
}
gt.createLongTermBackupFilename = createLongTermBackupFilename;

export function getLongTermBackupPath(userId = getGameOptions().userId, createIfMissing = true): string | null {
   //const appDataRoaming = process.env.APPDATA;
   const appDataRoaming = getAppDataRoaming();
   const appName = "CivIdleLilModCli";
   const safeUserId = userId.replace(/:/g, "_");
   const ltb = "LongTermBackups";
   const p = path.join(appDataRoaming, appName, safeUserId, ltb);
   if (createIfMissing) {
      fs.mkdirSync(p, { recursive: true });
   }
   return p;
}
gt.getLongTermBackupPath = getLongTermBackupPath;

export function getUserScriptsPath(userId = getGameOptions().userId, createIfMissing = true) {
   //const appDataRoaming = process.env.APPDATA;
   const appDataRoaming = getAppDataRoaming();
   const appName = "CivIdleLilModCli";
   const safeUserId = userId.replace(/:/g, "_");

   console.log("getUserScriptsPath called: appDataRoaming=", appDataRoaming, ", safeUserId=", safeUserId);

   const us = "UserScripts";
   const p = path.join(appDataRoaming, appName, safeUserId, us);
   if (createIfMissing) {
      fs.mkdirSync(p, { recursive: true });
   }
   return p;
}
gt.getUserScriptsPath = getUserScriptsPath;

export function maybePrintLastLongTermBackupName() {
   if (!isFsLoaded()) { return null; }

   if (!withInitialDelay(30)) {
      return null;
   }

   if (!atMostOnce("maybePrintLastLongTermBackup")) {
      return null;
   }

   const lastLtbPath = getLastLongTermBackupName();
   if (lastLtbPath) {
      const msg = `Last long term backup created: ${lastLtbPath}`;
      console.log("[LongTermBackup]", msg);
      addSystemMessageSafe(msg);
   } else {
      const msg = "No long term backup found.";
      console.log("[LongTermBackup]", msg);
      addSystemMessageSafe(msg);
   }
}
gt.maybePrintLastLongTermBackupName = maybePrintLastLongTermBackupName;

export function maybeMakeLongTermBackup(everySeconds = 60 * 60 * 6) {
   if (!isFsLoaded()) { return null; }

   if (atMostOncePerXSecs("maybeMakeLongTermBackup.preload", 60 * 60)) {
      getAppDataRoaming();
   }

   if (!withInitialDelay(30)) {
      return null;
   }

   if (!atMostOncePerXSecs("maybeMakeLongTermBackup000", 5)) {
      // addSystemMessage("Too early for long term backup, atMostOncePerXSecs returned false");
      return;
   }

   if (true) {
      // cleanup
      lilModCli.deleteOption("lastLongTermBackupAtSeconds");
   }

   const lastLongTermBackupAtMillis = lilModCli.getOption("lastLongTermBackupAtMillis");
   const nowMillis = Date.now();
   const secsSinceLastBackup = (nowMillis - lastLongTermBackupAtMillis) / 1000;

   if (secsSinceLastBackup < everySeconds) {
      // addSystemMessage(
      //    `Too early for long term backup, secsSinceLastBackup=${secsSinceLastBackup} < everySeconds=${everySeconds}`,
      // );
      return null;
   }

   // const lmcOptions = getLilModCliOptions();
   // const lastLongTermBackupAtSeconds = lmcOptions?.lastLongTermBackupAtSeconds ?? 0;
   // const currentSeconds = getGameState().seconds;

   // //    addSystemMessage(`001 currentSeconds = ${currentSeconds}`);
   // //    addSystemMessage(`002 lastLongTermBackupAtSeconds = ${lastLongTermBackupAtSeconds}`);
   // //    addSystemMessage(`003 everySeconds = ${everySeconds}`);

   // const tooEarly = currentSeconds < lastLongTermBackupAtSeconds + everySeconds;
   // const noLastBackup = lastLongTermBackupAtSeconds == 0;
   // if (!noLastBackup && tooEarly && everySeconds > 0) {
   //    return null;
   // }

   // addSystemMessage("000");


   // addSystemMessage(`111 ${unused2}`);

   // // addSystemMessage(`444000 ${SteamClient.getAppPath("home")}`);

   // var x = `SteamClient.getAppPath("home")`;
   // var xx = eval(x);
   // addSystemMessage(`444001 ${x} = ${xx}`);

   // xx.then((e) => {
   //    addSystemMessage(`4440033 e = ${e}`);
   // });

   //addSystemMessage(`0000 ${appDataEnv}`);
   // addSystemMessage(`0001 ${globalThis.process}`);
   // addSystemMessage(`0002 ${globalThis.process.env}`);
   // addSystemMessage("000a " + process.env.APPDATA);
   // addSystemMessage("000b " + getCiSteamIdNumber());
   // addSystemMessage("000c " + path);
   const curSavePath = path.join(getAppDataRoaming(), "CivIdleSaves", getCiSteamIdNumber(), "CivIdle");
   // addSystemMessage(`001 ${curSavePath}`);
   const ltbSaveName = createLongTermBackupFilename(nowMillis);
   // addSystemMessage(`002 ${ltbSaveName}`);
   const ltbSavePath = path.join(getLongTermBackupPath(undefined, true), ltbSaveName);
   // addSystemMessage(`003 ${ltbSavePath}`);

   try {
      fs.copyFileSync(curSavePath, ltbSavePath);

      lilModCli.setOption("lastLongTermBackupAtMillis", nowMillis);
      const msg = `Long term backup ${ltbSaveName} created successfully.`;
      console.log("[LongTermBackup]", msg);
      addSystemMessageSafe(msg);
      return ltbSavePath;
   } catch (err) {
      const msg = `Error "${err}" creating long term backup ${ltbSaveName}`;
      console.log("[LongTermBackup]", msg);
      addSystemMessageSafe(msg);
      return null;
   }

   // const lastLongTermBackupAtMillis = lilModCli.getOption("lastLongTermBackupAtMillis");

   // try {
   //    fs.copyFileSync(curSavePath, ltbSavePath);
   //    lmcOptions.lastLongTermBackupAtSeconds = currentSeconds;
   //    //        addSystemMessage(`004 lmcOptions.lastLongTermBackupAtSeconds = ${lmcOptions.lastLongTermBackupAtSeconds}`);
   //    const msg = `Long term backup ${ltbSaveName} created successfully.`;
   //    console.log(msg);
   //    addSystemMessage(msg);
   //    return ltbSavePath;
   // } catch (err) {
   //    const msg = `Error "${err}" creating long term backup ${ltbSaveName}`;
   //    console.log(msg);
   //    addSystemMessage(msg);
   //    return null;
   // }
}
gt.maybeMakeLongTermBackup = maybeMakeLongTermBackup;

export function getLastLongTermBackupPath(): string | null {
   const path = getLongTermBackupPath(undefined, false);
   const lastBackupName = getLastLongTermBackupName();
   if (lastBackupName) {
      return path.join(path, lastBackupName);
   }
   return null;
}
gt.getLastLongTermBackupPath = getLastLongTermBackupPath;

export function getLastLongTermBackupName() {
   const ltbPath = getLongTermBackupPath(undefined, false);

   // addSystemMessage(`getLastLongTermBackupName: path=${ltbPath}`);

   // list all files in that path and return the name of the newest one that starts with "CivIdle_" and ends with "_eGPL"
   const files = fs.readdirSync(ltbPath);

   // addSystemMessage(`getLastLongTermBackupName: files=${JSON.stringify(files)}`);

   const candidateFiles = files.filter((file) => file.startsWith("CivIdle_") && file.endsWith("_eGPL"));
   // addSystemMessage(`getLastLongTermBackupName: candidateFiles=${JSON.stringify(candidateFiles)}`);

   if (candidateFiles.length === 0) {
      return null;
   }

   // sort by creation time, newest first
   // candidateFiles.sort((a, b) => {
   //    const aTime = fs.statSync(ltbPath.join(ltbPath, a)).birthtimeMs;
   //    const bTime = fs.statSync(ltbPath.join(ltbPath, b)).birthtimeMs;
   //    return bTime - aTime;
   // });

   candidateFiles.sort((a, b) => b.localeCompare(a));

   return candidateFiles[0];
}
gt.getLastLongTermBackupName = getLastLongTermBackupName;

// =====

export function atMostOncePerRebirthPerSession(name: string) {
   const gameId = savedGame.current.id ?? "unknown";
   const cacheKey = `${name}_${gameId}_amoprps`;
   return atMostOncePerXSecs(cacheKey, Number.MAX_SAFE_INTEGER);
}

declare const TimeSeries: any;

export function getTimeSeriesSafe(): any | null {
   try {
      if (typeof TimeSeries === "object" && TimeSeries.tick) {
         return TimeSeries
      }
   }
   catch (err) { }
   return null;
}
gt.getTimeSeriesSafe = getTimeSeriesSafe;

export function isTimeSeriesAvailable(): boolean {
   try {
      if (TimeSeries && typeof TimeSeries === "object" && TimeSeries.tick) {
         return true;
      }
   }
   catch (err) { }
   return false;
}
gt.isTimeSeriesAvailable = isTimeSeriesAvailable;


/**
 * Get the current science delta, ie the amount of science produced per second.
 * Returns 0 if it cannot be calculated, for example if the game is not started yet.
 */
export function getScienceDeltaSmoothed(precise = false): number | null {
   // let scienceDelta = 0;
   // if (isTimeSeriesAvailable() && TimeSeries.science.length > 1) {
   //    scienceDelta =
   //       TimeSeries.science[TimeSeries.science.length - 1] -
   //       TimeSeries.science[TimeSeries.science.length - 2];
   //    if (!precise) {
   //       scienceDelta = zeroAllButXHighestDigits(scienceDelta, 3);
   //    }
   // }
   let scienceDelta = calcApproxDeltaAdaptive(TimeSeries.science, 8);
   if (!precise) { scienceDelta = zeroAllButXHighestDigits(scienceDelta, 3); }
   return scienceDelta;
}
gt.getScienceDelta = getScienceDeltaSmoothed;

/**
 * Get the current empire value delta, ie the amount of science produced per second.
 * Returns 0 if it cannot be calculated, for example if the game is not started yet.
 */
export function getEmpireValueDeltaSmoothed(precise = false): number | null {
   // let evDelta = 0;
   // if (isTimeSeriesAvailable() && TimeSeries.empireValue.length > 1) {
   //    evDelta =
   //       TimeSeries.empireValue[TimeSeries.empireValue.length - 1] -
   //       TimeSeries.empireValue[TimeSeries.empireValue.length - 2];
   //    if (!precise) {
   //       evDelta = zeroAllButXHighestDigits(evDelta, 3);
   //    }
   // }
   let evDelta = calcApproxDeltaAdaptive(TimeSeries.empireValue, 8);
   if (!precise) { evDelta = zeroAllButXHighestDigits(evDelta, 3); }
   return evDelta;
}
gt.getEmpireValueDelta = getEmpireValueDeltaSmoothed;

// =====

export function getNextGpMilestones(currentGpAtRb = getRebirthGreatPeopleCount()): number[] {
   const result: number[] = [];
   let x = currentGpAtRb;

   result.push(currentGpAtRb + 1);
   result.push(currentGpAtRb + 2);
   result.push(currentGpAtRb + 3);

   x = currentGpAtRb + 4;
   result.push(ceilTo(x, 10));
   result.push(ceilTo(x + 10, 10));
   result.push(ceilTo(x + 20, 10));

   x = currentGpAtRb + 30;
   result.push(ceilTo(x, 100));
   result.push(ceilTo(x + 100, 100));
   result.push(ceilTo(x + 200, 100));

   x = currentGpAtRb + 300;
   result.push(ceilTo(x, 500));
   result.push(ceilTo(x + 500, 500));
   result.push(ceilTo(x + 1000, 500));

   return result;
}

declare function getUser(): IUser | null;

export function getUserSafe(): IUser | null {
   if (typeof getUser === "function") {
      return getUser();
   }
   return null;
}
gt.getUserSafe = getUserSafe;

