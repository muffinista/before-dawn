const { ipcRenderer } = require("electron");

// window.electronRequire = require; // github.com/electron-userland/spectron#node-integration
window.shimApi = {
  send: (cmd, opts, args={}) => ipcRenderer.send(cmd, opts, args),
  getCurrentState: async () => ipcRenderer.invoke("get-current-state"),
  getTrayItems: async () => ipcRenderer.invoke("get-tray-items"),
  clickTray: (label) => {
    ipcRenderer.invoke("click-tray-item", label);
  }
};
