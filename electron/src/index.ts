import { init, type Client } from "@fishpondstudio/steamworks.js";
import { BrowserWindow, Menu, app, dialog, ipcMain } from "electron";
import { existsSync, renameSync } from "node:fs";
import path from "node:path";
import { IPCService } from "./IPCService";

const gt = globalThis as any;
gt.electronApp = app;

export type SteamClient = Omit<Client, "init" | "runCallbacks">;

//app.disableHardwareAcceleration();

app.commandLine.appendSwitch("enable-logging", "file");

const logPath = path.join(getLocalGameSavePath(), "CivIdle.log");
if (existsSync(logPath)) {
   //renameSync(logPath, path.join(getLocalGameSavePath(), "CivIdle-prev.log"));

   // LMCBOOKMARK
   const cem = getCurrentEpochMillis();
   const fs = epochToFilestamp(cem);
   renameSync(logPath, path.join(getLocalGameSavePath(), `CivIdle-${fs}.log`));
}

app.commandLine.appendSwitch("log-file", logPath);
app.commandLine.appendSwitch("enable-experimental-web-platform-features");

export function getGameSavePath(): string {
   return path.join(app.getPath("appData"), "CivIdleSaves");
}

export function getLocalGameSavePath(): string {
   return path.join(app.getPath("appData"), "CivIdleLocal");
}

// export const MIN_WIDTH = 1136;
// export const MIN_HEIGHT = 640;
export const MIN_WIDTH = 640;
export const MIN_HEIGHT = 480;

const disableFloatingMode = !app.isPackaged || process.argv.includes("--disable-floating-mode");
// const enableDevTools = process.argv.includes("--enable-dev-tools");

const createWindow = async () => {
   try {
      const steam = init();
      const mainWindow = new BrowserWindow({
         webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            devTools: !app.isPackaged,
            backgroundThrottling: false,

            // LBCBOOKMARK
            nodeIntegration: true,
            contextIsolation: false,

         },
         minHeight: MIN_HEIGHT,
         minWidth: MIN_WIDTH,
         show: false,
         frame: disableFloatingMode,
         roundedCorners: false,
         thickFrame: disableFloatingMode,
         backgroundColor: "#000000",
      });

      try {
         await Promise.all([
            mainWindow.webContents.session.clearCache(),
            mainWindow.webContents.session.clearAuthCache(),
            mainWindow.webContents.session.clearCodeCaches({}),
         ]);
      } catch (error) {
         console.error("Failed to clear cache:", error);
      }

      if (app.isPackaged) {
         mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
      } else {
         mainWindow.loadURL("http://localhost:3000");
         mainWindow.webContents.openDevTools();
      }

      mainWindow.removeMenu();
      mainWindow.maximize();
      mainWindow.show();

      if (steam.utils.isSteamRunningOnSteamDeck()) {
         mainWindow.setFullScreen(true);
      }

      mainWindow.on("close", (e) => {
         e.preventDefault();
         mainWindow.webContents.send("close");
      });

      const service = new IPCService(steam, mainWindow);

      ipcMain.handle("__RPCCall", (e, method: keyof IPCService, args) => {
         // @ts-expect-error
         return service[method].apply(service, args);
      });
   } catch (error) {
      dialog.showErrorBox("Failed to Start Game", String(error));
      quit();
   }
};

Menu.setApplicationMenu(null);

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
   quit();
});

app.on('before-quit', () => {
   console.log("Before quit event triggered");
   setTimeout(() => {
      console.warn('Forced exit due to timeout (127)');
      //app.exit(0);
      process.abort();
   }, 20000);
});
app.on('window-all-closed', () => {
   console.log("Window all closed event triggered");
   setTimeout(() => {
      console.warn('Forced exit due to timeout (135)');
      //app.exit(0);
      process.abort();
   }, 20000);
});

function quit() {
   setTimeout(() => {
      console.warn('Forced exit due to timeout (143)');
      //app.exit(0);
      process.abort();
   }, 20000);
   app.quit();
}

// LMCBOOKMARK
function getCurrentEpochMillis(): number {
   return Date.now();
}

function epochToFilestamp(epochMillis: number): string {
   const date = new Date(epochMillis);
   return date.toISOString().replace(/[-:.]/g, '').slice(0, -4) + 'Z';
}


