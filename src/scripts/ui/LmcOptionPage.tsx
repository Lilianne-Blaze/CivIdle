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

import { lilModCli, lilModOption } from "../../../shared/lmc/LilModCli";
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
                  value={lilModCli.isOption(lilModOption.balancedTransports)}
                  onValueChange={(value) => {
                     playClick();
                     lilModCli.toggleOption(lilModOption.balancedTransports);
                     notifyGameOptionsUpdate(options);
                  }}
               />

               <ToggleComponent
                  title="Ignore max distance when building/upgrading"
                  contentHTML=""
                  value={lilModCli.isOption(lilModOption.ignoreMaxDistanceWhenBuildingOrUpgrading)}
                  onValueChange={(value) => {
                     playClick();
                     lilModCli.toggleOption(lilModOption.ignoreMaxDistanceWhenBuildingOrUpgrading);
                     notifyGameOptionsUpdate(options);
                  }}
               />
            </fieldset>

            <fieldset>
               <legend>Autoupgrade buildings</legend>

               <ToggleComponent
                  title="Keep upgrading lowest level buildings"
                  contentHTML=""
                  value={lilModCli.isOption(lilModOption.autoUpgradeBuildingsEnabled)}
                  onValueChange={(value) => {
                     playClick();
                     lilModCli.toggleOption(lilModOption.autoUpgradeBuildingsEnabled);
                     notifyGameOptionsUpdate(options);
                  }}
               />

               <div className="row mv5">
                  <div className="f1">Autoupgrade after X buildings build</div>
                  <input
                     type="number"
                     step="1"
                     max="1000"
                     min="2"
                     style={{ width: "75px" }}
                     value={lilModCli.getOption(lilModOption.autoUpgradeBuildingsMinCount)}
                     onChange={(e) => {
                        const parsed = safeParseInt(e.target.value);
                        if (Number.isFinite(parsed) && parsed >= 2 && parsed <= 1000) {
                           lilModCli.setOption(lilModOption.autoUpgradeBuildingsMinCount, parsed);
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
                     value={lilModCli.getOption(lilModOption.autoUpgradeBuildingsOnePerX)}
                     onChange={(e) => {
                        const parsed = safeParseInt(e.target.value);
                        if (Number.isFinite(parsed) && parsed >= 2 && parsed <= 1000) {
                           lilModCli.setOption(lilModOption.autoUpgradeBuildingsOnePerX, parsed);
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
                     max="1000"
                     min="2"
                     style={{ width: "75px" }}
                     value={lilModCli.getOption(lilModOption.autoUpgradeBuildingsMaxLevel)}
                     onChange={(e) => {
                        const parsed = safeParseInt(e.target.value);
                        if (Number.isFinite(parsed) && parsed >= 2 && parsed <= 1000) {
                           lilModCli.setOption(lilModOption.autoUpgradeBuildingsMaxLevel, parsed);
                           notifyGameOptionsUpdate(options);
                        }
                     }}
                  />
               </div>

               <ToggleComponent
                  title="Autoupgrade power plants"
                  contentHTML="Keep upgrading power plants. Note this option can cause power outages."
                  value={lilModCli.isOption(lilModOption.autoUpgradeBuildingsPowerPlants)}
                  onValueChange={(value) => {
                     playClick();
                     lilModCli.toggleOption(lilModOption.autoUpgradeBuildingsPowerPlants);
                     notifyGameOptionsUpdate(options);
                  }}
               />

               <ToggleComponent
                  title="Autoupgrade storage buildings"
                  contentHTML="Keep upgrading Warehouses and Caravansaries. Note this option can disrupt your supply chains."
                  value={lilModCli.isOption(lilModOption.autoUpgradeBuildingsStorages)}
                  onValueChange={(value) => {
                     playClick();
                     lilModCli.toggleOption(lilModOption.autoUpgradeBuildingsStorages);
                     notifyGameOptionsUpdate(options);
                  }}
               />

               <ToggleComponent
                  title="Autoupgrade paused buildings"
                  contentHTML=""
                  value={lilModCli.isOption(lilModOption.autoUpgradeBuildingsPausedBuildings)}
                  onValueChange={(value) => {
                     playClick();
                     lilModCli.toggleOption(lilModOption.autoUpgradeBuildingsPausedBuildings);
                     notifyGameOptionsUpdate(options);
                  }}
               />

               <ToggleComponent
                  title="Autoupgrade mines with no max level"
                  contentHTML="Keep upgrading mines and other pure producers with no max level."
                  value={lilModCli.isOption(lilModOption.autoUpgradeBuildingsMinesNoMaxLevel)}
                  onValueChange={(value) => {
                     playClick();
                     lilModCli.toggleOption(lilModOption.autoUpgradeBuildingsMinesNoMaxLevel);
                     notifyGameOptionsUpdate(options);
                  }}
               />
            </fieldset>

            <WarningComponent icon="info" className="mb10 text-small">
               <RenderHTML html={"Keep in mind that some UI options will refresh with a delay or after you reload the game."} />
            </WarningComponent>

            <fieldset>
               <legend>User interface</legend>

               <ToggleComponent
                  title="Disable spinners"
                  contentHTML="Some UI options will not refresh until you reload the game."
                  value={lilModCli.isOption(lilModOption.disableSpinners)}
                  onValueChange={(value) => {
                     playClick();
                     lilModCli.toggleOption(lilModOption.disableSpinners);
                     notifyGameOptionsUpdate(options);
                  }}
               />

               <ToggleComponent
                  title="Always scroll to bottom in chat"
                  contentHTML="If enabled, the chat will always scroll to the bottom when a new message arrives."
                  value={lilModCli.isOption(lilModOption.chatAlwaysScroll)}
                  onValueChange={(value) => {
                     playClick();
                     lilModCli.toggleOption(lilModOption.chatAlwaysScroll);
                     notifyGameOptionsUpdate(options);
                  }}
               />

            </fieldset>

            <fieldset>
               <legend>Maps</legend>

               <ToggleComponent
                  title="Show coords in city map"
                  contentHTML=""
                  value={lilModCli.isOption(lilModOption.cityMapShowCoords)}
                  onValueChange={(value) => {
                     playClick();
                     lilModCli.toggleOption(lilModOption.cityMapShowCoords);
                     notifyGameOptionsUpdate(options);
                  }}
               />

               <ToggleComponent
                  title="Show coords in world map"
                  contentHTML=""
                  value={lilModCli.isOption(lilModOption.worldMapShowCoords)}
                  onValueChange={(value) => {
                     playClick();
                     lilModCli.toggleOption(lilModOption.worldMapShowCoords);
                     notifyGameOptionsUpdate(options);
                  }}
               />

               <ToggleComponent
                  title="Show both EV and % in city map"
                  contentHTML=""
                  value={lilModCli.isOption(lilModOption.cityMapShowBothEvAndPct)}
                  onValueChange={(value) => {
                     playClick();
                     lilModCli.toggleOption(lilModOption.cityMapShowBothEvAndPct);
                     notifyGameOptionsUpdate(options);
                  }}
               />

               <ToggleComponent
                  title="Show better status icons"
                  contentHTML="Show more visible status icons in the city map"
                  value={lilModCli.isOption(lilModOption.mapBetterStatusIcons)}
                  onValueChange={(value) => {
                     playClick();
                     lilModCli.toggleOption(lilModOption.mapBetterStatusIcons);
                     notifyGameOptionsUpdate(options);
                  }}
               />

            </fieldset>

            <fieldset>
               <legend>Experimental</legend>

               <ToggleComponent
                  title="Always use full import capacity"
                  contentHTML="If some per-cycle imports are set, always use full import capacity proportionally to the per-cycle import settings."
                  value={lilModCli.isOption(lilModOption.alwaysUseFullImportCapacity)}
                  onValueChange={(value) => {
                     playClick();
                     lilModCli.toggleOption(lilModOption.alwaysUseFullImportCapacity);
                     notifyGameOptionsUpdate(options);
                  }}
               />

               <ToggleComponent
                  title="Potato transports v1"
                  contentHTML="EXPERIMENTAL: uses less transports to improve performance. May cause transport delays depending on your stockpile settings."
                  value={lilModCli.isOption(lilModOption.enablePotatoTransports1)}
                  onValueChange={(value) => {
                     playClick();
                     lilModCli.toggleOption(lilModOption.enablePotatoTransports1);
                     notifyGameOptionsUpdate(options);
                  }}
               />

               <WarningComponent icon="warning" className="mb10 text-small">
                  <RenderHTML html={"This blocks some transports to reduce the number of transports active at once." +
                     " It may cause delays in resource delivery, or slowdown overall production." +
                     " If you notice any anomalies, try increasing your stockpile limits."} />
               </WarningComponent>

               <ToggleComponent
                  title="Overflow/negative storage slowfix v1"
                  contentHTML="EXPERIMENTAL: if a storage has negative or overflowing resources it slowly 'decays' until it's in 0-100% range."
                  value={lilModCli.isOption(lilModOption.storageNegativeOrOverflowDecay)}
                  onValueChange={(value) => {
                     playClick();
                     lilModCli.toggleOption(lilModOption.storageNegativeOrOverflowDecay);
                     notifyGameOptionsUpdate(options);
                  }}
               />

            </fieldset>
         </div>
      </div>
   );
}

