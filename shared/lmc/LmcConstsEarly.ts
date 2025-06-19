// ===== ===== =====
// LmcConstsEarly.ts

// Split into LcmConstsEarly.ts and LmcConstsLate.ts
// Keep only basic consts in LmcConstsEarly.ts to avoid messing up deps order
// What's safe: TypedEvent, Node.js modules

import { requireSafeFallback } from "./MiscFuncs";

const gt = globalThis as any;

export const LMC_MAJOR_VER = 23;
gt.LMC_MAJOR_VER = LMC_MAJOR_VER;

export const LMC_MINOR_VER = 11;
gt.LMC_MINOR_VER = LMC_MINOR_VER;

export const LMC_FOR_BUILD = 602;
gt.LMC_FOR_BUILD = LMC_FOR_BUILD;

export const LMC_VER_NOTE = "internal alpha";
gt.LMC_VER_NOTE = LMC_VER_NOTE;

export const LMC_NEWISH_VER_TRESHOLD = 23011;
gt.LMC_NEWISH_VER_TRESHOLD = LMC_NEWISH_VER_TRESHOLD;

export const LMC_TELEMETRY_PERIOD = 300;
gt.LMC_TELEMETRY_PERIOD = LMC_TELEMETRY_PERIOD;

export const NDS_CHANNEL_GUID = "0fcf075070a847aab4909f4ae8a54516";
export const LMCDATA_CHANNEL_GUID = "147523b231294bd3ac5793eab7ffcc72";

export const LONG_TERM_BACKUPS_EVERY_X_SECONDS = 60 * 60 * 6; // 6 hours
gt.LONG_TERM_BACKUPS_EVERY_X_SECONDS = LONG_TERM_BACKUPS_EVERY_X_SECONDS;

export const CustomRedOpenPadlock_png = "" + new URL("custom-red-open-padlock.png", import.meta.url).href;

export const CustomNukeDove100_png = "" + new URL("custom-nukedove100.png", import.meta.url).href;

export const path = requireSafeFallback("path");
gt.path = path;

export const fs = requireSafeFallback("fs");
gt.fs = fs;

export const isFsLoaded = fs && typeof fs.readFile === "function" && typeof fs.writeFile === "function";
gt.isFsLoaded = isFsLoaded;


// export const electron = require("electron");
// export const electronApp = electron.app;
// export const appDataEnv = electronApp.getPath("appData");

export const ResourceIsFood = {
   Wheat: true,
   Meat: true,
   Water: true,
   Alcohol: true,
   Cheese: true,
   Milk: true,
   Pizza: true,
   Bread: true,
   Flour: true,
};

export const ResourceIsBuildMaterial = {
   Wood: true,
   Stone: true,
   Coal: true,
   Iron: true,
   Copper: true,
   Sand: true,
   Lumber: true,
   Brick: true,
   Horse: true,
   Tool: true,
   Dynamite: true,
   Steel: true,
   Concrete: true,
};

export const ResourceIsCurrency = {
   Gold: true,
   Coin: true,
   Banknote: true,
   Bond: true,
   Stock: true,
   Forex: true,
   MutualFund: true,
   HedgeFund: true,
   Bitcoin: true,
};

export const ResourceIsIdea = {
   Gold: true,
   Coin: true,
   Banknote: true,
   Bond: true,
   Stock: true,
   Forex: true,
   MutualFund: true,
   HedgeFund: true,
   Bitcoin: true,
};

export const ResourceIsUltimate = {
   PlanetaryRover: true,
   Bitcoin: true,
};

export const BuildingIsPowerPlant = {
   CoalPowerPlant: true,
   GasPowerPlant: true,
   HydroDam: true,
   NuclearPowerPlant: true,
};

export const BuildingIsPureProducer = {
   Hut: true,
   WheatFarm: true,
   StoneQuarry: true,
   LoggingCamp: true,
   Aqueduct: true,
   IronMiningCamp: true,
   CopperMiningCamp: true,
   CoalMine: true,
   Sandpit: true,
   GoldMiningCamp: true,
   UraniumMine: true,
   OilWell: true,
   NaturalGasWell: true,
   AluminumSmelter: true,
   HydroDam: true,
   CottonPlantation: true,
}

// LmcConstsEarly.ts
// ===== ===== =====
