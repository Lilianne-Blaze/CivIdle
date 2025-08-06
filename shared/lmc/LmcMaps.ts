import { getGameState } from "../logic/GameStateLogic";
import { ITileData } from "../logic/Tile";
import { pointToTile, Tile } from "../utilities/Helper";
import { OnCityTileSelected, OnWorldTileSelected, TileSelectedEvent } from "./LmcEvents";
import { addSystemMessageSafe } from "./LmcScriptsShared";

const gt = globalThis as any;

export const lmcCityMap = {
   lastClickedTileX: -1,
   lastClickedTileY: -1,
   lastClickedTileNum: -1 as Tile,

   onClickHandler(event: TileSelectedEvent) {
      this.lastClickedTileX = event.tileX;
      this.lastClickedTileY = event.tileY;
      try {
         this.lastClickedTileNum = pointToTile({ x: event.tileX, y: event.tileY });
      }
      catch (err) {
         this.lastClickedTileNum = -1;
      }
      // addSystemMessageSafe(`City tile ${event.tileX}, ${event.tileY} clicked.`);
   },

   getLastClickedTileXYCoords() {
      return { tileX: this.lastClickedTileX, tileY: this.lastClickedTileY };
   },

   getLastClickedTileNum(): Tile {
      return this.lastClickedTileNum;
   },

   hasValidLastClickedTile(): boolean {
      return this.lastClickedTileX >= 0 && this.lastClickedTileY >= 0
   },

};

gt.lmcCityMap = lmcCityMap;

function lastClickedCityTileNum(): Tile {
   return lmcCityMap.getLastClickedTileNum();
}
gt.lastClickedCityTileNum = lastClickedCityTileNum;

function lastClickedCityTile(): ITileData | undefined {
   return getGameState().tiles.get(lastClickedCityTileNum());
}
gt.lastClickedCityTile = lastClickedCityTile;

export const lmcWorldMap = {
   lastClickedTileX: -1,
   lastClickedTileY: -1,
   lastClickedTileNum: -1 as Tile,

   onClickHandler(event: any) {
      this.lastClickedTileX = event.tileX;
      this.lastClickedTileY = event.tileY;
      this.lastClickedTileNum = pointToTile({ x: event.tileX, y: event.tileY });
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
   addSystemMessageSafe(`Last clicked city tile: ${lmcCityMap.lastClickedTileX}, ${lmcCityMap.lastClickedTileY} / ${lmcCityMap.lastClickedTileNum}`);
   addSystemMessageSafe(
      `Last clicked world tile: ${lmcWorldMap.lastClickedTileX}, ${lmcWorldMap.lastClickedTileY}`,
   );
}
gt.lmcMapsDebug = lmcMapsDebug;

