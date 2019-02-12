"use strict";

const {app, BrowserWindow} = require("electron");

/**
 * if we're using the dock, and all our windows are closed, hide the
 * dock icon
 */
var hideDockIfInactive = function() {
  let openWindowCount = BrowserWindow.getAllWindows().
                                      filter(win => (win !== undefined && win.noTray !== true) ).length;

  if ( typeof(app.dock) !== "undefined" && openWindowCount === 0 ) {
    app.dock.hide();
  }
};

/**
 * show the dock if it's available
 */
var showDock = function() {
  if ( typeof(app.dock) !== "undefined" ) {
    app.dock.show();
  }
};

exports.hideDockIfInactive = hideDockIfInactive;
exports.showDock = showDock;
