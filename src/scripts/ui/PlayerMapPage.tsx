import WorldMap from "../../../server/WorldMap.json";
import { GameState } from "../logic/GameState";
import { usePlayerMap } from "../rpc/RPCClient";
import { getMyMapXy } from "../scenes/PathFinder";
import { MyTilePage } from "./MyTilePage";
import { OceanTilePage } from "./OceanTilePage";
import { PlayerTilePage } from "./PlayerTilePage";
import { UnclaimedTilePage } from "./UnclaimedTilePage";

export function PlayerMapPage({ xy }: { xy: string }): JSX.Element | null {
   const playerMap = usePlayerMap();
   const myXy = getMyMapXy();
   if (myXy == xy) {
      return <MyTilePage xy={xy} />;
   } else if (playerMap[xy]) {
      return <PlayerTilePage xy={xy} />;
   } else if ((WorldMap as Record<string, boolean>)[xy]) {
      return <UnclaimedTilePage xy={xy} />;
   } else {
      return <OceanTilePage xy={xy} />;
   }
}

export interface IBuildingComponentProps {
   gameState: GameState;
   xy: string;
}
