import { getGameOptions, getGameState } from "../logic/GameStateLogic";
import { getBuildingsByType, getXyBuildings } from "../logic/IntraTickCache";
import { getPermanentGreatPeopleLevel } from "../logic/RebirthLogic";
import { UserAttributes } from "../utilities/Database";
import { hasFlag } from "../utilities/Helper";


const gt = globalThis as any;

declare function getUser(): any;

export function hasSupporterPack(user = getUser()) {
   return hasFlag(user.attr, UserAttributes.DLC1);
}
gt.hasSupporterPack = hasSupporterPack;

export function getEffectiveGpLevel(opts = getGameOptions()) {
   return getPermanentGreatPeopleLevel(opts);
}
gt.getEffectiveGpLevel = getEffectiveGpLevel;

export function getMaxHutLevel(gs = getGameState()) {
   let result = 0;
   try {
      const allHuts = getBuildingsByType("Hut", getGameState());
      allHuts?.forEach((tile, xy) => {
         const l = tile?.building?.level;
         if (l > result) {
            result = l;
         }
      });
   } catch (e) { }
   return result;
}
gt.getMaxHutLevel = getMaxHutLevel;

export function getTotalBuildingLevels(gs = getGameState()) {
   let result = 0;
   try {
      const mapXyBuilding = getXyBuildings(gs);
      for (const [xy, building] of mapXyBuilding) {
         if (building.level) {
            result = result + building.level;
         }
      }
   } catch (e) { }
   return result;
}
gt.getTotalBuildingLevels = getTotalBuildingLevels;

// =====

export function getCiSteamId() {
   return getGameOptions().userId;
}
gt.getCiSteamId = getCiSteamId;

export function isValidCiSteamId(str = getCiSteamId()) {
   // Matches steam:<number> where number is 1–20 digits (covers all 64-bit numbers)
   return /^steam:(\d{1,20})$/.test(str);
}
gt.isValidCiSteamId = isValidCiSteamId;

export function getCiSteamIdNumber(str = getCiSteamId()) {
   const match = /^steam:(\d{1,20})$/.exec(str);
   return match ? match[1] : null;
}
gt.getCiSteamIdNumber = getCiSteamIdNumber;

// =====

export function getProcessEnvAsync(envVarName: string): Promise<string | null> {
   const script1 = `SteamClient.processEnv("${envVarName}")`;
   const prom1 = eval(script1);
   return prom1;
}
gt.getProcessEnvAsync = getProcessEnvAsync;

let appDataRoamingCached: string | null = null;

/**
 * Warning: will be null on first call.
 */
export function getAppDataRoaming() {
   if (appDataRoamingCached) {
      return appDataRoamingCached;
   }
   try {
      //   const script1 = `SteamClient.processEnv("AppData")`;
      //   const prom1 = eval(script1);
      //   prom1.then((res: any) => {
      //      appDataRoamingCached = res;
      //   });
      const prom1 = getProcessEnvAsync("AppData");
      prom1.then((res: any) => {
         appDataRoamingCached = res;
      });
   } catch (e) {
      console.error("Failed to get AppDataRoaming:", e);
   }
   return appDataRoamingCached;
}
gt.getAppDataRoaming = getAppDataRoaming;

// =====
