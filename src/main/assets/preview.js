const fs = require("fs");
const {ipcRenderer} = require("electron");
window.onerror = function(message, source, lineno, colno, error) {
  ipcRenderer.send("preview-error", message, source, lineno, colno, error);
};
