const { contextBridge, ipcRenderer } = require("electron");

const shimApi = {
  send: (cmd, opts, args={}) => ipcRenderer.send(cmd, opts, args),
  getCurrentState: async () => ipcRenderer.invoke("get-current-state"),
  getTrayItems: async () => ipcRenderer.invoke("get-tray-items"),
  clickTray: (label) => {
    ipcRenderer.invoke("click-tray-item", label);
  }
};

contextBridge.exposeInMainWorld("shimApi", shimApi);
