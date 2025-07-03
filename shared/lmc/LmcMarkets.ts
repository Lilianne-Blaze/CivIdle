import { NoPrice, Resource } from "../definitions/ResourceDefinitions";
import { Config } from "../logic/Config";
import { Tick } from "../logic/TickLogic";
import { clearObject, forEach, type Tile } from "../utilities/Helper";
import { lilModCli, lilModOption } from "./LilModCli";
import { ResourceIsBuildMaterial, ResourceIsCurrency, ResourceIsFood, ResourceIsUltimate } from "./LmcConstsEarly";
import { addSystemMessageSafe } from "./LmcScriptsShared";
import { OnAtEndOfClearIntraTickCache } from "./LmcEvents";
import type { GameState } from "../logic/GameState";
import { ifZeroishThen } from "./MiscFuncs";

// =====

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
const gt = globalThis as any;

export type CheckMarketTradeParams = {
   sellResource: string;
   buyResource: string;
   sellAmount: number;
   buyAmount: number;
   sellValue: number;
   buyValue: number;
   tradeValue: number;
   amountRatio: number;
   xy?: Tile;
   gs?: GameState;
   checkType: string;
};

OnAtEndOfClearIntraTickCache.on(() => {
   initMarketTradesCache();
});

/**
 * lmcMarketsCache is defined here for tracking which resources should not be sold or bought.
 * Use resource names as keys, based on ResourceDefinitions.
 */
const lmcMarketsCache = {
   dontSell: {} as Record<string, boolean>,
   dontBuy: {} as Record<string, boolean>
};
gt.lmcMarketsCache = lmcMarketsCache;

function initMarketTradesCache() {
   clearObject(lmcMarketsCache.dontSell);
   clearObject(lmcMarketsCache.dontBuy);

   const manageFood = lilModCli.isOption("marketsManageFoods");
   const minFood = ifZeroishThen(lilModCli.getOption("marketsDontSellFoodIfBelow"), 0);
   const maxFood = ifZeroishThen(lilModCli.getOption("marketsDontBuyFoodIfAbove"), Number.MAX_SAFE_INTEGER);

   const manageBuildMaterials = lilModCli.isOption("marketsManageBuildMaterials");
   const minBuildMaterials = ifZeroishThen(lilModCli.getOption("marketsDontSellBuildMaterialsIfBelow"), 0);
   const maxBuildMaterials = ifZeroishThen(
      lilModCli.getOption("marketsDontBuyBuildMaterialsIfAbove"),
      Number.MAX_SAFE_INTEGER,
   );

   const manageCurrencies = lilModCli.isOption("marketsManageCurrencies");
   const minCurrencies = ifZeroishThen(lilModCli.getOption("marketsDontSellCurrenciesIfBelow"), 0);
   const maxCurrencies = ifZeroishThen(
      lilModCli.getOption("marketsDontBuyCurrenciesIfAbove"),
      Number.MAX_SAFE_INTEGER,
   );

   const manageUltimates = lilModCli.isOption("marketsManageUltimates");
   const minUltimates = ifZeroishThen(lilModCli.getOption("marketsDontSellUltimatesIfBelow"), 0);
   const maxUltimates = ifZeroishThen(
      lilModCli.getOption("marketsDontBuyUltimatesIfAbove"),
      Number.MAX_SAFE_INTEGER,
   );

   const manageOthers = lilModCli.isOption("marketsManageOthers");
   const minOthers = ifZeroishThen(lilModCli.getOption("marketsDontSellOthersIfBelow"), 0);
   const maxOthers = ifZeroishThen(
      lilModCli.getOption("marketsDontBuyOthersIfAbove"),
      Number.MAX_SAFE_INTEGER,
   );

   forEach(Config.Resource, (res) => {
      if (NoPrice[res]) {
         return;
      }

      // @ts-expect-error
      if (manageFood && ResourceIsFood[res]) {
         const amount = Tick.current.resourceAmount.get(res);
         if ((amount ?? 0) < minFood) {
            lmcMarketsCache.dontSell[res] = true;
         }
         if ((amount ?? 0) > maxFood) {
            lmcMarketsCache.dontBuy[res] = true;
         }
         // @ts-expect-error
      } else if (manageBuildMaterials && ResourceIsBuildMaterial[res]) {
         const amount = Tick.current.resourceAmount.get(res);
         if ((amount ?? 0) < minBuildMaterials) {
            lmcMarketsCache.dontSell[res] = true;
         }
         if ((amount ?? 0) > maxBuildMaterials) {
            lmcMarketsCache.dontBuy[res] = true;
         }
         // @ts-expect-error
      } else if (manageUltimates && ResourceIsUltimate[res]) {
         // process ultimates before currencies, so if both are enabled Bitcoins will be processed as ultimates
         const amount = Tick.current.resourceAmount.get(res);
         if ((amount ?? 0) < minUltimates) {
            lmcMarketsCache.dontSell[res] = true;
         }
         if ((amount ?? 0) > maxUltimates) {
            lmcMarketsCache.dontBuy[res] = true;
         }
         // @ts-expect-error
      } else if (manageCurrencies && ResourceIsCurrency[res]) {
         const amount = Tick.current.resourceAmount.get(res);
         if ((amount ?? 0) < minCurrencies) {
            lmcMarketsCache.dontSell[res] = true;
         }
         if ((amount ?? 0) > maxCurrencies) {
            lmcMarketsCache.dontBuy[res] = true;
         }

      } else if (manageOthers) {
         const amount = Tick.current.resourceAmount.get(res);
         if ((amount ?? 0) < minOthers) {
            lmcMarketsCache.dontSell[res] = true;
         }
         if ((amount ?? 0) > maxOthers) {
            lmcMarketsCache.dontBuy[res] = true;
         }
      }
   });
}

export function checkMarketTrade(params: CheckMarketTradeParams): boolean {
   const enableLogging = false;
   //const enableLogging = Math.random() < 0.0001;

   if (lilModCli.isOption(lilModOption.marketsDontSellLessForMore)) {
      if (params.amountRatio > 1) {
         if (enableLogging) {
            addSystemMessageSafe(
               `Blocking ${params.checkType}: ${params.sellResource} for ${params.buyResource}, sell amount (${params.sellAmount}) is lesser than buy amount (${params.buyAmount}).`,
            );
         }
         return false;
      }
   }

   if (lilModCli.isOption(lilModOption.marketsDontSellAtLoss)) {
      if (params.tradeValue < 1) {
         if (enableLogging) {
            addSystemMessageSafe(
               `Blocking ${params.checkType}: ${params.sellResource} for ${params.buyResource}, sell value (${params.sellValue}) is greater than buy value (${params.buyValue}).`,
            );
         }
         return false;
      }
   }

   if (lmcMarketsCache.dontSell[params.sellResource]) {
      if (enableLogging) {
         addSystemMessageSafe(
            `Blocking ${params.checkType}: ${params.sellResource} for ${params.buyResource}, don't sell condition met.`,
         );
      }
      return false;
   }
   if (lmcMarketsCache.dontBuy[params.buyResource]) {
      if (enableLogging) {
         addSystemMessageSafe(
            `Blocking ${params.checkType}: ${params.sellResource} for ${params.buyResource}, don't buy condition met.`,
         );
      }
      return false;
   }

   return true;
}
