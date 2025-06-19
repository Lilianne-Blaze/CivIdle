import type { IPCService } from "../../../electron/src/IPCService";
import { rpcClient } from "../../../shared/thirdparty/TRPCClient";
import { saveGame } from "../Global";
import { showToast } from "../ui/GlobalModal";
import { playError } from "../visuals/Sound";

const gt = globalThis as any;

export function isSteam(): boolean {
   return typeof IPCBridge !== "undefined";
}
gt.isSteam = isSteam;

export const SteamClient = rpcClient<IPCService>({
   request: (method: string, params: any[]) => {
      if (!IPCBridge) {
         throw new Error("SteamClient is not defined");
      }
      return IPCBridge.rpcCall(method, params);
   },
});
gt.SteamClient = SteamClient;

if (typeof IPCBridge !== "undefined") {
   IPCBridge.onClose(() => {
      saveGame()
         .then(() => SteamClient.quit())
         .catch((e) => {
            playError();
            showToast(String(e));
         });
   });
}
