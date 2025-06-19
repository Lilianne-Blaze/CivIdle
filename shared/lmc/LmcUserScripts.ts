import { getGameOptions } from "../logic/GameStateLogic";
import { fs, isFsLoaded } from "./LmcConstsEarly";
import { OnAfterWelcomeMessageProcessed, OnAtEndOfSetCityOverride, OnUserIdChanged } from "./LmcEvents";
import { getUserScriptsPath } from "./LmcScriptsShared";

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

   const newUserId = getGameOptions().userId;

   if (newUserId !== lastKnownUserId) {
      lastKnownUserId = newUserId;
      OnUserIdChanged.emit({
         prevUserId: lastKnownUserId,
         newUserId: newUserId,
      });
   } else {
      //console.log("newUserId", newUserId);
      lastKnownUserId = newUserId;
   }
}
gt.maybeUserIdChanged = maybeUserIdChanged;

export function getLastKnownUserId(): string | null {
   return lastKnownUserId;
}
gt.getLastKnownUserId = getLastKnownUserId;

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