import { useGameState } from "../Global";
import { useCurrentTick } from "../logic/ClientUpdate";

const gt = globalThis as any;

export function ResourceHappinessTooltip(): React.ReactNode {
   const tick = useCurrentTick();
   const gs = useGameState();

   return (
      <div style={{ minWidth: 180 }}>
         <div>
            <b>Happiness:</b>
         </div>
         <div>
            Current: {Math.round(tick.happiness?.value ?? 0)}
         </div>
         <div>
            Uncapped: {Math.round(tick.happiness?.uncapped ?? 0)}
         </div>
         <div>&nbsp;</div>
         <div>
            From buildings: -{Math.round(tick.happiness?.negative.fromBuildings ?? 0)}
         </div>
         <div>
            From techs: {Math.round(tick.happiness?.positive.fromUnlockedTech ?? 0)}
         </div>
         <div>
            From ages: {Math.round(tick.happiness?.positive.fromUnlockedAge ?? 0)}
         </div>
         <div>
            From wonders: {Math.round(tick.happiness?.positive.fromWonders ?? 0)}
         </div>
      </div>
   );
}

