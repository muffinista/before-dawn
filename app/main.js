"use strict";

/***

   Welcome to....

    ____        __                  ____                       
   | __ )  ___ / _| ___  _ __ ___  |  _ \  __ ___      ___ __  
   |  _ \ / _ \ |_ / _ \| '__/ _ \ | | | |/ _` \ \ /\ / / '_ \ 
   | |_) |  __/  _| (_) | | |  __/ | |_| | (_| |\ V  V /| | | |
   |____/ \___|_|  \___/|_|  \___| |____/ \__,_| \_/\_/ |_| |_|

   a screensaver package built on the tools of the web. Enjoy!
   
 */

const electron = require("electron");
const {crashReporter} = require("electron");
const log = require("electron-log");

const app = electron.app;  // Module to control application life.
const BrowserWindow = electron.BrowserWindow;  // Module to create native browser window.
const Menu = electron.Menu;
const Tray = electron.Tray;
const {ipcMain} = require("electron");

const _ = require("lodash");
const fs = require("fs");
const path = require("path");
const parseArgs = require("minimist");

const screen = require("./lib/screen.js");
const releaseChecker = require("./lib/release_check.js");
const power = require("./lib/power.js");
let stateManager = require("./lib/state_manager.js");

const robot = require("robotjs");

var Raven;

// NOTE -- this needs to be global, otherwise the app icon gets
// garbage collected and won't show up in the system tray
let appIcon = null;

let argv = parseArgs(process.argv);
let debugMode = ( argv.debug === true );
let testMode = ( process.env.TEST_MODE !== undefined );

let saverWindows = [];
let oldMousePosition = {x:0, y:0};

var appReady = false;
var configLoaded = false;

var shouldQuit = false;

var globalCSSCode;

var prefsWindowHandle = null;
var trayMenu;

var electronScreen;


var icons = {
  "win32" : {
    active: __dirname + "/assets/icon.ico",
    paused: __dirname + "/assets/icon-paused.ico"
  },
  "default": {
    active: __dirname + "/assets/icon.png",
    paused: __dirname + "/assets/icon-paused.png"
  }
};


/**
 * open our screen grabber tool and issue a screengrab request
 */
var grabScreen = function(s, cb) {

  // bypass screen capture in test mode
  // this is a hack and if i can find a better
  // way to do it (listening for the prefs window, etc),
  // i'll do that instead
  if ( testMode === true ) {
    cb({
      url: "file://" + __dirname + "/../test/fixtures/screenshot.png"
    });
    return;
  }

  var grabberUrl = "file://" + __dirname + "/html/grabber.html?id=" + s.id +
                   "&width=" + s.bounds.width +
                   "&height=" + s.bounds.height;

  var grabber = new BrowserWindow({
    show: debugMode === true,
    width:200,
    height:200
  });

  grabber.on("closed", function() {
    grabber = null;
  });
  
  var ipc_channel = "screenshot-" + s.id;
  ipcMain.once("screenshot-" + s.id, function(e, message) {
    log.info("got screenshot!", message);
    cb(message);
    grabber.close();
  });
  
  grabber.loadURL(grabberUrl);

  if ( debugMode === true ) {
    grabber.webContents.openDevTools();
  }
};

var testWindow;
var openTestShim = function() {
  testWindow = new BrowserWindow({
    width: 200,
    height: 200
  });
  testWindow.loadURL("file://" + __dirname + "/html/test-shim.html");
};


/**
 * Open the preferences window
 */
var openPrefsWindow = function() {
  var primary = electronScreen.getPrimaryDisplay();

  // take a screenshot of the main screen for use in previews
  grabScreen(primary, function(message) {
    // call savers.reload to make sure our data is properly refreshed
    // and check for any system updates
    global.savers.reload(function() {
      var prefsUrl = "file://" + __dirname + "/html/prefs.html";
      prefsWindowHandle = new BrowserWindow({
        width:800,
        height:700,
        resizable:true,
        icon: path.join(__dirname, "assets", "icon.png")
      });

      prefsUrl = prefsUrl + "?screenshot=" + encodeURIComponent("file://" + message.url);
      
      prefsWindowHandle.loadURL(prefsUrl);
      
      if ( typeof(app.dock) !== "undefined" ) {
        app.dock.show();
      }

      if ( debugMode === true ) {
        prefsWindowHandle.webContents.openDevTools();
      }

      prefsWindowHandle.on("closed", function() {
        prefsWindowHandle = null;

        if ( typeof(app.dock) !== "undefined" ) {
          app.dock.hide();
        }
      });

      // we could do something nice with either of these events
      prefsWindowHandle.webContents.on("crashed", function (e) {
        log.info(e);
      });
      prefsWindowHandle.webContents.on("unresponsive", function (e) {
        log.info(e);
      });
    });
  });
};

var addNewSaver = function(screenshot) {
  var newUrl = "file://" + __dirname + "/html/new.html" +
               "?screenshot=" + encodeURIComponent(screenshot);

  var w = new BrowserWindow({
    width:450,
    height:550,
    resizable:true
  });

  w.loadURL(newUrl);
  w.webContents.openDevTools();
};


/**
 * Open the About window for the app
 */
var openAboutWindow = function() {
  var prefsUrl = "file://" + __dirname + "/html/about.html";
  var w = new BrowserWindow({
    width:500,
    height:400,
    resizable:false,
    icon: path.join(__dirname, "assets", "icon.png")
  });

  w.loadURL(prefsUrl);
  if ( typeof(app.dock) !== "undefined" ) {
    app.dock.show();
  }
  
  if ( debugMode === true ) {
    w.webContents.openDevTools();
  }
  w.on("closed", function() {
    w = null;
    if ( typeof(app.dock) !== "undefined" ) {
      app.dock.hide();
    }
  });
};

/**
 * open the help section in a browser
 */
var openHelpUrl = function() {
  try {
    require("electron").shell.openExternal(global.HELP_URL);
  }
  catch(e) {
    log.info(e);
  }
};


/**
 * open the github issues url in a browser
 */
var openIssuesUrl = function() {
  try {
    require("electron").shell.openExternal(global.ISSUES_URL);
  }
  catch(e) {
    log.info(e);
  }
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

/**
 * run the specified screensaver on the specified screen
 */
var runScreenSaverOnDisplay = function(saver, s) {
  var size = s.bounds;
  var url_opts = { 
    width: size.width,
    height: size.height,
    platform: process.platform
  };
  
  var windowOpts = {
    backgroundColor: "#000000",
    autoHideMenuBar: true,
    alwaysOnTop: true,
    x: s.bounds.x,
    y: s.bounds.y,
    show: false,
    frame: false
  };

  var tickCount;
  
  // osx will display window immediately if fullscreen is true
  // so we default it to false there
  if (process.platform !== "darwin") {
    windowOpts.fullscreen = true;
  }
  
  log.info("runScreenSaverOnDisplay");
  // don't do anything if we don't actually have a screensaver
  if ( typeof(saver) === "undefined" || saver === null ) {
    return;
  }

  tickCount = process.hrtime();

  var runSaver = function(message) {
    var url;
    var w = new BrowserWindow(windowOpts);       
    saverWindows.push(w);

    log.info("got screenshot back, let's do this");
    
    try {   
      // Emitted when the window is closed.
      w.on("closed", function() {
        saverWindows = _.filter(saverWindows, function(w2) {
          return (w2 !== w);
        });
        log.info("running windows: " + saverWindows.length);

        forceWindowClose(w);
      });
      
      // inject our custom JS and CSS into the screensaver window
      w.webContents.on("did-finish-load", function() {
        log.info("did-finish-load");
        if (!w.isDestroyed()) {
          w.webContents.insertCSS(globalCSSCode);
        }
      });

      // we could do something nice with either of these events
      w.webContents.on("crashed", function (e) {
        log.info(e);
      });
      w.webContents.on("unresponsive", function (e) {
        log.info(e);
      });

      
      w.once("ready-to-show", () => {
        var diff;

        log.info("ready-to-show");
        if ( debugMode !== true ) {
          w.setFullScreen(true);
        }

        if (process.platform !== "darwin") {
          w.show();
        }

        //w.minimize();       
        w.focus();

        diff = process.hrtime(tickCount);
        log.info(`rendered in ${diff[0] * 1e9 + diff[1]} nanoseconds`);
      });
      
      // windows is having some issues with putting the window behind existing
      // stuff -- @see https://github.com/atom/electron/issues/2867
      // w.minimize();
      // w.focus();

      if ( typeof(message) !== "undefined" ) {
        url_opts.screenshot = encodeURIComponent("file://" + message.url);
      }

      url = saver.getUrl(url_opts);

      log.info("Loading " + url);

      if ( debugMode === true ) {
        w.webContents.openDevTools();
      }

      // and load the index.html of the app.
      w.loadURL(url);
    }
    catch (e) {
      log.info(e);
      forceWindowClose(w);
    }
  };

  

  //
  // if this screensaver uses a screengrab, get it. 
  // otherwise just boot it
  //
  if ( _.findIndex(saver.getRequirements(), function(x) { return x === "screen"; }) > -1 ) {
    grabScreen(s, runSaver);
  }
  else {
    runSaver();
  }

};

/**
 * get a list of displays connected to the computer.
 */
var getDisplays = function() {
  var displays = [];
  if ( debugMode === true ) {
    displays = [
      electronScreen.getPrimaryDisplay()
    ];
  }
  else {
    displays = electronScreen.getAllDisplays();
  }

  return displays;
};


/**
 * manually trigger screensaver by setting state to run
 */
var setStateToRunning = function() {
  stateManager.run();
};


/**
 * run the user's chosen screensaver on any available screens
 */
var runScreenSaver = function() {
  var displays = getDisplays();

  var saver = global.savers.getCurrentData();

  // make sure we have something to display
  if ( typeof(saver) === "undefined" ) {
    return;
  }

  saver = global.savers.applyPreload(saver);
  
  oldMousePosition = robot.getMousePos();

  // move cursor so far off screen, it isn't even funny
  robot.moveMouse(30000, 30000);
  
  // @todo maybe add an option to only run on a single display?
  
  // limit to a single screen when debugging
  if ( debugMode === true ) {
    if ( typeof(app.dock) !== "undefined" ) {
      app.dock.show();
    }
  }
  
  try {
    // turn off idle checks for a couple seconds while loading savers
    stateManager.ignoreReset(true);

    for ( var i in displays ) {
      runScreenSaverOnDisplay(saver, displays[i]);
    } // for
  }
  catch (e) {
    stateManager.ignoreReset(false);
    log.info(e);
  }
  finally {
    setTimeout(function() {
      stateManager.ignoreReset(false);
    }, 2500);
  }
};

/**
 * check if the screensaver is still running
 */
var screenSaverIsRunning = function() {
  return ( saverWindows.length > 0 );
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
  log.info("display change, let's close running screensavers");
  closeRunningScreensavers();
};

/**
 * close any running screensavers
 */
var closeRunningScreensavers = function() {
  log.info("closeRunningScreensavers");
  if ( debugMode !== true ) {
    if ( oldMousePosition.x !== 0 && oldMousePosition.y !== 0 ) {
      log.info("restore mouse to", oldMousePosition.x, oldMousePosition.y); 
      robot.moveMouse(oldMousePosition.x, oldMousePosition.y);
    }

    attemptToStopScreensavers();
    setTimeout(forcefullyCloseScreensavers, 2500);
  }
};

/**
 * iterate through our list of running screensaver windows and attempt
 * to close them nicely
 */
var attemptToStopScreensavers = function() {
  _.forEach(saverWindows, function(w) {
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
  _.forEach(saverWindows, function(w) {
    if ( activeWindowHandle(w) ) {
      w.destroy();
    }
  });

  saverWindows = [];
};


/**
 * should we lock the user's screen when returning from running the saver?
 */
var shouldLockScreen = function() {
  return ( global.savers.getLock() === true );
};

/**
 * stop the running screensaver
 */
var stopScreenSaver = function(fromBlank) {
  log.info("received stopScreenSaver call");

  
  if ( fromBlank !== true ) {
    stateManager.reset();
  }
  
  // trigger lock screen before actually closing anything
  else if ( shouldLockScreen() ) {
    screen.doLockScreen();
  }

  closeRunningScreensavers();
};


/**
 * once the app is ready and our config is loaded, check to see if the app
 * has been loaded before. if not, let's go ahead and open the prefs window now.
 */
var openPrefsOnFirstLoad = function() {
  if ( appReady === false || configLoaded === false ) {
    return;
  }
  if ( global.savers.firstLoad() === true ) {
    setTimeout(openPrefsWindow, 1000);
  }
};


/**
 * handle initial startup of app
 */
var bootApp = function(_basePath) {
  var icons = getIcons();
  // @todo i think asar breaks this
  var menuTemplate = require("./js/menu_template.js").buildMenuTemplate(app);
  var menu = Menu.buildFromTemplate(menuTemplate);

  Menu.setApplicationMenu(menu);

  if ( typeof(_basePath) !== "undefined" ) {
    global.basePath = _basePath;
  }

  trayMenu.items[3].visible = global.NEW_RELEASE_AVAILABLE;

  electronScreen = electron.screen;
  electronScreen.on("display-added", handleDisplayChange);
  electronScreen.on("display-removed", handleDisplayChange);
  electronScreen.on("display-metrics-changed", handleDisplayChange);    

  electron.powerMonitor.on("suspend", () => {
    log.info("The system is going to sleep, stop screensavers");
    closeRunningScreensavers();
  });
  electron.powerMonitor.on("resume", () => {
    log.info("The system just woke up, stop screensavers");
    closeRunningScreensavers();
  });

  log.info("Load config from " + global.basePath);
  global.savers.init(global.basePath, function() {
    configLoaded = true;
    updateStateManager();
    
    // check for a new release every 12 hours
    setInterval(checkForNewRelease, 1000 * 60 * 60 * 12);

    appIcon = new Tray(icons.active);
    appIcon.setToolTip(global.APP_NAME);
    appIcon.setContextMenu(trayMenu); 

    // show tray menu on right click
    // @todo should this be osx only?
    appIcon.on("right-click", () => {
      appIcon.popUpContextMenu();
    });
    
    if ( argv.screen === "prefs" ) {
      openPrefsWindow();
    }
    else if ( argv.screen === "about" ) {
      openAboutWindow();
    }
    else if ( argv.screen === "saver" ) {
      setStateToRunning();
    }
    
    appReady = true;
    
    if ( testMode === true ) {
      openTestShim();
    }
    else {
      openPrefsOnFirstLoad();
    }

  });
};


/**
 * try and guess if we are in fullscreen mode or not
 */
var inFullscreen = require("./lib/fullscreen.js").inFullscreen;

/**
 * run the screensaver, but only if there isn't an app in fullscreen mode right now
 */
var runScreenSaverIfNotFullscreen = function() {
  log.info("runScreenSaverIfNotFullscreen");
  if ( ! inFullscreen() ) {
    log.info("I don't think we're in fullscreen mode");
    runScreenSaver();
  }
  else {
    log.info("looks like we are in fullscreen mode");
  }
};

/**
 * activate the screensaver, but only if we're plugged in, or if the user
 * is fine with running on battery
 */
var runScreenSaverIfPowered = function() {
  log.info("runScreenSaverIfPowered");

  if ( screenSaverIsRunning() ) {
    log.info("looks like we're already running");
    return;
  }
  
  // check if we are on battery, and if we should be running in that case
  if ( global.savers.getDisableOnBattery() ) {
    power.charging().then((is_powered) => {
      if ( is_powered ) {       
        runScreenSaverIfNotFullscreen();
      }
      else {
        log.info("I would run, but we're on battery :(");
      }
    });
  }
  else {
    runScreenSaverIfNotFullscreen();
  }
};

/**
 * if the screensaver is running, blank the screen. otherwise,
 * reset state machine
 */
var blankScreenIfNeeded = function() {
  log.info("blankScreenIfNeeded");
  if ( screenSaverIsRunning() ) {
    log.info("running, close windows");
    stopScreenSaver(true);
    screen.doSleep();
  }
};

/**
 * update the state manager with our
 * timeout values, etc
 */
var updateStateManager = function() {
  log.info("updateStateManager idleTime: " +
           global.savers.getDelay());

  stateManager.setup({
    idleTime: global.savers.getDelay() * 60000,
    blankTime: (global.savers.getDelay() + global.savers.getSleep()) * 60000,
    onIdleTime: runScreenSaverIfPowered,
    onBlankTime: blankScreenIfNeeded,
    onReset: closeRunningScreensavers
  });
};


/**
 * check for a new release of the app
 */
var checkForNewRelease = function() {
  log.info("checkForNewRelease");
  releaseChecker.checkLatestRelease(
    global.APP_REPO, global.APP_VERSION, 
    function() {
      global.NEW_RELEASE_AVAILABLE = true;
      trayMenu.items[3].visible = global.NEW_RELEASE_AVAILABLE;
    }, 
    function() {
      global.NEW_RELEASE_AVAILABLE = false;
      trayMenu.items[3].visible = global.NEW_RELEASE_AVAILABLE;
    });
};

/**
 * get icons for the current platform
 */
var getIcons = function() {
  if ( icons[process.platform] ) {
    return icons[process.platform];
  }

  return icons.default;
};

/**
 * update tray icon to match our current state
 */
var updateTrayIcon = function() {
  var icons = getIcons();
  if ( stateManager.currentState() === stateManager.states.STATE_PAUSED ) {
    appIcon.setImage(icons.paused);
  }
  else {
    appIcon.setImage(icons.active);
  }
};

// load a few global variables
require("./bootstrap.js");

log.transports.file.maxSize = 1 * 1024 * 1024;
log.transports.file.file = path.join(__dirname, "/log.txt");

if ( typeof(global.RAVEN_PRIVATE_URL) !== "undefined" ) {
  Raven = require("raven");
  log.info("Setup sentry logging with " + global.RAVEN_PRIVATE_URL);
  Raven.config(global.RAVEN_PRIVATE_URL).install();
}

crashReporter.start(global.CRASH_REPORTER);

// store our root path as a global variable so we can access it from screens
if ( process.env.BEFORE_DAWN_DIR !== undefined ) {
  global.basePath = process.env.BEFORE_DAWN_DIR;
}
else {
  global.basePath = path.join(app.getPath("appData"), global.APP_DIR);
}
global.savers = require("./lib/savers.js");

// some global CSS we'll inject into running screensavers
globalCSSCode = fs.readFileSync( path.join(__dirname, "assets", "global.css"), "ascii");  


/**
 * make sure we're only running a single instance
 */
shouldQuit = app.makeSingleInstance(function(commandLine, workingDirectory) {
  return true;
});

if (shouldQuit) {
  app.quit();
}

// don't show app in dock
if ( typeof(app.dock) !== "undefined" ) {
  app.dock.hide();
}


//
// build the tray menu
//
trayMenu = Menu.buildFromTemplate([
  {
    label: "Run Now",
    click: function() {
      setTimeout(setStateToRunning, 50);
    }
  },
  {
    label: "Disable",
    click: function() {
      stateManager.pause();
      updateTrayIcon();
      trayMenu.items[1].visible = false;
      trayMenu.items[2].visible = true;
    }
  },
  {
    label: "Enable",
    click: function() { 
      stateManager.reset();
      updateTrayIcon();
      trayMenu.items[1].visible = true;
      trayMenu.items[2].visible = false;
    },
    visible: false
  },
  {
    label: "Update Available!",
    click: function() { 
      require("electron").shell.openExternal("https://github.com/" + global.APP_REPO + "/releases/latest");
    },
    visible: (global.NEW_RELEASE_AVAILABLE === true)
  },
  {
    label: "Preferences",
    click: function() { openPrefsWindow(); }
  },
  {
    label: "About " + global.APP_NAME,
    click: function() { openAboutWindow(); }
  },
  {
    label: "Help",
    click: function() { openHelpUrl(); }
  },
  {
    label: "Report a Bug",
    click: function() { openIssuesUrl(); }
  },
  {
    label: "Quit",
    click: function() { app.quit(); }
  }
]);


//
// if the user has updated one of their screensavers, we can let
// the prefs window know that it needs to reload
//
ipcMain.on("savers-updated", (event, arg) => {
  global.savers.reset();  
  if ( prefsWindowHandle !== null ) {
    prefsWindowHandle.send("savers-updated", arg);
  }
});

//
// user has updated their preferences, let's reload
//
ipcMain.on("prefs-updated", (event, arg) => {
  log.info("prefs-updated");
  global.savers.reload(function() {
    updateStateManager();
  });
});

ipcMain.on("open-prefs", (event) => {
  openPrefsWindow();
});

ipcMain.on("open-add-screensaver", (event, screenshot) => {
  addNewSaver(screenshot);
});

ipcMain.on("open-editor", (event, args) => {
  var key = args.src;
  var screenshot = args.screenshot;

  var w = new BrowserWindow();

  // pass the key of the screensaver we want to load
  // as well as the URL to our screenshot image
  var target = "file://" + __dirname + "/html/watcher.html?" +
               "src=" + encodeURIComponent(key) +
               "&screenshot=" + encodeURIComponent(screenshot);
  w.loadURL(target);
});

ipcMain.on("list-savers", (event) => {
  global.savers.toList(function(data) {
    event.sender.send("list-savers", data);
  });
});


// seems like we need to catch this event to keep OSX from exiting app after screensaver runs?
app.on("window-all-closed", function() {
  log.info("window-all-closed");
});
app.on("before-quit", function() {
  log.info("before-quit");
});
app.on("will-quit", function() {
  log.info("will-quit");
});
app.on("quit", function() {
  log.info("quit");
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.once("ready", function() {  
  if ( testMode === true ) {
    bootApp();
    return;
  }

  /**
   * check for a release and then boot!
   */
  releaseChecker.checkLatestRelease(
    global.APP_REPO, global.APP_VERSION, 
    function() {
      global.NEW_RELEASE_AVAILABLE = true;
      bootApp();
    }, 
    function() {
      bootApp();
    });
});

process.on("uncaughtException", function (ex) {
  log.info(ex);
  if ( typeof(Raven) !== "undefined" ) {
    Raven.captureException(ex);
  }
});

