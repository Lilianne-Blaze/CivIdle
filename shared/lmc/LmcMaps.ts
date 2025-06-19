import { OnCityTileSelected, OnWorldTileSelected } from "./LmcEvents";
import { addSystemMessageSafe } from "./LmcScriptsShared";

const gt = globalThis as any;

export const lmcCityMap = {
   lastClickedTileX: -1,
   lastClickedTileY: -1,

   onClickHandler(event: any) {
      this.lastClickedTileX = event.tileX;
      this.lastClickedTileY = event.tileY;
      // addSystemMessageSafe(`City tile ${event.tileX}, ${event.tileY} clicked.`);
   },

   getLastClickedTileXYCoords() {
      return { tileX: this.lastClickedTileX, tileY: this.lastClickedTileY };
   },
};
gt.lmcCityMap = lmcCityMap;

export const lmcWorldMap = {
   lastClickedTileX: -1,
   lastClickedTileY: -1,

   onClickHandler(event: any) {
      this.lastClickedTileX = event.tileX;
      this.lastClickedTileY = event.tileY;
      // addSystemMessageSafe(`World tile ${event.tileX}, ${event.tileY} clicked.`);
   },

   getLastClickedTileXYCoords() {
      return { tileX: this.lastClickedTileX, tileY: this.lastClickedTileY };
   },
};
gt.lmcWorldMap = lmcWorldMap;

OnWorldTileSelected.on((event) => {
   lmcWorldMap.onClickHandler(event);
});

OnCityTileSelected.on((event) => {
   lmcCityMap.onClickHandler(event);
});

// export function lmcEnsureMapsReady() {
//    if (atMostOncePerSession("lmcEnsureMapsReady")) {
//       console.log("lmcEnsureMapsReady called.");
//    }
// }

export function lmcMapsDebug() {
   addSystemMessageSafe(`Last clicked city tile: ${lmcCityMap.lastClickedTileX}, ${lmcCityMap.lastClickedTileY}`);
   addSystemMessageSafe(
      `Last clicked world tile: ${lmcWorldMap.lastClickedTileX}, ${lmcWorldMap.lastClickedTileY}`,
   );
}
gt.lmcMapsDebug = lmcMapsDebug;

