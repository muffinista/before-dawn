"use strict";

import * as main from "./index.js";
import { BrowserWindow } from "electron";

var getSaverWindows = function() {
  return BrowserWindow.getAllWindows().filter((w) => {
    return w.isSaver === true;
  });
};


/**
 * check if the screensaver is still running
 */
export const screenSaverIsRunning = function() {
  return ( getSaverWindows().length > 0 );
};


/**
 * check if the specified window exists and isn't destroyed
 */
var activeWindowHandle = function(w) {
  return (typeof(w) !== "undefined" && ! w.isDestroyed());
};

/**
 * when the display count changes, close any running windows
 */
export const handleDisplayChange = function() {
  // main.log.info("display change, let's close running screensavers");
  closeRunningScreensavers();
};

/**
 * close any running screensavers
 */
export const closeRunningScreensavers = function() {
  main.log.info("closeRunningScreensavers");
  attemptToStopScreensavers();

  // be really aggressive about closing lagging windows
  setTimeout(forcefullyCloseScreensavers, 2500);
  setTimeout(forcefullyCloseScreensavers, 5000);
};

/**
 * iterate through our list of running screensaver windows and attempt
 * to close them nicely
 */
var attemptToStopScreensavers = function() {
  getSaverWindows().forEach((w) => {
    if ( activeWindowHandle(w) ) {
      w.close();
    }    
  });
};

/**
 * iterate through our list of running screensaver windows and close
 * them forcefully if needed
 */
var forcefullyCloseScreensavers = function() {
  getSaverWindows().forEach((w) => {
    if ( activeWindowHandle(w) ) {
      w.destroy();
    }
  });
};

/**
 * forcefully close a screensaver window
 */
export const forceWindowClose = function(w) {
  // 100% close/kill this window
  if ( typeof(w) !== "undefined" ) {
    try {
      w.destroy();
    }
    catch (e) {
      main.log.info(e);
    }
  }
};

/**
 * Set full screen mode for the given window. Use OSX's 
 * fast/simple fullscreen mode if available.
 * @param {BrowserWindow} w the window to apply
 */
export const setFullScreen = function(w) {
  if ( process.platform !== "darwin" ) {
    w.setFullScreen(true);
  }
  else {
    w.setSimpleFullScreen(true);
  }
  w.show();
//  w.moveTop();
};

