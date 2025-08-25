
const gt = globalThis as any;

export type TimedGuid48 = string;

export type TimeMillisAndUuid = { timeMillis: number; uuid: string };

export function newTimedGuid48(timeMillis = Date.now()): TimedGuid48 {
   let timeHex = timeMillis.toString(16).padStart(16, '0').slice(-16);
   let uuidHex = crypto.randomUUID().replace(/-/g, '');
   return timeHex + uuidHex;
}

/**
 * Splits a TimedGuid48 into its timestamp (epoch millis)
 * and UUID (in standard 8-4-4-4-12 notation).
 */
export function splitTimedGuid48(timedGuid: TimedGuid48): TimeMillisAndUuid {
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

/**
 * Merges a timestamp (as number) and a UUID (in standard notation) into a timed GUID.
 */
export function mergeTimedGuid48(timeMillis: number, uuid: string): TimedGuid48 {
   const timeHex = timeMillis.toString(16).padStart(16, '0').slice(-16);
   const uuidHex = uuid.replace(/-/g, '');
   return timeHex + uuidHex;
}

export function isTimedGuid48Newer(a: TimedGuid48, b: TimedGuid48): boolean {
   return a > b;
}

export function isTimedGuid48Older(a: TimedGuid48, b: TimedGuid48): boolean {
   return a < b;
}

export function areTimedGuid48WithinSecond(a: TimedGuid48, b: TimedGuid48): boolean {
   const aParts = splitTimedGuid48(a);
   const bParts = splitTimedGuid48(b);
   return Math.abs(aParts.timeMillis - bParts.timeMillis) < 1000;
}

gt.newTimedGuid48 = newTimedGuid48;
gt.splitTimedGuid48 = splitTimedGuid48;
gt.mergeTimedGuid48 = mergeTimedGuid48;
gt.isTimedGuid48Newer = isTimedGuid48Newer;
gt.isTimedGuid48Older = isTimedGuid48Older;
