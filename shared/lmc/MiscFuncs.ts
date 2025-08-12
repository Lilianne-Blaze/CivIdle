
// version 2025-06-15

const gt = globalThis as any;

// =====

export function isTruthy(v: any) {
   return isTruthyStringSafe(v);
}
gt.isTruthy = isTruthy;

export function isFalsy(v: any) {
   return isFalsyStringSafe(v);
}
gt.isFalsy = isFalsy;

export function isTruthyStringSafe(value: any) {
   if (typeof value === "boolean") return value;
   if (typeof value === "number") return value !== 0 && !Number.isNaN(value);
   if (value === null || value === undefined) return false;

   const str = String(value).trim().toLowerCase();
   return ["1", "true", "yes", "on"].includes(str);
}
gt.isTruthyStringSafe = isTruthyStringSafe;

export function isFalsyStringSafe(value: any) {
   if (typeof value === "boolean") return !value;
   if (typeof value === "number") return value === 0 || Number.isNaN(value);
   if (value === null || value === undefined) return true;

   const str = String(value).trim().toLowerCase();
   return ["0", "false", "no", "off", ""].includes(str);
}
gt.isFalsyStringSafe = isFalsyStringSafe;

// =====

/**
 * Returns a new Map with the same entries as the input map, but in random order.
 * Added before 2025-06-15.
 */
export function shuffleMap(map: Map<any, any>) {
   const entries = Array.from(map.entries());
   // Fisher-Yates Shuffle
   for (let i = entries.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [entries[i], entries[j]] = [entries[j], entries[i]];
   }

   return new Map(entries);
}
gt.shuffleMap = shuffleMap;

export function shuffleObjectProps<T extends Record<string, any>>(obj: T): T {
   const entries = Object.entries(obj);
   // Shuffle key-value pairs (entries) together
   for (let i = entries.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [entries[i], entries[j]] = [entries[j], entries[i]];
   }
   // Create a new object from the shuffled entries
   return Object.fromEntries(entries) as T;
}
gt.shuffleObjectProps = shuffleObjectProps;

/**
 * Returns a new Map with the same entries as the input map, but sorted by value.
 * Added before 2025-06-15.
 */
export function sortMapByValue(map: Map<any, any>) {
   const entries = Array.from(map.entries());

   entries.sort((a, b) => {
      const valA = a[1];
      const valB = b[1];

      if (typeof valA === "string" && typeof valB === "string") {
         return valA.localeCompare(valB); // for strings
      }

      if (valA instanceof Date && valB instanceof Date) {
         return valA.getTime() - valB.getTime();
      }

      if (typeof valA === "number" && typeof valB === "number") {
         return valA - valB;
      }

      // Fallback: convert to string and compare
      return String(valA).localeCompare(String(valB));
   });

   return new Map(entries);
}
gt.sortMapByValue = sortMapByValue;

// =====

export function zeroAllButThreeHighestDigits(num: number | string | null | undefined, notFiniteToZero = false) {
   return zeroAllButXHighestDigits(num, 3, notFiniteToZero ? 0 : undefined);
}
gt.zeroAllButThreeHighestDigits = zeroAllButThreeHighestDigits;

export function zeroAllButXHighestDigits(
   num: number | string | null | undefined,
   digits = 3,
   notFiniteValue: number | undefined = undefined
): number {
   if (digits < 1) throw new Error("digits must be at least 1");

   // Defensive: handle null, undefined, empty string, or non-numeric
   if (
      num === null ||
      num === undefined ||
      (typeof num === "string" && num.trim() === "") ||
      Number.
         isNaN(Number(num))
   ) {
      if (notFiniteValue !== undefined) { return notFiniteValue as number; }
      return Number(num); // Will be NaN
   }

   num = Number(num);

   if (!Number.isFinite(num)) {
      if (notFiniteValue !== undefined) { return notFiniteValue as number; }
      return num;
   }

   if (num === 0) { return 0; }

   const sign = num < 0 ? -1 : 1;
   const absNum = Math.abs(num);

   // The position of the most significant digit
   const order = Math.floor(Math.log10(absNum));
   const pow = order - digits + 1;

   if (pow >= 0) {
      const factor = 10 ** pow;
      return sign * Math.round(absNum / factor) * factor;
   } else {
      const factor = 10 ** -pow;
      return (sign * Math.round(absNum * factor)) / factor;
   }
}
gt.zeroAllButXHighestDigits = zeroAllButXHighestDigits;

// =====

/**
 * Attempts to require a module safely, returning a fallback value if the module is not found.
 * This is useful for optional dependencies or when the module may not be available in all environments.
 * Added 2025-06-15.
 */
export function requireSafeFallback(moduleName: string, fallback = undefined): any | undefined {
   if (typeof require !== "function") return fallback;
   if (typeof require.resolve === "function") {
      try {
         require.resolve(moduleName);
      } catch {
         return fallback;
      }
   }
   try {
      return require(moduleName);
   } catch {
      return fallback;
   }
}

// =====

const NUMBER_SUFFIX_1 = [
   "",
   "K",
   "M",
   "B",
   "T",
   "Qa",
   "Qt",
   "Sx",
   "Sp",
   "Oc",
   "Nn",
   "Dc",
   "UDc",
   "DDc",
   "TDc",
   "QaDc",
   "QtDc",
   "SxDc",
   "SpDc",
   "ODc",
   "NDc",
   "Vi",
   "UVi",
   "DVi",
   "TVi",
   "QaVi",
   "QtVi",
   "SxVi",
   "SpVi",
   "OcVi",
   "NnVi",
   "Tg",
   "UTg",
   "DTg",
   "TTg",
   "QaTg",
   "QtTg",
   "SxTg",
   "SpTg",
   "OcTg",
   "NnTg",
   "Qd",
   "UQd",
   "DQd",
   "TQd",
   "QaQd",
   "QtQd",
   "SxQd",
   "SpQd",
   "OcQd",
   "NnQd",
   "Qq",
   "UQq",
   "DQq",
   "TQq",
   "QaQq",
   "QtQq",
   "SxQq",
   "SpQq",
   "OcQq",
   "NnQq",
   "Sg",
];

/**
 * Parses a string to a number, tolerating various formats and suffixes.
 * Supports suffixes like K, M, B, T, etc. for thousands, millions, etc, and scientific notation.
 * If the string cannot be parsed, returns a fallback value (default is 0).
 */
export function parseNumberTolerant(str: string, fallbackValue = 0): number {
   const input = typeof str !== "string" ? String(str) : str;
   const trimmed = input.trim();
   let suffixIndex = -1;
   let matchedSuffix = "";
   for (let i = NUMBER_SUFFIX_1.length - 1; i > 0; --i) {
      const suff = NUMBER_SUFFIX_1[i];
      if (!suff) continue;
      if (
         trimmed.length > suff.length &&
         trimmed.slice(-suff.length).toLowerCase() === suff.toLowerCase()
      ) {
         suffixIndex = i;
         matchedSuffix = suff;
         break;
      }
   }
   let result: number;
   if (suffixIndex > 0) {
      const numPart = trimmed.slice(0, -matchedSuffix.length).trim();
      const base = Number.parseFloat(numPart);
      if (!Number.isFinite(base)) return fallbackValue;
      const factor = 10 ** (suffixIndex * 3);
      result = base * factor;
   } else {
      result = Number(trimmed);
   }
   if (!Number.isFinite(result)) return fallbackValue;
   return result;
}
gt.parseNumberTolerant = parseNumberTolerant;

// =====

/**
 * Attempts to extract a JSON object from a string, returns null if not found.
 */
export function extractJsonObjectFromString(str: string): string | null {
   const start = str.indexOf("{");
   const end = str.lastIndexOf("}");
   if (start === -1 || end === -1 || end < start) return null; // No valid object found
   return str.substring(start, end + 1);
}
gt.extractJsonObjectFromString = extractJsonObjectFromString;

// =====

// biome-ignore lint/complexity/useArrowFunction: <explanation>
export const atMostOncePerXSecs = (function () {
   const lastCalledMap = new Map();
   const MAX_ENTRIES = 100_000;

   function atMostOncePerXSecs(name: string, secs: number): boolean {
      const now = Date.now();
      const intervalMs = secs * 1000;
      const lastCall = lastCalledMap.get(name);

      if (lastCall !== undefined && now - lastCall < intervalMs) {
         return false; // Called too recently
      }

      // Enforce max size
      if (lastCalledMap.size >= MAX_ENTRIES && !lastCalledMap.has(name)) {
         // Remove oldest entry (first inserted)
         const oldestKey = lastCalledMap.keys().next().value;
         lastCalledMap.delete(oldestKey);
      }

      lastCalledMap.set(name, now);
      return true;
   }

   // Reset function
   // biome-ignore lint/complexity/useArrowFunction: <explanation>
   atMostOncePerXSecs.reset = function (name: string | undefined): void {
      if (name === undefined) {
         lastCalledMap.clear();
      } else {
         lastCalledMap.delete(name);
      }
   };

   return atMostOncePerXSecs;
})();
gt.atMostOncePerXSecs = atMostOncePerXSecs;

export function atMostOnce(name: string): boolean {
   return atMostOncePerXSecs(name, Number.MAX_SAFE_INTEGER);
}
gt.atMostOnce = atMostOnce;

// biome-ignore lint/complexity/useArrowFunction: <explanation>
export const calcAtMostOncePerXSeconds = (function () {
   const cache = new Map(); // name -> { time, value }
   const MAX_ENTRIES = 100_000;

   // biome-ignore lint/complexity/useArrowFunction: <explanation>
   return function (name: string, secs: number, evalFunc: () => any): any {
      const now = Date.now();
      const intervalMs = secs * 1000;
      const entry = cache.get(name);

      if (entry && now - entry.time < intervalMs) {
         return entry.value; // Use cached result
      }

      const result = evalFunc();

      if (!cache.has(name) && cache.size >= MAX_ENTRIES) {
         const oldestKey = cache.keys().next().value;
         cache.delete(oldestKey);
      }

      cache.set(name, { time: now, value: result });
      return result;
   };
})();
gt.calcAtMostOncePerXSeconds = calcAtMostOncePerXSeconds;

export const calcAtMostOncePerXSecs = calcAtMostOncePerXSeconds;
gt.calcAtMostOncePerXSecs = calcAtMostOncePerXSecs;

// =====

/**
 * Note: prefer one-by-one imports for clarity.
 */
export function assignModuleExportsToGlobal(
   mod: any,
   globalName: string | null = null,
   addToGlobal = true,
) {
   let container: any = null;
   if (globalName) {
      container = globalThis[globalName] = globalThis[globalName] || {};
   }
   for (const [key, value] of Object.entries(mod)) {

      if (addToGlobal && !(key in globalThis)) {
         globalThis[key] = value;
      }
      if (container && !(key in container)) {
         container[key] = value;
      }
   }
}
gt.assignModuleExportsToGlobal = assignModuleExportsToGlobal;

// =====

export function atMostOncePerSession(name: string) {
   return atMostOncePerXSecs(`${name}_amops`, Number.MAX_SAFE_INTEGER);
}

// =====

function pad(x: number): string { return x < 10 ? "0" + x : String(x); }
function clamp(t: number, min: number, max: number) { return Math.max(min, Math.min(max, t)); }
function getHMSfromMillis(ms: number): [number, number, number] {
   const totalSeconds = Math.floor(ms / 1000);
   const h = Math.floor(totalSeconds / 3600);
   const m = Math.floor((totalSeconds % 3600) / 60);
   const s = Math.floor(totalSeconds % 60);
   return [h, m, s];
}

export function formatMillisToYMDHM(timeMillis: number, dense = false): string {
   if (!Number.isFinite(timeMillis)) {
      return "--:--";
   }
   timeMillis = clamp(timeMillis, 0, Number.POSITIVE_INFINITY);

   const totalSeconds = Math.floor(timeMillis / 1000);
   const totalMinutes = Math.floor(totalSeconds / 60);
   const totalHours = Math.floor(totalSeconds / 3600);
   const totalDays = Math.floor(totalSeconds / 86400);
   const totalMonths = Math.floor(totalDays / 30);
   const totalYears = Math.floor(totalMonths / 12);

   const maybeSpace = dense ? "" : " ";

   if (totalYears >= 100) {
      return "100y+";
   }
   if (totalYears > 0) {
      // "yy y mm m"
      const months = totalMonths - totalYears * 12;
      return `${totalYears}y${maybeSpace}${months}m`;
   }
   if (totalMonths > 0) {
      // "mm m dd d"
      const days = totalDays - totalMonths * 30;
      return `${totalMonths}m${maybeSpace}${days}d`;
   }
   if (totalDays > 0) {
      // "dd d hh h"
      const hours = totalHours - totalDays * 24;
      return `${totalDays}d${maybeSpace}${hours}h`;
   }
   // "hh:mm"
   const hms = getHMSfromMillis(timeMillis);
   //return `${pad(hms[0])}:${pad(hms[1])}`;
   //return `${pad(hms[0])}h${maybeSpace}${pad(hms[1])}m`;
   return `${hms[0]}h${maybeSpace}${pad(hms[1])}m`;
}
gt.formatMillisToYMDHM = formatMillisToYMDHM;

// =====

export function ifZeroishThen(value: number, fallback: number): number {
   if (Number.isFinite(value) && value >= 1) {
      return value;
   } else {
      return fallback;
   }
}
gt.ifZeroishThen = ifZeroishThen;

export function nullsAndUndefsToZero<T>(value: number | null | undefined): number {
   if (value === null || value === undefined) {
      return 0;
   }
   if (typeof value === "number") {
      return value;
   }
   return 0;
}
gt.nullsAndUndefsToZero = nullsAndUndefsToZero;

// =====

/**
 * Calculates a robust approximate delta between two score windows,
 * adapting dynamically to smaller array sizes.
 *
 * @param numbersLatestNewest - Array of numeric scores, index 0 being newest.
 * @param windowSize - Desired number of items per averaging window (default 10).
 * @returns Approximate delta per second, or null if insufficient data.
 */
export function calcApproxDeltaAdaptive(
   numbersLatestNewest: number[],
   windowSize = 10
): number | null {
   if (numbersLatestNewest.length < 2) {
      // Can't calculate delta with fewer than 2 measurements
      return null;
   }
   const numbersReversed = numbersLatestNewest.slice().reverse();

   // Adjust window size to half the available data if not enough points
   const effectiveWindowSize = Math.min(windowSize, Math.floor(numbersReversed.length / 2));
   const trim = Math.floor(effectiveWindowSize / 4);

   const trimmedAverage = (arr: number[]): number => {
      if (trim === 0) {
         return arr.reduce((sum, val) => sum + val, 0) / arr.length;
      }
      const sorted = [...arr].sort((a, b) => a - b);
      const trimmed = sorted.slice(trim, sorted.length - trim);
      return trimmed.reduce((sum, val) => sum + val, 0) / trimmed.length;
   };

   const recentAvg = trimmedAverage(numbersReversed.slice(0, effectiveWindowSize));
   const previousAvg = trimmedAverage(numbersReversed.slice(effectiveWindowSize, effectiveWindowSize * 2));

   return (recentAvg - previousAvg) / effectiveWindowSize;
}
gt.calcApproxDeltaAdaptive = calcApproxDeltaAdaptive;

// =====

export function ceilTo(x: number, step: number): number {
   return Math.ceil(x / step) * step;
}
gt.ceilTo = ceilTo;

export function floorTo(x: number, step: number): number {
   return Math.floor(x / step) * step;
}
gt.ceilTo = ceilTo;

// =====

// Usage:
// sha1Hex("test123").then(console.log);  // e4c9b206a5ed0eb2df394d63b5a6e90c1e6e1879
export async function sha1Hex(input: any): Promise<string> {
   // Convert input string to a Uint8Array
   const encoder = new TextEncoder();
   const data = encoder.encode(input);

   // Perform the digest
   const hashBuffer = await crypto.subtle.digest("SHA-1", data);

   // Convert ArrayBuffer to hex string
   const hashArray = Array.from(new Uint8Array(hashBuffer));
   const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
   return hashHex;
}
gt.sha1Hex = sha1Hex;

// =====

export function copyMissingProps(fromObj: { [key: string | number | symbol]: any }, toObj: { [key: string | number | symbol]: any }) {
   for (const key of Object.keys(fromObj)) {
      if (!(key in toObj)) {
         toObj[key] = fromObj[key];
      }
   }
}
gt.copyMissingProps = copyMissingProps;

// =====

export function newTimedGuid48(timeMillis = Date.now()) {
   let timeHex = timeMillis.toString(16).padStart(16, '0').slice(-16);
   let uuidHex = crypto.randomUUID().replace(/-/g, '');
   return timeHex + uuidHex;
}
gt.newTimedGuid48 = newTimedGuid48;

/**
 * Splits a timed GUID (created by newTimedGuid48) into its timestamp (as a number)
 * and UUID (in standard 8-4-4-4-12 notation).
 */
export function splitTimedGuid48(timedGuid: string): { timeMillis: number; uuid: string } {
   const timeHex = timedGuid.slice(0, 16);
   const uuidHex = timedGuid.slice(16, 48);

   // Format UUID hex into standard UUID notation: 8-4-4-4-12
   const uuid = [
      uuidHex.slice(0, 8),
      uuidHex.slice(8, 12),
      uuidHex.slice(12, 16),
      uuidHex.slice(16, 20),
      uuidHex.slice(20, 32)
   ].join('-');

   const timeMillis = parseInt(timeHex, 16);

   return { timeMillis, uuid };
}
gt.splitTimedGuid48 = splitTimedGuid48;

/**
 * Merges a timestamp (as number) and a UUID (in standard notation) into a timed GUID.
 */
export function mergeTimedGuid48(timeMillis: number, uuid: string): string {
   const timeHex = timeMillis.toString(16).padStart(16, '0').slice(-16);
   const uuidHex = uuid.replace(/-/g, '');
   return timeHex + uuidHex;
}
gt.mergeTimedGuid48 = mergeTimedGuid48;

// =====

export function addToSet<T>(firstSet: Set<T>, secondSet: Set<T>): void {
   for (const item of secondSet) {
      firstSet.add(item);
   }
}
gt.addToSet = addToSet;

/**
 * Returns a new set, containing value if condition is met.
 */
export function newSetValueIf<T>(condition: boolean, value: T): Set<NonNullable<T>> {
   const result = new Set<NonNullable<T>>();
   if (condition) {
      result.add(value as NonNullable<T>);
   }
   return result;
}
gt.newSetValueIf = newSetValueIf;
