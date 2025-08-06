import { getGameOptions, getGameState } from "../logic/GameStateLogic";
import { getBuildingsByType, getGrid, getXyBuildings } from "../logic/IntraTickCache";
import { getPermanentGreatPeopleLevel } from "../logic/RebirthLogic";
import { Tick } from "../logic/TickLogic";
import { UserAttributes } from "../utilities/Database";
import { hasFlag, humanFormat, NUMBER_SUFFIX_1, pointToTile, Tile, tileToPoint, WEEK } from "../utilities/Helper";
import { fs, isFsLoaded, os, path } from "./LmcConstsEarly";
import { isTruthyStringSafe } from "./MiscFuncs";
import { ITileData } from "../logic/Tile";


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

   const homeDir = os.homedir();
   const osType = os.type(); // e.g., "Linux", "Windows_NT"
   console.log("getAppDataRoaming, os.type() =   " + osType + ", os.homedir() = " + homeDir);
   const subDir = osType === "Linux" ? ".config" : "AppData\\Roaming";
   const appDataPath = path.join(homeDir, subDir);
   const testDir = path.join(appDataPath, "CivIdleLocal");
   const testDirExists = appDataPath && testDir && fs.existsSync(testDir);
   if (testDirExists) {
      appDataRoamingCached = appDataPath;
      return appDataRoamingCached;
   }
   else {
      console.warn("getAppDataRoaming: WTF? Both Linux and Windows AppData paths do not exist.");
      console.log("osType: " + osType);
      console.log("homeDir: " + homeDir);
      console.log("appDataPath: " + appDataPath);
      console.log("testDir: " + testDir);
      console.log("testDirExists: " + testDirExists);
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

export function getFestivalPoints(): number {
   return Tick.current.specialBuildings.get("Headquarter")?.building.resources.Festival ?? 0;
}
gt.getFestivalPoints = getFestivalPoints;

// =====

export function playerNameMatchesAnyFragments(playerName: string, playerFragments: string): boolean {
   const fragments = playerFragments
      .split(/[;, \s]+/)
      .filter((fragment) => fragment.length > 0);
   for (const fragment of fragments) {
      if (fragment.endsWith("*")) {
         // if the fragment ends with a star, remove the star to use it as a prefix.
         const prefix = fragment.slice(0, -1);
         if (playerName.startsWith(prefix)) {
            return true;
         }
      } else {
         if (playerName.includes(fragment)) {
            return true;
         }
      }
   }
   return false;
}
gt.playerNameMatchesAnyFragments = playerNameMatchesAnyFragments;

// =====

export function getCurrentGameWeekNumber(): number {
   return Math.floor(Date.now() / WEEK);
}
gt.getCurrentGameWeekNumber = getCurrentGameWeekNumber;

export function getStartOfGameWeek(offset: number): number {
   const weekNumber = getCurrentGameWeekNumber() + offset;
   return weekNumber * WEEK;
}
gt.getStartOfGameWeek = getStartOfGameWeek;

// =====

type XyTileBoolFunc = (xy: Tile, tile: ITileData) => boolean;

/**
 * Get all neighboring tiles of the start tile.
 * NEEDS TESTING.
 * @param startTile The tileNum to find neighbors for.
 * @param gs The game state, optional.
 * @param incCond Optional condition to include a tile in the result, defaults to checking if the tile has a building.
 * @param removeLaterFunc Optional condition to remove a tile from the result after initial inclusion.
 * @returns A set of neighboring tileNums of the same building type.
 */
export function getAllNeighborTiles(startTile: Tile, gs = getGameState(),
   incCond?: XyTileBoolFunc,
   removeLaterFunc?: XyTileBoolFunc): Set<Tile> {
   const grid = getGrid(gs);
   const preresult = new Set<Tile>();
   const result = new Set<Tile>();
   if (incCond == null) {
      incCond = (xy, tile) => tile && tile.building && tile.building != null || false;
   }
   if (removeLaterFunc == null) {
      removeLaterFunc = (xy, tile) => false;
   }
   preresult.add(startTile);

   let lastSize = 0;
   do {
      lastSize = preresult.size;
      preresult.forEach((tile1num) => {
         for (const tile2point of grid.getNeighbors(tileToPoint(tile1num))) {
            const tile2num = pointToTile(tile2point);
            const tile2obj = gs.tiles.get(tile2num);
            if (tile2obj && incCond(tile2num, tile2obj)) {
               preresult.add(tile2num);
            }
         }
      });
   } while (lastSize !== preresult.size);

   preresult.forEach((tile1) => {
      const tile1obj = gs.tiles.get(tile1);
      if (tile1obj && !removeLaterFunc(tile1, tile1obj)) {
         result.add(tile1);
      }
   });

   return result
}
gt.getAllNeighborTiles = getAllNeighborTiles;

/**
 * Get all neighboring tiles of the same building type as the start tile.
 * NEEDS TESTING.
 * @param startTile The tileNum to find neighbors for.
 * @param gs The game state, optional.
 * @returns A set of neighboring tileNums of the same type.
 */
export function getAllNeighborTilesSameType(startTile: Tile, gs = getGameState()): Set<Tile> {
   const startTileObj = gs.tiles.get(startTile);
   const sameType: XyTileBoolFunc = (xy, tile) => {
      if (tile.building && startTileObj && startTileObj.building) {
         return startTileObj.building.type === tile.building.type;
      }
      return false;
   };
   const diffType: XyTileBoolFunc = (xy, tile) => {
      return !sameType(xy, tile);

   };
   return getAllNeighborTiles(startTile, gs, undefined, diffType);
}
gt.getAllNeighborTilesSameType = getAllNeighborTilesSameType;