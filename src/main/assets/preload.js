const { contextBridge, ipcRenderer } = require("electron");
const { init } = require("@sentry/electron/dist/renderer");

const fs = require("fs");
const path = require("path");

if ( global.TRACK_ERRORS && global.SENTRY_DSN !== undefined ) {
  init({
    dsn: global.SENTRY_DSN,
    enableNative: false,
    release: process.env.BEFORE_DAWN_RELEASE_NAME,
    onFatalError: (error) => {
      // eslint-disable-next-line no-console
      console.log(error);
    },
  }); 
}

const api = {
  platform: () => process.platform,
  getDisplayBounds: async() => ipcRenderer.invoke("get-primary-display-bounds"),
  getScreenshot: async() => ipcRenderer.invoke("get-primary-screenshot"),
  getGlobals: async() => ipcRenderer.invoke("get-globals"),
  addListener: (key, fn) => ipcRenderer.on(key, fn),
  removeListener: (key, fn) => ipcRenderer.removeListener(key, fn),
  getPrefs: async() => ipcRenderer.invoke("get-prefs"),
  getDefaults: async() => ipcRenderer.invoke("get-defaults"),
  updatePreview: (opts) => ipcRenderer.send("update-preview", opts),
  openWindow: (name, opts) => ipcRenderer.send("open-window", name, opts),
  closeWindow: (name) => ipcRenderer.send("close-window", name),
  listSavers: async() => ipcRenderer.invoke("list-savers"),
  loadSaver: async(src) => ipcRenderer.invoke("load-saver", src),
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
  openFolder: (path) => ipcRenderer.send("open-folder", path),
  watchFolder: (src, cb) => {
    const folderPath = path.dirname(src);
    // make sure folder actually exists
    if ( fs.existsSync(folderPath) ) {
      fs.watch(folderPath, (eventType, filename) => {
        if (filename) {
          cb(eventType, filename);
        }
      });
    }
  },
  toggleDevTools: () => ipcRenderer.send("toggle-dev-tools")
};

const testMode = ( process.env.TEST_MODE !== undefined );

if (testMode) {
  window.electronRequire = require; // github.com/electron-userland/spectron#node-integration
  window.api = api;
} else {
  contextBridge.exposeInMainWorld("api", api);
}

