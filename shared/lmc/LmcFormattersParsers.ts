import { FESTIVAL_CONVERSION_RATE } from "../logic/Constants";
import { getFestivalPoints } from "./CiScripts";
import { zeroAllButXHighestDigits } from "./MiscFuncs";

const gt = globalThis as any;

export function formatFestivalPoints(festivalPts: number = getFestivalPoints()): string {
   const festivalSeconds = Math.floor(festivalPts / FESTIVAL_CONVERSION_RATE);
   const festivalMinutes = zeroAllButXHighestDigits(festivalSeconds / 60, 2);
   const festivalHours = zeroAllButXHighestDigits(festivalSeconds / 3600, 2);

   if (festivalSeconds < 60) {
      return festivalSeconds + "s";
   }
   else if (festivalSeconds < 60 * 60) {
      return festivalMinutes + "m";
   }
   else {
      return festivalHours + "h";
   }
}
gt.formatFestivalPoints = formatFestivalPoints;
