import Tippy from "@tippyjs/react";
import { Config } from "../../../shared/logic/Config";
import { MAX_OFFLINE_PRODUCTION_SEC } from "../../../shared/logic/Constants";
import {
   ExtraTileInfoTypes,
   getTranslatedPercentage,
   type ExtraTileInfoType,
} from "../../../shared/logic/GameState";
import { notifyGameOptionsUpdate, notifyGameStateUpdate } from "../../../shared/logic/GameStateLogic";
import {
   PRIORITY_MAX,
   PRIORITY_MIN,
   STOCKPILE_CAPACITY_MAX,
   STOCKPILE_CAPACITY_MIN,
   STOCKPILE_MAX_MAX,
   STOCKPILE_MAX_MIN,
} from "../../../shared/logic/Tile";
import { clearTransportSourceCache } from "../../../shared/logic/Update";
import {
   clamp,
   formatHM,
   formatPercent,
   keysOf,
   safeParseInt,
   sizeOf,
} from "../../../shared/utilities/Helper";
import { L, t } from "../../../shared/utilities/i18n";
import { useGameOptions, useGameState } from "../Global";
import { jsxMapOf } from "../utilities/Helper";
import { openUrl } from "../utilities/Platform";
import { playClick } from "../visuals/Sound";
import { ChangeSoundComponent } from "./ChangeSoundComponent";
import { LanguageSelect } from "./LanguageSelectComponent";
import { MenuComponent } from "./MenuComponent";
import { RenderHTML } from "./RenderHTMLComponent";
import { TextWithHelp } from "./TextWithHelpComponent";
import { WarningComponent } from "./WarningComponent";
import { TitleBarComponent } from "./TitleBarComponent";

import { lilModCli } from "../../../shared/lmc/LilModCli";
import { ToggleComponent } from "./ToggleComponent";

export function LmcOptionPage(): React.ReactNode {
   const options = useGameOptions();
   const gs = useGameState();
   return (
      <div className="window">
         <TitleBarComponent>{t(L.Gameplay)}</TitleBarComponent>
         <MenuComponent />
         <div className="window-body">
            <fieldset>
               <legend>Lilianne's Modded Client options</legend>

               <ToggleComponent
                  title="Disable Easter Eggs"
                  contentHTML=""
                  value={false}
                  onValueChange={(value) => {
                     playClick();
                     //options.greedyTransport = value;
                     //notifyGameOptionsUpdate(options);
                  }}
               />
            </fieldset>

            <fieldset>
               <legend>Transport</legend>

               <ToggleComponent
                  title="Enable balanced transports"
                  contentHTML=""
                  value={lilModCli.isOption("balancedTransports")}
                  onValueChange={(value) => {
                     playClick();
                     lilModCli.toggleOption("balancedTransports");
                     notifyGameOptionsUpdate(options);
                  }}
               />

               <ToggleComponent
                  title="Ignore max distance when building/upgrading"
                  contentHTML=""
                  value={lilModCli.isOption("ignoreMaxDistanceWhenBuildingOrUpgrading")}
                  onValueChange={(value) => {
                     playClick();
                     lilModCli.toggleOption("ignoreMaxDistanceWhenBuildingOrUpgrading");
                     notifyGameOptionsUpdate(options);
                  }}
               />
            </fieldset>

            <fieldset>
               <legend>Markets</legend>

               <ToggleComponent
                  title="Don't sell less for more"
                  contentHTML=""
                  value={lilModCli.isOption("marketsDontSellLessForMore")}
                  onValueChange={(value) => {
                     playClick();
                     lilModCli.toggleOption("marketsDontSellLessForMore");
                     notifyGameOptionsUpdate(options);
                  }}
               />

               <ToggleComponent
                  title="Don't sell at loss"
                  contentHTML=""
                  value={lilModCli.isOption("marketsDontSellAtLoss")}
                  onValueChange={(value) => {
                     playClick();
                     lilModCli.toggleOption("marketsDontSellAtLoss");
                     notifyGameOptionsUpdate(options);
                  }}
               />

               <ToggleComponent
                  title="Manage Food"
                  contentHTML=""
                  value={lilModCli.isOption("marketManageFoods")}
                  onValueChange={(value) => {
                     playClick();
                     lilModCli.toggleOption("marketManageFoods");
                     notifyGameOptionsUpdate(options);
                  }}
               />

               <div className="row">
                  <div className="f1 mr20">
                     <div>{"Buy if amount lower than"}</div>
                  </div>
                  <input
                     type="text"
                     style={{ width: 80, textAlign: "right" }}
                     value={lilModCli.getOption("marketsSellFoodsIfHigher")}
                     onChange={(e) => {
                        const eValue = e.target.value.trim();
                        lilModCli.setOption("marketsSellFoodsIfHigher", eValue);
                        //notifyGameOptionsUpdate();
                     }}
                  />
               </div>

               <div className="row">
                  <div className="f1 mr20">
                     <div>{"Sell if amount higher than"}</div>
                  </div>
                  <input
                     type="text"
                     style={{ width: 80, textAlign: "right" }}
                     value={lilModCli.getOption("marketsBuyFoodsIfLower")}
                     onChange={(e) => {
                        const eValue = e.target.value.trim();
                        lilModCli.setOption("marketsBuyFoodsIfLower", eValue);
                        //notifyGameOptionsUpdate();
                     }}
                  />
               </div>
            </fieldset>

            <fieldset>
               <legend>Autoupgrade buildings</legend>

               <ToggleComponent
                  title="Keep upgrading lowest level buildings"
                  contentHTML=""
                  value={lilModCli.isOption("autoUpgradeBuildingsEnabled")}
                  onValueChange={(value) => {
                     playClick();
                     lilModCli.toggleOption("autoUpgradeBuildingsEnabled");
                     notifyGameOptionsUpdate(options);
                  }}
               />

               <div className="row mv5">
                  <div className="f1">Autoupgrade after X buildings build</div>
                  <input
                     type="number"
                     step="1"
                     max="100"
                     min="2"
                     style={{ width: "75px" }}
                     value={lilModCli.getOption("autoUpgradeBuildingsMinCount")}
                     onChange={(e) => {
                        const parsed = safeParseInt(e.target.value);
                        if (Number.isFinite(parsed) && parsed >= 2 && parsed <= 100) {
                           lilModCli.setOption("autoUpgradeBuildingsMinCount", parsed);
                           notifyGameOptionsUpdate(options);
                        }
                     }}
                  />
               </div>

               <div className="row mv5">
                  <div className="f1">Autoupgrade at most one building per X</div>
                  <input
                     type="number"
                     step="1"
                     max="1000"
                     min="2"
                     style={{ width: "75px" }}
                     value={lilModCli.getOption("autoUpgradeBuildingsOnePerX")}
                     onChange={(e) => {
                        const parsed = safeParseInt(e.target.value);
                        if (Number.isFinite(parsed) && parsed >= 2 && parsed <= 1000) {
                           lilModCli.setOption("autoUpgradeBuildingsOnePerX", parsed);
                           notifyGameOptionsUpdate(options);
                        }
                     }}
                  />
               </div>

               <div className="row mv5">
                  <div className="f1">Maximum autoupgrade level</div>
                  <input
                     type="number"
                     step="1"
                     max="100"
                     min="2"
                     style={{ width: "75px" }}
                     value={lilModCli.getOption("autoUpgradeBuildingsMaxLevel")}
                     onChange={(e) => {
                        const parsed = safeParseInt(e.target.value);
                        if (Number.isFinite(parsed) && parsed >= 2 && parsed <= 100) {
                           lilModCli.setOption("autoUpgradeBuildingsMaxLevel", parsed);
                           notifyGameOptionsUpdate(options);
                        }
                     }}
                  />
               </div>

               <ToggleComponent
                  title="Autoupgrade power plants"
                  contentHTML="Keep upgrading power plants. Note this option can cause power outages."
                  value={lilModCli.isOption("autoUpgradeBuildingsPowerPlants")}
                  onValueChange={(value) => {
                     playClick();
                     lilModCli.toggleOption("autoUpgradeBuildingsPowerPlants");
                     notifyGameOptionsUpdate(options);
                  }}
               />

               <ToggleComponent
                  title="Autoupgrade paused buildings"
                  contentHTML=""
                  value={lilModCli.isOption("autoUpgradeBuildingsPausedBuildings")}
                  onValueChange={(value) => {
                     playClick();
                     lilModCli.toggleOption("autoUpgradeBuildingsPausedBuildings");
                     notifyGameOptionsUpdate(options);
                  }}
               />

               <ToggleComponent
                  title="Autoupgrade mines with no max level"
                  contentHTML="Keep upgrading mines and other pure producers with no max level."
                  value={lilModCli.isOption("autoUpgradeBuildingsMinesNoMaxLevel")}
                  onValueChange={(value) => {
                     playClick();
                     lilModCli.toggleOption("autoUpgradeBuildingsMinesNoMaxLevel");
                     notifyGameOptionsUpdate(options);
                  }}
               />
            </fieldset>

            <fieldset>
               <legend>User interface</legend>

               <ToggleComponent
                  title="Disable spinners"
                  contentHTML="Some UI options will not refresh until you reload the game."
                  value={lilModCli.isOption("disableSpinners")}
                  onValueChange={(value) => {
                     playClick();
                     lilModCli.toggleOption("disableSpinners");
                     notifyGameOptionsUpdate(options);
                  }}
               />
            </fieldset>

            <fieldset>
               <legend>Maps</legend>

               <ToggleComponent
                  title="Show coords in city map"
                  value={lilModCli.isOption("cityMapShowCoords")}
                  onValueChange={(value) => {
                     playClick();
                     lilModCli.toggleOption("cityMapShowCoords");
                     notifyGameOptionsUpdate(options);
                  }}
               />

               <ToggleComponent
                  title="Show coords in world map"
                  value={lilModCli.isOption("worldMapShowCoords")}
                  onValueChange={(value) => {
                     playClick();
                     lilModCli.toggleOption("worldMapShowCoords");
                     notifyGameOptionsUpdate(options);
                  }}
               />

               <ToggleComponent
                  title="Show both EV and % in city map"
                  value={lilModCli.isOption("cityMapShowBothEvAndPct")}
                  onValueChange={(value) => {
                     playClick();
                     lilModCli.toggleOption("cityMapShowBothEvAndPct");
                     notifyGameOptionsUpdate(options);
                  }}
               />
            </fieldset>

            <fieldset>
               <legend>Experimental</legend>

               <ToggleComponent
                  title="Always use full import capacity"
                  contentHTML="If some per-cycle imports are set, always use full import capacity proportionally to the per-cycle import settings."
                  value={lilModCli.isOption("alwaysUseFullImportCapacity")}
                  onValueChange={(value) => {
                     playClick();
                     lilModCli.toggleOption("alwaysUseFullImportCapacity");
                     notifyGameOptionsUpdate(options);
                  }}
               />

               <ToggleComponent
                  title="Potato transports v1"
                  contentHTML="EXPERIMENTAL: uses less transports to improve performance. May cause transport delays depending on your stockpile settings."
                  value={lilModCli.isOption("enablePotatoTransports1")}
                  onValueChange={(value) => {
                     playClick();
                     lilModCli.toggleOption("enablePotatoTransports1");
                     notifyGameOptionsUpdate(options);
                  }}
               />
            </fieldset>
         </div>
      </div>
   );
}

