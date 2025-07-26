import Tippy from "@tippyjs/react";
import { IOFlags, shouldAlwaysShowBuildingOptions } from "../../../shared/logic/BuildingLogic";
import { GameFeature, hasFeature } from "../../../shared/logic/FeatureLogic";
import { notifyGameStateUpdate } from "../../../shared/logic/GameStateLogic";
import { getBuildingIO } from "../../../shared/logic/IntraTickCache";
import {
   STOCKPILE_CAPACITY_MAX,
   STOCKPILE_CAPACITY_MIN,
   STOCKPILE_MAX_MAX,
   STOCKPILE_MAX_MIN,
} from "../../../shared/logic/Tile";
import { isEmpty } from "../../../shared/utilities/Helper";
import { L, t } from "../../../shared/utilities/i18n";
import { ApplyToAllComponent } from "./ApplyToAllComponent";
import type { IBuildingComponentProps } from "./BuildingPage";
import { lilModCli, lilModOption } from "../../../shared/lmc/LilModCli";

export function BuildingStockpileComponent({ gameState, xy }: IBuildingComponentProps): React.ReactNode {
   const building = gameState.tiles.get(xy)?.building;

   const biggerStockpiles = lilModCli.isOption(lilModOption.buildingsBiggerStockpiles);
   const stockpileStep = biggerStockpiles ? 1 : 5;
   const stockpileCapacityMax = biggerStockpiles ? STOCKPILE_CAPACITY_MAX * 2 : STOCKPILE_CAPACITY_MAX;
   const stockpileMaxMax = biggerStockpiles ? STOCKPILE_MAX_MAX * 2 : STOCKPILE_MAX_MAX;

   if (building == null) {
      return null;
   }
   if (!hasFeature(GameFeature.BuildingStockpileMode, gameState)) {
      return null;
   }
   if (
      isEmpty(getBuildingIO(xy, "input", IOFlags.None, gameState)) &&
      !shouldAlwaysShowBuildingOptions(building)
   ) {
      return null;
   }
   return (
      <fieldset>
         <legend>
            {t(L.StockpileSettings)}: {building.stockpileCapacity}x
         </legend>
         <div className="sep5"></div>
         <Tippy content={t(L.StockpileDesc, { capacity: building.stockpileCapacity })}>
            <input
               type="range"
               min={STOCKPILE_CAPACITY_MIN}
               max={stockpileCapacityMax}
               value={building.stockpileCapacity}
               onChange={(e) => {
                  building.stockpileCapacity = Number.parseInt(e.target.value, 10);
                  notifyGameStateUpdate();
               }}
            />
         </Tippy>
         <div className="sep15"></div>
         <ApplyToAllComponent
            xy={xy}
            getOptions={() => ({ stockpileCapacity: building.stockpileCapacity })}
            gameState={gameState}
         />
         <div className="sep10"></div>
         <div className="separator has-title">
            <div>
               {t(L.StockpileMax)}:{" "}
               {building.stockpileMax <= 0 ? t(L.StockpileMaxUnlimited) : `${building.stockpileMax}x`}
            </div>
         </div>
         <div className="sep5"></div>
         <Tippy
            content={
               building.stockpileMax <= 0
                  ? t(L.StockpileMaxUnlimitedDesc)
                  : t(L.StockpileMaxDesc, { cycle: building.stockpileMax })
            }
         >
            <input
               type="range"
               min={STOCKPILE_MAX_MIN}
               max={stockpileMaxMax}
               step={stockpileStep}
               value={building.stockpileMax}
               onChange={(e) => {
                  building.stockpileMax = Number.parseInt(e.target.value, 10);
                  notifyGameStateUpdate();
               }}
            />
         </Tippy>
         <div className="sep15"></div>
         <ApplyToAllComponent
            xy={xy}
            getOptions={() => ({ stockpileMax: building.stockpileMax })}
            gameState={gameState}
         />
      </fieldset>
   );
}
