import { useRef } from "react";
import type { Tech } from "../../../shared/definitions/TechDefinitions";
import { getScienceDeltaSmoothed } from "../../../shared/lmc/LmcScriptsShared";
import { getInfoAgeTechsSet, getNextAgeTechsSet, getNextUnlockableTechsSet, getSpecialTechsSet, techSetRemoveResearched } from "../../../shared/lmc/LmcTechScriptsShared";
import { formatMillisToYMDHM } from "../../../shared/lmc/MiscFuncs";
import { getCurrentAge, getScienceAmount, getTotalTechUnlockCost } from "../../../shared/logic/TechLogic";
import { L, t } from "../../../shared/utilities/i18n";
import { useFloatingMode, useGameOptions, useGameState } from "../Global";
import { useCurrentTick } from "../logic/ClientUpdate";
import { FormatNumber } from "./HelperComponents";

const gt = globalThis as any;

export function ResourceTechTooltip(): React.ReactNode {
   const tick = useCurrentTick();
   const gs = useGameState();
   const options = useGameOptions();
   const isFloating = useFloatingMode();
   const ref = useRef<HTMLDivElement>(null);

   const nextAvailableTechs = techSetRemoveResearched(getNextUnlockableTechsSet(gs));
   const nextAgeTechs = techSetRemoveResearched(getNextAgeTechsSet(gs));
   const infoAgeTechs = techSetRemoveResearched(getInfoAgeTechsSet(gs));
   const specialTechs = techSetRemoveResearched(getSpecialTechsSet(gs));

   const infoAgeReached = getCurrentAge(gs) === "InformationAge";
   const coldWarReached = infoAgeReached || getCurrentAge(gs) === "ColdWarAge";

   const preciseDeltas = false;
   const scienceDelta = getScienceDeltaSmoothed(preciseDeltas) ?? 0;
   const scienceAvailable = getScienceAmount(gs);

   const formatTechTime = function (techName: Tech) {
      const totalCost = getTotalTechUnlockCost(techName, gs).totalScience;
      const remainingCost = totalCost - scienceAvailable;
      if (remainingCost <= 0) {
         return "available";
      } else if (scienceDelta <= 0) {
         return "unknown";
      }
      const remainingMillis = remainingCost / scienceDelta * 1000;
      return formatMillisToYMDHM(remainingMillis);
   }

   return (

      <div style={{ minWidth: 180 }}>

         <div>
            <b>{t(L.Science)}</b>
         </div>
         <div className="row text-small">
            <FormatNumber value={scienceDelta} />
            &nbsp;sci/sec
         </div>
         <div className="row text-small">
            <FormatNumber value={scienceDelta * 3600} />
            &nbsp;sci/hour
         </div>
         <div className="row text-small">
            <FormatNumber value={scienceDelta * 3600 * 24} />
            &nbsp;sci/day
         </div>

         {nextAvailableTechs.size > 0 ? (
            <>
               <div>&nbsp;</div>
               <div><b>Next available:</b></div>
               {Array.from(nextAvailableTechs).map((techName) => (
                  <div className="row text-small" key={techName}>
                     {techName} - {formatTechTime(techName)}
                  </div>
               ))}
            </>
         ) : null}

         {!infoAgeReached && nextAgeTechs.size > 0 ? (
            <>
               <div>&nbsp;</div>
               <div><b>Next age:</b></div>
               {Array.from(nextAgeTechs).map((techName) => (
                  <div className="row text-small" key={techName}>
                     {techName} - {formatTechTime(techName)}
                  </div>
               ))}
            </>
         ) : null}

         {!coldWarReached && infoAgeTechs.size > 0 ? (
            <>
               <div>&nbsp;</div>
               <div><b>Info age:</b></div>
               {Array.from(infoAgeTechs).map((techName) => (
                  <div className="row text-small" key={techName}>
                     {techName} - {formatTechTime(techName)}
                  </div>
               ))}
            </>
         ) : null}

         {specialTechs.size > 0 ? (
            <>
               <div>&nbsp;</div>
               <div><b>Special:</b></div>
               {Array.from(specialTechs).map((techName) => (
                  <div className="row text-small" key={techName}>
                     {techName} - {formatTechTime(techName)}
                  </div>
               ))}
            </>
         ) : null}

      </div>
   );
}

