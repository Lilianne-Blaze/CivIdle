
import { lilModCli, lilModOption } from "../../../shared/lmc/LilModCli";
import { notifyGameOptionsUpdate } from "../../../shared/logic/GameStateLogic";
import { L, t } from "../../../shared/utilities/i18n";
import { useGameOptions, useGameState } from "../Global";
import { playClick } from "../visuals/Sound";
import { MenuComponent } from "./MenuComponent";
import { TitleBarComponent } from "./TitleBarComponent";
import { ToggleComponent } from "./ToggleComponent";

export function LmcMultiplayerOptionPage(): React.ReactNode {
   const options = useGameOptions();
   const gs = useGameState();
   return (
      <div className="window">
         <TitleBarComponent>{t(L.Gameplay)}</TitleBarComponent>
         <MenuComponent />
         <div className="window-body">

            <fieldset>
               <legend>Multiplayer</legend>

            </fieldset>

            <fieldset>
               <legend>Opt-outs</legend>

               <ToggleComponent
                  title="Opt-out of leaderboards and other competitive features"
                  contentHTML=""
                  value={lilModCli.isOption(lilModOption.optoutCompetitive)}
                  onValueChange={(value) => {
                     playClick();
                     lilModCli.toggleOption(lilModOption.optoutCompetitive);
                     notifyGameOptionsUpdate(options);
                  }}
               />

            </fieldset>

         </div>
      </div>
   );
}
