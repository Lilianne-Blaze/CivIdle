import mqtt from "mqtt";
import { getGameOptions } from "../logic/GameStateLogic";
import { fs, isFsLoaded, CHANNEL_GUID_ROOT } from "./LmcConstsEarly";
import { OnAfterWelcomeMessageProcessed, OnAtEndOfSetCityOverride, OnUserIdChanged } from "./LmcEvents";
import { getUserScriptsPath } from "./LmcScriptsShared";
import { atMostOnce, atMostOncePerXSecs, sha1Hex } from "./MiscFuncs";
import { lilModCli } from "./LilModCli";
import { log } from "console";

const gt = globalThis as any;

OnAtEndOfSetCityOverride.on(() => {
   maybeUserIdChanged();
});

OnAfterWelcomeMessageProcessed.on(() => {
   maybeUserIdChanged();
});

OnUserIdChanged.on(() => {
   loadAndRunUserScript();
});

let lastKnownUserId: string | null = null;

export function maybeUserIdChanged() {
   //console.log("lastKnownUserId", lastKnownUserId);

   const gameOptions = getGameOptions();
   const newUserId = gameOptions.userId;

   if (newUserId !== lastKnownUserId) {

      lilModCli.setOption("userIdHash", null);
      sha1Hex(gameOptions.userId).then(hash => {
         try {
            lilModCli.setOption("userIdHash", hash);
         } catch (e) {
            lilModCli.setOption("userIdHash", null);
         }
      });

      lastKnownUserId = newUserId;
      OnUserIdChanged.emit({
         prevUserId: lastKnownUserId,
         newUserId: newUserId,
      });
   } else {
      lastKnownUserId = newUserId;
   }
}
gt.maybeUserIdChanged = maybeUserIdChanged;

export function getLastKnownUserId(): string | null {
   return lastKnownUserId;
}
gt.getLastKnownUserId = getLastKnownUserId;

export function getLastKnownUserIdHash(): string | null {
   const hash = lilModCli.getOption("userIdHash");
   if (!hash) {
      if (atMostOncePerXSecs("getLastKnownUserIdHash.noHashWarning", 60 * 60)) {
         console.warn("getLastKnownUserIdHash called, but no userIdHash found in lilModCli.");
      }
      return null;
   }
   return lilModCli.getOption("userIdHash") || null;
}
gt.getLastKnownUserIdHash = getLastKnownUserIdHash;

// =====

function loadAndRunUserScript() {
   const userId = getLastKnownUserId();
   if (!userId) {
      console.log("No userId found, cannot load UserScript.");
      return;
   }
   else if (!isFsLoaded()) {
      console.log("File system not loaded, cannot load UserScript.");
      return;
   }
   console.log(`Trying to load UserScript for ${userId}...`);

   try {
      const path = getUserScriptsPath();
      const scriptName = "UserScript";
      const scriptPath = `${path}/${scriptName}.js`;
      const txt = fs.readFileSync(scriptPath, "utf8");
      // biome-ignore lint/security/noGlobalEval: <explanation>
      // biome-ignore lint/style/noCommaOperator: <explanation>
      const result = (0, eval)(txt);
      console.log(`UserScript for ${userId} loaded successfully.`);
   } catch (err) {
      console.error(`Error loading UserScript for ${userId}:`, err);
   }
}

// =====

export function ensureLmcUserScriptsLoaded() {
   if (atMostOnce("ensureLmcUserScriptsLoaded")) {
      console.debug("ensureLmcUserScriptsLoaded called.");
   }
}