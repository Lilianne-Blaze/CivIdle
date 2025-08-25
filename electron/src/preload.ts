import { ipcRenderer } from "electron";


const gt = globalThis as any;

/*
contextBridge.exposeInMainWorld("IPCBridge", {
   rpcCall: (method: string, args: any[]) => ipcRenderer.invoke("__RPCCall", method, args),
   onClose: (callback: () => void) => ipcRenderer.on("close", () => callback()),
});
*/

const IPCBridge = {
   rpcCall: (method: string, args: any[]) => ipcRenderer.invoke("__RPCCall", method, args),
   onClose: (callback: () => void) => ipcRenderer.on("close", () => callback()),
};
gt.IPCBridge = IPCBridge;
