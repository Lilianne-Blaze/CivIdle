
import { lilModCli, lilModOption } from "../../../shared/lmc/LilModCli";
import { notifyGameOptionsUpdate } from "../../../shared/logic/GameStateLogic";
import { L, t } from "../../../shared/utilities/i18n";
import { useGameOptions, useGameState } from "../Global";
import { playClick } from "../visuals/Sound";
import { MenuComponent } from "./MenuComponent";
import { TitleBarComponent } from "./TitleBarComponent";
import { ToggleComponent } from "./ToggleComponent";

export function LmcDebugOptionPage(): React.ReactNode {
   const options = useGameOptions();
   const gs = useGameState();
   return (
      <div className="window">
         <TitleBarComponent>{t(L.Gameplay)}</TitleBarComponent>
         <MenuComponent />
         <div className="window-body">
            <fieldset>
               <legend>Debug options</legend>

               <ToggleComponent
                  title="Log all outgoing MQTT messages"
                  contentHTML=""
                  value={lilModCli.isOption(lilModOption.logOutgoingMqttMessages)}
                  onValueChange={(value) => {
                     playClick();
                     lilModCli.toggleOption(lilModOption.logOutgoingMqttMessages);
                     notifyGameOptionsUpdate(options);
                  }}
               />

               <ToggleComponent
                  title="Log all incoming MQTT messages"
                  contentHTML=""
                  value={lilModCli.isOption(lilModOption.logIncomingMqttMessages)}
                  onValueChange={(value) => {
                     playClick();
                     lilModCli.toggleOption(lilModOption.logIncomingMqttMessages);
                     notifyGameOptionsUpdate(options);
                  }}
               />


            </fieldset>
         </div>
      </div>
   );
}

// =====
