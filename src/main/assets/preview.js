const fs = require("fs");
const {ipcRenderer} = require("electron");
window.onerror = function(message, source, lineno, colno, error) {
  fs.writeFileSync("/tmp/foo3", event);
  ipcRenderer.send("preview-error", message, source, lineno, colno, error);
};
