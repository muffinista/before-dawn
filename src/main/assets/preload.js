const { contextBridge, ipcRenderer } = require("electron");

const api = {
  platform: () => process.platform,
  getDisplayBounds: async() => ipcRenderer.invoke("get-primary-display-bounds"),
  getScreenshot: async() => ipcRenderer.invoke("get-primary-screenshot"),
  getGlobals: async() => ipcRenderer.invoke("get-globals"),
  addListener: (key, fn) => ipcRenderer.on(key, fn),
  removeListener: (key, fn) => ipcRenderer.removeListener(key, fn),
  getPrefs: async() => ipcRenderer.invoke("get-prefs"),
  getDefaults: async() => ipcRenderer.invoke("get-defaults"),
  openWindow: (name, opts) => ipcRenderer.send("open-window", name, opts),
  closeWindow: (name) => ipcRenderer.send("close-window", name),
  listSavers: async() => ipcRenderer.invoke("list-savers"),
  loadSaver: async(src) => ipcRenderer.invoke("load-saver", src),
  deleteSaverDialog: async(key) => ipcRenderer.invoke("delete-screensaver-dialog", key),
  deleteSaver: async(key) => ipcRenderer.invoke("delete-saver", key),
  saveScreensaver: async(saver, src) => ipcRenderer.invoke("save-screensaver", saver, src),
  updatePrefs: async(prefs) => ipcRenderer.invoke("update-prefs", prefs),
  setAutostart: (value) => ipcRenderer.send("set-autostart", value),
  setGlobalLaunchShortcut: (value) => ipcRenderer.send("set-global-launch-shortcut", value),
  displayUpdateDialog: () => ipcRenderer.send("display-update-dialog"),
  resetToDefaultsDialog: async() => ipcRenderer.invoke("reset-to-defaults-dialog"),
  openUrl: (url) => ipcRenderer.send("launch-url", url),
  updateLocalSource: (ls) => ipcRenderer.invoke("update-local-source", ls),
  createScreensaver: (opts) => ipcRenderer.invoke("create-screensaver", opts),
  saversUpdated: (key) => ipcRenderer.send("savers-updated", key),
  getScreensaverPackage: () => ipcRenderer.invoke("check-screensaver-package"),
  downloadScreensaverPackage: () => ipcRenderer.invoke("download-screensaver-package"),
  showOpenDialog: () => ipcRenderer.invoke("show-open-dialog"),
  openFolder: (path) => ipcRenderer.send("open-folder", path),
  watchFolder: (src) => ipcRenderer.send("watch-folder", src),
  unwatchFolder: (src) => ipcRenderer.send("unwatch-folder", src),
  onFolderUpdate: (cb) => ipcRenderer.on("folder-update", cb),
  toggleDevTools: () => ipcRenderer.send("toggle-dev-tools"),
  log: (payload) => ipcRenderer.send("console-log", payload)
};

contextBridge.exposeInMainWorld("api", api);
