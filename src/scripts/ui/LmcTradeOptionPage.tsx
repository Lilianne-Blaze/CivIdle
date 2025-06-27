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
   formatNumber,
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
import { useState } from "react";
import { ToggleComponent } from "./ToggleComponent";
import { parseNumberTolerant } from "../../../shared/lmc/MiscFuncs";

export function LmcTradeOptionPage(): React.ReactNode {
   const options = useGameOptions();
   const gs = useGameState();
   return (
      <div className="window">
         <TitleBarComponent>{t(L.Gameplay)}</TitleBarComponent>
         <MenuComponent />
         <div className="window-body">

            <WarningComponent icon="info" className="mb10 text-small">
               <RenderHTML html={"Most text fields accept both scientific (1e6, 12e9) and regular (1m, 12b) notation."} />
            </WarningComponent>

            <fieldset>

               <legend>Storage</legend>

               <ToggleComponent
                  title="Bigger stockpiles"
                  contentHTML="Doubles the limits, and enables more precise stockpile settings. Doesn't affect capacity."
                  value={lilModCli.isOption(lilModOption.buildingsBiggerStockpiles)}
                  onValueChange={(value) => {
                     playClick();
                     lilModCli.toggleOption(lilModOption.buildingsBiggerStockpiles);
                     notifyGameOptionsUpdate(options);
                  }}
               />

            </fieldset>

            <fieldset>

               <legend>Caravansaries</legend>

               <ToggleComponent
                  title="'I Offer' list always shows all goods"
                  contentHTML="Always show all goods, preventing flickering when goods quickly switch between available/unavailable."
                  value={lilModCli.isOption(lilModOption.carasIOfferShowEverything)}
                  onValueChange={(value) => {
                     playClick();
                     lilModCli.toggleOption(lilModOption.carasIOfferShowEverything);
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
                  value={lilModCli.isOption("marketsManageFoods")}
                  onValueChange={(value) => {
                     playClick();
                     lilModCli.toggleOption("marketsManageFoods");
                     notifyGameOptionsUpdate(options);
                  }}
               />

               <LmcAmountOptionRowComponent
                  optionName="marketsDontSellFoodIfBelow"
                  label="Don't sell food if amount is below"
               />

               <LmcAmountOptionRowComponent
                  optionName="marketsDontBuyFoodIfAbove"
                  label="Don't buy food if amount is above"
               />

               <ToggleComponent
                  title="Manage Building Materials"
                  contentHTML=""
                  value={lilModCli.isOption("marketsManageBuildMaterials")}
                  onValueChange={(value) => {
                     playClick();
                     lilModCli.toggleOption("marketsManageBuildMaterials");
                     notifyGameOptionsUpdate(options);
                  }}
               />

               <LmcAmountOptionRowComponent
                  optionName="marketsDontSellBuildMaterialsIfBelow"
                  label="Don't sell building materials if amount is below"
               />

               <LmcAmountOptionRowComponent
                  optionName="marketsDontBuyBuildMaterialsIfAbove"
                  label="Don't buy building materials if amount is above"
               />

               <ToggleComponent
                  title="Manage other goods"
                  contentHTML=""
                  value={lilModCli.isOption("marketsManageOthers")}
                  onValueChange={(value) => {
                     playClick();
                     lilModCli.toggleOption("marketsManageOthers");
                     notifyGameOptionsUpdate(options);
                  }}
               />

               <LmcAmountOptionRowComponent
                  optionName="marketsDontSellOthersIfBelow"
                  label="Don't sell other goods if amount is below"
               />

               <LmcAmountOptionRowComponent
                  optionName="marketsDontBuyOthersIfAbove"
                  label="Don't buy other goods if amount is above"
               />
            </fieldset>
         </div>
      </div>
   );
}

// =====

const defaultGetOption = (...args) => lilModCli.getOption(...args);
const defaultSetOption = (...args) => lilModCli.setOption(...args);
const defaultFormatNumber = (...args) => formatNumber(...args);
//const defaultParseNumber = (arg1) => lmcParseNumber2(arg1, true);
const defaultParseNumber = (arg1) => parseNumberTolerant(arg1, 0);

export function LmcAmountOptionRowComponent({
   getOption = defaultGetOption,
   setOption = defaultSetOption,
   formatNumber = defaultFormatNumber,
   parseNumber = defaultParseNumber,
   optionName,
   style = {},
   label = null,
}): React.ReactNode {
   const [inputValue, setInputValue] = useState(formatNumber(getOption(optionName)));

   // Optionally re-sync if the option changes externally:
   // React.useEffect(() => {
   //   setInputValue(formatNumber(getOption(optionName)));
   // }, [getOption(optionName)]);

   function commit(val) {
      const parsed = parseNumber(val);
      setOption(optionName, parsed);
      setInputValue(formatNumber(parsed));
   }

   return (
      <div className="row">
         <div className="f1 mr20">
            <div>{label ?? `Option: ${optionName}`}</div>
         </div>
         <input
            type="text"
            style={{ width: 80, textAlign: "right", ...style }}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={(e) => commit(e.target.value)}
            onKeyDown={(e) => {
               if (e.key === "Enter") {
                  commit(e.target.value);
                  e.target.blur(); // avoid double-commit
               }
            }}
         />
      </div>
   );
}

// =====
