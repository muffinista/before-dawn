"use strict";

import {app, BrowserWindow} from "electron";

/**
 * if we're using the dock, and all our windows are closed, hide the
 * dock icon
 */
export const hideDockIfInactive = function() {
  let openWindowCount = BrowserWindow.getAllWindows().
                                      filter(win => (win !== undefined && win.noTray !== true) ).length;

  if ( typeof(app.dock) !== "undefined" && openWindowCount === 0 ) {
    app.dock.hide();
  }
};

/**
 * show the dock if it's available
 */
export const showDock = function() {
  if ( typeof(app.dock) !== "undefined" ) {
    app.dock.show();
  }
};
