import { NoPrice, Resource, ResourceDefinitions } from "../definitions/ResourceDefinitions";
import { Config } from "../logic/Config";
import { Tick } from "../logic/TickLogic";
import { clearObject, forEach, tileToPoint, xyToPoint, type Tile } from "../utilities/Helper";
import { lilModCli, lilModOption } from "./LilModCli";
import { ResourceIsBuildMaterial, ResourceIsCurrency, ResourceIsFood, ResourceIsUltimate } from "./LmcConstsEarly";
import { addSystemMessageSafe } from "./LmcScriptsShared";
import { OnAtEndOfClearIntraTickCache, OnCheckMarketTrade } from "./LmcEvents";
import type { GameState } from "../logic/GameState";
import { atMostOncePerXSecs, ifZeroishThen } from "./MiscFuncs";
import { getGameState } from "../logic/GameStateLogic";
import { getBuildingCost, isWorldWonder } from "../logic/BuildingLogic";
import { getXyBuildings } from "../logic/IntraTickCache";

// =====

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
const gt = globalThis as any;

export class CheckMarketTradeEvent {

   constructor(
      public readonly params: CheckMarketTradeParams,
      public requestAction: CheckMarketTradeAction = CheckMarketTradeAction.NONE) {
   }

   allow(): void { this.requestAction = CheckMarketTradeAction.ALLOW; }
   block(): void { this.requestAction = CheckMarketTradeAction.BLOCK; }

   isAllowed(): boolean { return this.requestAction === CheckMarketTradeAction.ALLOW; }
   isDecided(): boolean { return this.requestAction !== CheckMarketTradeAction.NONE; }

   isSellingFood(): boolean {
      // @ts-expect-error
      return this.params.sellResource && ResourceIsFood[this.params.sellResource];
   }

}

export enum CheckMarketTradeAction {
   ALLOW = 1,
   BLOCK = -1,
   NONE = 0,
};

export type CheckMarketTradeParams = {
   sellResource: string;
   buyResource: string;
   sellAmount: number;
   buyAmount: number;
   storeAmount: number;
   sellValue: number;
   buyValue: number;
   tradeValue: number;
   amountRatio: number;
   xy?: Tile;
   gs?: GameState;
   checkType: "import" | "sell" | undefined;
};

OnCheckMarketTrade.on((event: CheckMarketTradeEvent) => {
   if (checkMarketTrade(event.params)) {
      event.allow();
   }
});

OnAtEndOfClearIntraTickCache.on(() => {
   initMarketTradesCache();
});

/**
 * lmcMarketsCache is defined here for tracking which resources should not be sold or bought.
 * Use resource names as keys, based on ResourceDefinitions.
 */
const lmcMarketsCache = {
   dontSell: {} as Record<string, boolean>,
   dontBuy: {} as Record<string, boolean>,
   alwaysBuyForBuildWonders: {} as Record<string, boolean>,
   neverSellForBuildWonders: {} as Record<string, boolean>,
};
gt.lmcMarketsCache = lmcMarketsCache;

function initMarketTradesCache() {
   clearObject(lmcMarketsCache.dontSell);
   clearObject(lmcMarketsCache.dontBuy);
   clearObject(lmcMarketsCache.alwaysBuyForBuildWonders);
   clearObject(lmcMarketsCache.neverSellForBuildWonders);

   const gs = getGameState();

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

   const manageRoverMats = lilModCli.isOption("marketsManageRoverMats");
   const minRoverMats = ifZeroishThen(lilModCli.getOption("marketsDontSellRoverMatsIfBelow"), 0);
   const maxRoverMats = ifZeroishThen(
      lilModCli.getOption("marketsDontBuyRoverMatsIfAbove"),
      Number.MAX_SAFE_INTEGER,
   );

   const manageBitcoinMats = lilModCli.isOption("marketsManageBitcoinMats");
   const minBitcoinMats = ifZeroishThen(lilModCli.getOption("marketsDontSellBitcoinMatsIfBelow"), 0);
   const maxBitcoinMats = ifZeroishThen(
      lilModCli.getOption("marketsDontBuyBitcoinMatsIfAbove"),
      Number.MAX_SAFE_INTEGER,
   );

   const manageOthers = lilModCli.isOption("marketsManageOthers");
   const minOthers = ifZeroishThen(lilModCli.getOption("marketsDontSellOthersIfBelow"), 0);
   const maxOthers = ifZeroishThen(
      lilModCli.getOption("marketsDontBuyOthersIfAbove"),
      Number.MAX_SAFE_INTEGER,
   );

   // -----

   gs.tiles.forEach((tile, xy) => {
      try {
         if (tile.building) {
            const bu = tile.building;
            const buType = bu.type;
            const isWonder = isWorldWonder(buType);
            if (isWonder && bu.status !== "completed") {
               const buCost = getBuildingCost(bu);
               for (const k in buCost) {
                  if (buCost[k] > bu.resources[k]) {
                     lmcMarketsCache.alwaysBuyForBuildWonders[k] = true;
                     lmcMarketsCache.neverSellForBuildWonders[k] = true;
                  }
               }
            }
         }
      } catch (err) { }
   });


   // -----

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
      } else if (manageBitcoinMats && ResourceIsBitcoinMat[res]) {
         const amount = Tick.current.resourceAmount.get(res);
         if ((amount ?? 0) < minBitcoinMats) {
            lmcMarketsCache.dontSell[res] = true;
         }
         if ((amount ?? 0) > maxBitcoinMats) {
            lmcMarketsCache.dontBuy[res] = true;
         }
         // @ts-expect-error
      } else if (manageRoverMats && ResourceIsRoverMat[res]) {
         const amount = Tick.current.resourceAmount.get(res);
         if ((amount ?? 0) < minRoverMats) {
            lmcMarketsCache.dontSell[res] = true;
         }
         if ((amount ?? 0) > maxRoverMats) {
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

// called from event handlers now, see near to of the file
export function checkMarketTrade(params: CheckMarketTradeParams): boolean {
   // const enableLogging = false;
   const enableLogging = Math.random() < 0.0001 && lilModCli.isOption(lilModOption.marketsPrintSomeDebugMessages);

   const storeAmountNegative = params.storeAmount < 0;
   const storeAmountZero = params.storeAmount == 0;
   const sellAtLoss = params.tradeValue < 1;
   const sellLessForMore = params.amountRatio > 1;
   const coordsXyStr = params.xy ? (`${tileToPoint(params.xy).x}, ${tileToPoint(params.xy).y}`) : "unknown";

   if (params.checkType === "sell") {
      if (storeAmountZero) {
         return false;
      }

      if (storeAmountNegative) {
         if (atMostOncePerXSecs("checkMarketTrade.blockingNegativeTrade", 10)) {
            addSystemMessageSafe(
               `WARNING: Blocking negative trade ${params.sellAmount} ${params.sellResource} for ${params.buyAmount} ${params.buyResource} at ${coordsXyStr}.`
            );
         }
         return false;
      }
   }

   if (params.checkType === "sell" &&
      lilModCli.isOption(lilModOption.marketsBlockOnlyImports)) {
      return true;
   }

   if (lilModCli.isOption(lilModOption.marketsAlwaysBuildWonders)) {
      if (lmcMarketsCache.alwaysBuyForBuildWonders[params.buyResource] &&
         !lmcMarketsCache.dontSell[params.sellResource]
      ) {
         if (enableLogging) {
            addSystemMessageSafe(
               `Allowing ${params.checkType}: ${params.sellResource} for ${params.buyResource} because it's needed for a wonder.`,
            );
         }
         return true;
      }
      if (lmcMarketsCache.neverSellForBuildWonders[params.sellResource]) {
         if (enableLogging) {
            addSystemMessageSafe(
               `Disallowing ${params.checkType}: ${params.sellResource} for ${params.buyResource} because it's needed for a wonder.`,
            );
         }
         return false;
      }
   }

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
      if (sellAtLoss) {
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

   if (lilModCli.isOption(lilModOption.marketsDefaultRuleBlock)) {
      if (enableLogging) {
         addSystemMessageSafe(
            `Blocking ${params.checkType}: ${params.sellResource} for ${params.buyResource}, no other conditions met.`,
         );
      }
      return false;
   }

   if (enableLogging) {
      addSystemMessageSafe(
         `Allowing ${params.checkType}: ${params.sellResource} for ${params.buyResource}, no special conditions met.`,
      );
   }
   return true;
}
