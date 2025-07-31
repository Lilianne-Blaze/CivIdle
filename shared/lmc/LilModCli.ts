//

import { LMC_MAJOR_VER, LMC_MINOR_VER, LMC_FOR_BUILD } from "./LmcConstsEarly";
import { isTruthyStringSafe, isFalsyStringSafe, atMostOncePerXSecs } from "./MiscFuncs";
import { getGameOptions } from "../logic/GameStateLogic";
import { getAppDataRoaming } from "./CiScripts";
//import { lmcEnsureMapsReady } from "./LmcMaps";

const gt = globalThis as any;

export const lilModOption = {

   // before v22
   buildingsBiggerStockpiles: "buildingsBiggerStockpiles",

   // v21
   marketsDontSellLessForMore: "marketsDontSellLessForMore",
   marketsDontSellAtLoss: "marketsDontSellAtLoss",

   marketsAlwaysBuildWonders: "marketsAlwaysBuildWonders",
   marketsDefaultRuleBlock: "marketsDefaultRuleBlock",
   marketsPrintSomeDebugMessages: "marketsPrintSomeDebugMessages",
   marketsBlockOnlyImports: "marketsBlockOnlyImports",

   // early v22
   debugFlag1: "debugFlag1",
   debugFlag2: "debugFlag2",
   debugFlag3: "debugFlag3",
   debugFlag4: "debugFlag4",
   debugNumber1: "debugNumber1",
   debugNumber2: "debugNumber2",
   debugNumber3: "debugNumber3",
   debugNumber4: "debugNumber4",

   // v21
   balancedTransports: "balancedTransports",

   // v21
   ignoreMaxDistanceWhenBuildingOrUpgrading: "ignoreMaxDistanceWhenBuildingOrUpgrading",

   // v21
   autoUpgradeBuildingsEnabled: "autoUpgradeBuildingsEnabled",
   autoUpgradeBuildingsMinCount: "autoUpgradeBuildingsMinCount",
   autoUpgradeBuildingsOnePerX: "autoUpgradeBuildingsOnePerX",
   autoUpgradeBuildingsMaxLevel: "autoUpgradeBuildingsMaxLevel",
   autoUpgradeBuildingsPowerPlants: "autoUpgradeBuildingsPowerPlants",
   autoUpgradeBuildingsStorages: "autoUpgradeBuildingsStorages",
   autoUpgradeBuildingsPausedBuildings: "autoUpgradeBuildingsPausedBuildings",
   autoUpgradeBuildingsMinesNoMaxLevel: "autoUpgradeBuildingsMinesNoMaxLevel",
   autoUpgradeBuildingsPrimaryWonders: "autoUpgradeBuildingsPrimaryWonders",
   autoUpgradeBuildingsSecondaryWonders: "autoUpgradeBuildingsSecondaryWonders",
   autoUpgradeBuildingsSpecialWonders: "autoUpgradeBuildingsSpecialWonders",

   // v21
   disableSpinners: "disableSpinners",

   // v23.11
   cityMapShowCoords: "cityMapShowCoords",
   worldMapShowCoords: "worldMapShowCoords",
   cityMapShowBothEvAndPct: "cityMapShowBothEvAndPct",

   // v23.11
   alwaysUseFullImportCapacity: "alwaysUseFullImportCapacity",

   // v23.11
   enablePotatoTransports1: "enablePotatoTransports1",

   // v23.11
   chatAlwaysScroll: "chatAlwaysScroll",
   mapBetterStatusIcons: "mapBetterStatusIcons",

   // v23.27
   logOutgoingMqttMessages: "logOutgoingMqttMessages",
   logIncomingMqttMessages: "logIncomingMqttMessages",

   // 2025-06-28
   carasIOfferShowEverything: "carasIOfferShowEverything",
   exportDebugJsonsOnSave: "exportDebugJsonsOnSave",

   storageNegativeOrOverflowDecay: "storageNegativeOrOverflowDecay",

   optoutCompetitive: "optoutCompetitive",


};
gt.lilModOption = lilModOption;

export const lilModOptionDefs = {

   // v23.11
   buildingsBiggerStockpiles: false,

   // v21
   marketsDontSellLessForMore: false,
   marketsDontSellAtLoss: false,

   marketsAlwaysBuildWonders: false,
   marketsDefaultRuleBlock: false,
   marketsPrintSomeDebugMessages: false,
   marketsBlockOnlyImports: true,

   // v21
   balancedTransports: true,

   // v21
   ignoreMaxDistanceWhenBuildingOrUpgrading: true,

   // v21
   autoUpgradeBuildingsEnabled: false,
   autoUpgradeBuildingsMinCount: 2,
   autoUpgradeBuildingsOnePerX: 10,
   autoUpgradeBuildingsMaxLevel: 40,
   autoUpgradeBuildingsPowerPlants: false,
   autoUpgradeBuildingsStorages: true,
   autoUpgradeBuildingsPausedBuildings: false,
   autoUpgradeBuildingsMinesNoMaxLevel: true,

   // v21
   disableSpinners: false,

   // v23.11
   cityMapShowCoords: true,
   worldMapShowCoords: true,
   cityMapShowBothEvAndPct: true,

   // v23.11
   alwaysUseFullImportCapacity: true,

   // v23.11
   enablePotatoTransports1: false,

   //v23.11
   chatAlwaysScroll: false,
   mapBetterStatusIcons: true,

   // v23.27
   logOutgoingMqttMessages: false,
   logIncomingMqttMessages: false,

   // 2025-06-28
   carasIOfferShowEverything: false,
   exportDebugJsonsOnSave: false,

   storageNegativeOrOverflowDecay: false,

   optoutCompetitive: false,


};
gt.lilModOptionDefs = lilModOptionDefs;

export const lilModCli = {
   getVersionDesc() {
      return `v${LMC_MAJOR_VER}.${LMC_MINOR_VER} for b${LMC_FOR_BUILD}`;
   },

   getVersionNum() {
      return LMC_MAJOR_VER * 1000 + LMC_MINOR_VER;
   },

   ensureLoaded() {
      const unused1 = getAppDataRoaming();

      ensureGlobalImportsLoaded();

      //lmcEnsureMapsReady();

      if (Math.random() > 10) {
         // never true
         console.log("LilModCli is loaded.");
         console.log(unused1);
      }
   },

   optionDefValues: {
      marketsTooLowAnyTreshold: 50e6,
      marketsTooLowSpecificTreshold: 100e6,
      marketsTooLowFoodsTreshold: 100e6,
      marketsTooLowBuMatsTreshold: 100e6,
      marketsTooLowCurrenciesTreshold: 100e6,
      marketsTooHighAnyTreshold: 500e6,
      potatoMode: false,

      marketsDontSellLessForMore: false,
      marketsDontSellAtLoss: false,

      marketsDontSellFoodIfTooLow: false,
      marketsDontSellCurrenciesIfTooLow: false,

      // 2025-06-14
      marketsManageFoods: false,
      marketsDontSellFoodIfBelow: 10e6,
      marketsDontBuyFoodIfAbove: 100e6,
      //marketsSellFoodsIfHigher: 100e6,
      //marketsBuyFoodsIfLower: 1e6,

      marketsManageBuildMaterials: false,
      marketsDontSellBuildMaterialsIfBelow: 10e6,
      marketsDontBuyBuildMaterialsIfAbove: 100e6,
      //marketsSellBuildMaterialsIfHigher: 100e6,
      //marketsBuyBuildMaterialsIfLower: 1e6,

      marketsManageCurrencies: false,
      marketsDontSellCurrenciesIfBelow: 10e6,
      marketsDontBuyCurrenciesIfAbove: 100e6,
      //marketsSellCurrenciesIfHigher: 100e6,
      //marketsBuyCurrenciesIfLower: 1e6,

      marketsManageOthers: false,
      marketsDontSellOthersIfBelow: 10e6,
      marketsDontBuyOthersIfAbove: 100e6,
      //marketsSellOthersIfHigher: 100e6,
      //marketsBuyOthersIfLower: 1e6,

      // -----

      autoUpgradeBuildingsEnabled: true,
      autoUpgradeBuildingsMinCount: 2,
      autoUpgradeBuildingsOnePerX: 10,
      autoUpgradeBuildingsMaxLevel: 42,
      autoUpgradeBuildingsPowerPlants: false,
      autoUpgradeBuildingsPausedBuildings: false,
      autoUpgradeBuildingsPrimaryWonders: false,
      autoUpgradeBuildingsSecondaryWonders: false,
      autoUpgradeBuildingsSpecialWonders: false,

      resPanelDeltaDisplayPeriod: 1,

      alwaysUseFullImportCapacity: true,

      enablePotatoTransports1: false,

      cityMapShowCoords: true,
      cityMapShowBothEvAndPct: true,
      worldMapShowCoords: true,


      test: "Test.",
   },

   isOption(optionName: string): boolean {
      //return getGameOptions().lilModCli?.[optionName] ?? this.optionDefValues[optionName] ?? false;
      return (
         isTruthyStringSafe(getGameOptions().lilModCli?.[optionName]) ??
         isTruthyStringSafe(this.optionDefValues[optionName]) ??
         false
      );
   },

   getOption(optionName: string) {
      //return getGameOptions().lilModCli?.[optionName] ?? this.optionDefValues[optionName] ?? undefined;
      const optVal = getGameOptions().lilModCli?.[optionName];
      return optVal ?? this.optionDefValues[optionName] ?? undefined;
   },

   setOption(optName: string, newVal: any) {
      const options = getGameOptions();
      options.lilModCli ??= {};
      options.lilModCli[optName] = newVal;
      //notifyGameOptionsUpdate(options);
      return newVal;
   },

   deleteOption(optName: string) {
      const options = getGameOptions();
      if (options.lilModCli && optName in options.lilModCli) {
         delete options.lilModCli[optName];
      }
   },

   toggleOption(optName: string) {
      const curVal = this.isOption(optName);
      const togVal = !curVal;
      return this.setOption(optName, togVal);
   },
};
gt.lilModCli = lilModCli;
