const { ipcRenderer } = require("electron");

// window.electronRequire = require; // github.com/electron-userland/spectron#node-integration
window.shimApi = {
  send: (cmd, opts) => ipcRenderer.send(cmd, opts),
  getCurrentState: async () => ipcRenderer.invoke("get-current-state"),
  getTrayItems: async () => ipcRenderer.invoke("get-tray-items"),
  clickTray: (label) => {
    ipcRenderer.invoke("click-tray-item", label);
  }
};
