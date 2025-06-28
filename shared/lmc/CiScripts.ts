import { getGameOptions, getGameState } from "../logic/GameStateLogic";
import { getBuildingsByType, getXyBuildings } from "../logic/IntraTickCache";
import { getPermanentGreatPeopleLevel } from "../logic/RebirthLogic";
import { UserAttributes } from "../utilities/Database";
import { hasFlag, humanFormat, NUMBER_SUFFIX_1 } from "../utilities/Helper";
import { fs, isFsLoaded, os, path } from "./LmcConstsEarly";
import { isTruthyStringSafe } from "./MiscFuncs";


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

export function getUserId(): string | null {
   return getGameOptions()?.userId;
}
gt.getUserId = getUserId;

export function getUserName() {
   return getUser().handle;
}
gt.getUserName = getUserName;

export function getUserHandle() {
   return getUser().handle;
}
gt.getUserHandle = getUserHandle;

export function getCurrentCity() {
   return getGameState().city;
}
gt.getCurrentCity = getCurrentCity;

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
   const script1 = `SteamClient.getProcessEnv("${envVarName}")`;
   const prom1 = eval(script1);
   return prom1;
}
gt.getProcessEnvAsync = getProcessEnvAsync;

let appDataRoamingCached: string | null = null;

/**
 * Warning: makes best effort to get the AppDataRoaming path, but in some cases may return null for some early calls.
 */
export function getAppDataRoaming() {
   if (appDataRoamingCached) {
      return appDataRoamingCached;
   }

   try {
      const val = process.env["AppData"];
      if (isTruthyStringSafe(val)) {
         appDataRoamingCached = val ?? appDataRoamingCached;
      } else {

         console.log("isFsLoaded: " + isFsLoaded());
         if (isFsLoaded()) {
            const homeDir = os.homedir();
            console.log("os.homedir(): " + homeDir);

            const tryLinux = path.join(homeDir, ".config/CivIdleLocal/CivIdle.log");
            const tryLinuxExists = fs.existsSync(tryLinux)
            console.log("File CivIdle.log exists in typical Linux path: " + tryLinuxExists);
            if (tryLinuxExists) {
               appDataRoamingCached = path.join(homeDir, ".config");
            }
         }
      }
   } catch (err) {
   }
   if (appDataRoamingCached) {
      return appDataRoamingCached;
   }

   try {
      const prom1 = getProcessEnvAsync("AppData");
      prom1.then((res: any) => {
         appDataRoamingCached = res;
         console.debug("getAppDataRoaming, using getProcessEnvAsync:", appDataRoamingCached);
      });
   } catch (e) {
      console.error("Failed to get AppDataRoaming (are we running in a browser?):", e);
   }
   return appDataRoamingCached;
}
gt.getAppDataRoaming = getAppDataRoaming;

// =====

export function formatNumberTradeTable(num: number | null | undefined, binary = false, scientific = false) {
   try {
      if (num === null || num === undefined) {
         return "0";
      }
      if (num <= 0) {
         return "0";
      }

      if (!Number.isFinite(num)) {
         return String(num);
      }

      return humanFormat(num, NUMBER_SUFFIX_1);
   } catch (e) {
      return "0";
   }
}
gt.formatNumberTradeTable = formatNumberTradeTable;

// =====