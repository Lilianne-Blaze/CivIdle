
import { L, t } from "../../../shared/utilities/i18n";
import { useGameOptions, useGameState } from "../Global";
import { MenuComponent } from "./MenuComponent";
import { TitleBarComponent } from "./TitleBarComponent";

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


            </fieldset>

         </div>
      </div>
   );
}
