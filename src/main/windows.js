"use strict";

const main = require("./index.js");
const {BrowserWindow} = require("electron");

var getSaverWindows = function() {
  return BrowserWindow.getAllWindows().filter((w) => {
    return w.isSaver === true;
  });
};


/**
 * check if the screensaver is still running
 */
var screenSaverIsRunning = function() {
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
var handleDisplayChange = function() {
  main.log.info("display change, let's close running screensavers");
  closeRunningScreensavers();
};

/**
 * close any running screensavers
 */
var closeRunningScreensavers = function() {
  main.log.info("closeRunningScreensavers");
//  if ( debugMode !== true ) {
    attemptToStopScreensavers();
    setTimeout(forcefullyCloseScreensavers, 2500);
//  }
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
var forceWindowClose = function(w) {
  // 100% close/kill this window
  if ( typeof(w) !== "undefined" ) {
    try {
      w.destroy();
    }
    catch (e) {
      log.info(e);
    }
  }
};

exports.screenSaverIsRunning = screenSaverIsRunning;
exports.handleDisplayChange = handleDisplayChange;
exports.closeRunningScreensavers = closeRunningScreensavers;
exports.forceWindowClose = forceWindowClose;
