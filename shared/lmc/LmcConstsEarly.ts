// ===== ===== =====
// LmcConstsEarly.ts

// Split into LcmConstsEarly.ts and LmcConstsLate.ts
// Keep only basic consts in LmcConstsEarly.ts to avoid messing up deps order
// What's safe: TypedEvent, Node.js modules

import { requireSafeFallback } from "./MiscFuncs";

const gt = globalThis as any;

export const LMC_MAJOR_VER = 23;
gt.LMC_MAJOR_VER = LMC_MAJOR_VER;

export const LMC_MINOR_VER = 219; // 2025-08-04
gt.LMC_MINOR_VER = LMC_MINOR_VER;

//export const LMC_VER_NUMBER = LMC_MAJOR_VER * 10000 + LMC_MINOR_VER * 100 + 0;
export const LMC_VER_NUMBER = LMC_MAJOR_VER * 1000 + LMC_MINOR_VER;
gt.LMC_VER_NUMBER = LMC_VER_NUMBER;

export const LMC_FOR_BUILD = 674; // 2025-08-06
gt.LMC_FOR_BUILD = LMC_FOR_BUILD;

export const LMC_VER_NOTE = "internal alpha";
gt.LMC_VER_NOTE = LMC_VER_NOTE;

export const LMC_NEWISH_VER_TRESHOLD = 23011;
gt.LMC_NEWISH_VER_TRESHOLD = LMC_NEWISH_VER_TRESHOLD;

export const LMC_TELEMETRY_PERIOD = 300;
gt.LMC_TELEMETRY_PERIOD = LMC_TELEMETRY_PERIOD;

// ===== ===== =====
// MQTT

export const CHANNEL_GUID_ROOT = "07ff03a6fac1483b8e0fda970dfb4196";
gt.CHANNEL_GUID_ROOT = CHANNEL_GUID_ROOT;

export const CHANNEL_GUID_NDS = "0fcf075070a847aab4909f4ae8a54516";
gt.CHANNEL_GUID_NDS = CHANNEL_GUID_NDS;

export const CHANNEL_GUID_LMCDATA = "147523b231294bd3ac5793eab7ffcc72";
gt.CHANNEL_GUID_LMCDATA = CHANNEL_GUID_LMCDATA;

export const CHANNEL_GUID_TEST1 = "238f9df3189f4f44b7b3a1aa8bdc63b9";
gt.CHANNEL_GUID_TEST1 = CHANNEL_GUID_TEST1;

export const CHANNEL_GUID_TEST2 = "93569526e5e540d2ba081fec300e4396";
gt.CHANNEL_GUID_TEST2 = CHANNEL_GUID_TEST2;

export const CHANNEL_GUID_BASIC_STATE = "95064c1924464310b962f8c88a049be0";
gt.CHANNEL_GUID_BASIC_STATE = CHANNEL_GUID_BASIC_STATE;

export const CHANNEL_GUID_EXTENDED_STATE = "997dc1945e624299ab03470bc0f45a10";
gt.CHANNEL_GUID_EXTENDED_STATE = CHANNEL_GUID_EXTENDED_STATE;

export const CHANNEL_GUID_MOD_VER = "9a4dfdf1919542688e4eae6c71cb6d1f";
gt.CHANNEL_GUID_MOD_VER = CHANNEL_GUID_MOD_VER;

export const MQTT_DEFAULT_EXPIRY_SECONDS = 60 * 60 * 24 * 31;
gt.MQTT_DEFAULT_EXPIRY_SECONDS = MQTT_DEFAULT_EXPIRY_SECONDS;

// ===== MQTT
// ===== ===== =====

export const LONG_TERM_BACKUPS_EVERY_X_SECONDS = 60 * 60 * 6; // 6 hours
gt.LONG_TERM_BACKUPS_EVERY_X_SECONDS = LONG_TERM_BACKUPS_EVERY_X_SECONDS;

export const POTATO_TRANSPORTS1_DIVIDER = 4;
gt.POTATO_TRANSPORTS1_DIVIDER = POTATO_TRANSPORTS1_DIVIDER;

// export const CustomRedOpenPadlock_png = "" + new URL("custom-red-open-padlock.png", import.meta.url).href;
// gt.CustomRedOpenPadlock_png = CustomRedOpenPadlock_png;

// export const CustomNukeDove100_png = "" + new URL("custom-nukedove100.png", import.meta.url).href;
// gt.CustomNukeDove100_png = CustomNukeDove100_png;

// export const CustomBlackCalculator_png = "" + new URL("custom-black-calculator.png", import.meta.url).href;
// gt.CustomBlackCalculator_png = CustomBlackCalculator_png;

export const path = requireSafeFallback("path");
gt.path = path;

export const fs = requireSafeFallback("fs");
gt.fs = fs;

export const os = requireSafeFallback("os");
gt.os = os;

export const isFsLoadedFlag = fs && typeof fs.readFile === "function" && typeof fs.writeFile === "function";
gt.isFsLoadedFlag = isFsLoadedFlag;

export function isFsLoaded(): boolean {
   return isFsLoadedFlag;
}
gt.isFsLoaded = isFsLoaded;

export const net = requireSafeFallback("net");
gt.net = net;

export const tls = requireSafeFallback("tls");
gt.tls = tls;

import mqtt from 'mqtt';
gt.mqtt = mqtt;

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
   Koti: true,
};

export const ResourceIsRoverMat = {
   Maglev: true,
   Radio: true,
   Supercomputer: true,
};
gt.ResourceIsRoverMat = ResourceIsRoverMat;

export const ResourceIsBitcoinMat = {
   HedgeFund: true,
   CivTok: true,
};
gt.ResourceIsBitcoinMat = ResourceIsBitcoinMat;

export const BuildingIsPowerPlant = {
   CoalPowerPlant: true,
   GasPowerPlant: true,
   HydroDam: true,
   NuclearPowerPlant: true,
};

export const BuildingIsStorage = {
   Warehouse: true,
   Caravansary: true,
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
};

export const PrimaryWonders = {
   DysonSphere: true,
   LargeHadronCollider: true,
   InternationalSpaceStation: true,
   AldersonDisk: true,
};
gt.PrimaryWonders = PrimaryWonders;

export const SecondaryWonders = {
   MarinaBaySands: true,
   PalmJumeirah: true,
   MatrioshkaBrain: true,
};
gt.SecondaryWonders = SecondaryWonders;

// TODO
export const SpecialWonders = {
   SantaClausVillage: true,
   YearOfTheSnake: true,
   EastIndiaCompany: true,
   MontSaintMichel: true,
   EasterBunny: true,
   SwissBank: true,
   ItaipuDam: true,
};
gt.SpecialWonders = SpecialWonders;

export const StarterBuildings = {
   Hut: true,
   LoggingCamp: true,
   StoneQuarry: true,
   Aqueduct: true,
};
gt.StarterBuildings = StarterBuildings;


// LmcConstsEarly.ts
// ===== ===== =====
