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

const screen = require("./screen.js");
var releaseChecker;
const power = require("./power.js");
let stateManager = require("./state_manager.js");

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
var exitOnQuit = false;

var globalCSSCode;

var prefsWindowHandle = null;
var trayMenu;

var electronScreen;

var testWindow;

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


const urlPrefix = process.env.NODE_ENV === "development"
             ? "http://localhost:9080"
             : "file://" + __dirname

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

  var grabberUrl = "file://" + __dirname + "/assets/grabber.html?id=" + s.id +
                   "&width=" + s.bounds.width +
                   "&height=" + s.bounds.height;

  var grabber = new BrowserWindow({
    show: debugMode === true,
    width:200,
    height:200,
    x: 1000,
    y: 1000
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
};


/**
 * open a simple window that our mocha/spectron tests can use.
 *
 * this exists mostly because it's basically impossible to test
 * an app that doesn't open a window.
 */
var openTestShim = function() {
  testWindow = new BrowserWindow({
    width: 200,
    height: 200
  });

  // just open an empty window
  testWindow.loadURL("file:///");  
};

/**
 * if we're using the dock, and all our windows are closed, hide the
 * dock icon
 */
var hideDockIfInactive = function() {
  if (  typeof(app.dock) !== "undefined" && BrowserWindow.getAllWindows().length === 0 ) {
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
      var prefsUrl = urlPrefix + "/prefs.html";
           
      prefsWindowHandle = new BrowserWindow({
        width:800,
        height:700,
        resizable:true,
        // @todo i added this when switching to webpack/vue,
        // can it be tossed again?
        webPreferences: {
          webSecurity: false
        },
        icon: path.join(__dirname, "assets", "icon.png")
      });

      prefsWindowHandle.savers = global.savers;
      
      prefsUrl = prefsUrl + "?screenshot=" + encodeURIComponent("file://" + message.url);
      
      prefsWindowHandle.loadURL(prefsUrl);

      showDock();

      prefsWindowHandle.on("closed", function() {
        prefsWindowHandle = null;
        hideDockIfInactive();
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
  var newUrl;

  if ( screenshot.screenshot ) {
    screenshot = screenshot.screenshot;
  }

  var newUrl = urlPrefix + "/new.html";

  newUrl = newUrl + "?screenshot=" + encodeURIComponent(screenshot);

  var w = new BrowserWindow({
    width:450,
    height:620,
    resizable:true
  });

  w.savers = global.savers;
  w.loadURL(newUrl);

  showDock();
  w.on("closed", () => {
    w = null;
    hideDockIfInactive();
  });
};

/**
 * Open the About window for the app
 */
var openAboutWindow = function() {
  var aboutUrl = urlPrefix + "/about.html";
  var w = new BrowserWindow({
    width:500,
    height:400,
    resizable:false,
    icon: path.join(__dirname, "assets", "icon.png"),
    webPreferences: {
      webSecurity: false
    }
  });

  w.loadURL(aboutUrl);

  showDock();

  w.on("closed", () => {
    w = null;
    hideDockIfInactive();
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
 * get the BrowserWindow options we'll use to launch
 * on the given screen.
 */
var getWindowOpts = function(s) {
  var opts = {
    backgroundColor: "#000000",
    autoHideMenuBar: true,
    alwaysOnTop: true,
    x: s.bounds.x,
    y: s.bounds.y,
    show: false
  };

  // osx will display window immediately if fullscreen is true
  // so we default it to false there
  if (process.platform !== "darwin") {
    opts.fullscreen = true;
  }

  return opts;

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
  
  var windowOpts = getWindowOpts(s);

  var tickCount;
  var diff;


  log.info("runScreenSaverOnDisplay", s.id, windowOpts);

  // don't do anything if we don't actually have a screensaver
  if ( typeof(saver) === "undefined" || saver === null ) {
    log.info("no saver, exiting");
    return;
  }

  tickCount = process.hrtime();

  var runSaver = function(message) {
    var url;
    var w = new BrowserWindow(windowOpts);       
    saverWindows.push(w);

    diff = process.hrtime(tickCount);
    log.info("got screenshot back, let's do this", s.id, diff[0] * 1e9 + diff[1]);
    
    try {   
      // Emitted when the window is closed.
      w.on("closed", function() {
        saverWindows = _.filter(saverWindows, function(w2) {
          return (w2 !== w);
        });
        log.info("running windows: " + saverWindows.length + " closed: " + s.id);

        forceWindowClose(w);
      });
      
      // inject our custom JS and CSS into the screensaver window
      w.webContents.on("did-finish-load", function() {
        log.info("did-finish-load", s.id);
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
        log.info("ready-to-show", s.id);
        if ( debugMode !== true ) {
          w.setFullScreen(true);
        }

        w.show();
        //        w.focus();

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

      log.info("Loading " + url, s.id);

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
 * blank out the given screen
 */
var blankScreen = function(s) {
  var windowOpts = getWindowOpts(s);
  var w = new BrowserWindow(windowOpts);       
  w.setFullScreen(true);

  log.info("blankScreen", s.id, windowOpts);

  saverWindows.push(w);

  w.show();
};


/**
 * get a list of displays connected to the computer.
 */
var getDisplays = function() {
  var displays = [];
  if ( debugMode === true  || global.savers.getRunOnSingleDisplay() === true ) {
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
 * get a list of the non primary displays connected to the computer
 */
var getNonPrimaryDisplays = function() {
  var primary = electronScreen.getPrimaryDisplay()
  return electronScreen.getAllDisplays().filter((d) => {
    return d.id !== primary.id;
  });
}

/**
 * manually trigger screensaver by setting state to run
 */
var setStateToRunning = function() {
  // disable power state check
  checkPowerState = false;
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

    // if we're only running on primary display, blank out the other ones
    if ( debugMode !== true && global.savers.getRunOnSingleDisplay() === true ) {
      var otherDisplays = getNonPrimaryDisplays();
      for ( var i in otherDisplays ) {
        blankScreen(otherDisplays[i]);
      }
    }
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


var getSystemDir = function() {
  if ( process.env.BEFORE_DAWN_SYSTEM_DIR !== undefined ) {
    return process.env.BEFORE_DAWN_SYSTEM_DIR;
  }
  
  if ( global.IS_DEV ) {
    return __dirname;
  }

  return path.join(app.getAppPath(), "output");
}


/**
 * handle initial startup of app
 */
var bootApp = function() {
  var icons = getIcons();
  var menu = Menu.buildFromTemplate(buildMenuTemplate(app));

  Menu.setApplicationMenu(menu);

  global.NEW_RELEASE_AVAILABLE = false;
  trayMenu.items[3].visible = global.NEW_RELEASE_AVAILABLE;

  //
  // setup some event handlers for when screen count changes, mostly
  // to ensure that we wake up if the user plugs in or removes a
  // monitor
  //
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


  let saverOpts = {
    base: global.basePath,
    systemDir: getSystemDir(),
    logger: log.info
  };
  
  log.info("Load config with", saverOpts);
  global.savers.init(saverOpts, function() {
    configLoaded = true;
    updateStateManager();

    appIcon = new Tray(icons.active);
    appIcon.setToolTip(global.APP_NAME);
    appIcon.setContextMenu(trayMenu); 

    // show tray menu on right click
    // @todo should this be osx only?
    appIcon.on("right-click", () => {
      appIcon.popUpContextMenu();
    });
    
    appReady = true;
        
    if ( testMode === true ) {
      openTestShim();
    }
    else {
      if ( argv.screen === "prefs" ) {
        openPrefsWindow();
      }
      else if ( argv.screen === "about" ) {
        openAboutWindow();
      }
      else if ( argv.screen === "saver" ) {
        setStateToRunning();
      }
      openPrefsOnFirstLoad();
    }

    if ( global.CHECK_FOR_RELEASE === true ) {
      releaseChecker = require("./release_check.js");
      
      releaseChecker.setFeed(global.RELEASE_CHECK_URL);
      releaseChecker.setLogger(log.info);
      releaseChecker.onUpdate((x) => {
        console.log(x);
        global.NEW_RELEASE_AVAILABLE = true;
        log.info("new release");
        trayMenu.items[3].visible = global.NEW_RELEASE_AVAILABLE;
      });
      releaseChecker.onNoUpdate(() => {
        global.NEW_RELEASE_AVAILABLE = false;
        log.info("no new release");
        trayMenu.items[3].visible = global.NEW_RELEASE_AVAILABLE;
      });

      // check for a new release every 12 hours
      log.info("Setup release check");
      checkForNewRelease();
      setInterval(checkForNewRelease, 1000 * 60 * 60 * 12);
    }
    
  });
};


/**
 * try and guess if we are in fullscreen mode or not
 */
var inFullscreen = require("./fullscreen.js").inFullscreen;

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

// usually we want to check power state before running, but
// we'll skip that check depending on the value of this toggle
// so that manually running screensaver works just fine
var checkPowerState = true;

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
  if ( checkPowerState && global.savers.getDisableOnBattery() ) {
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
    checkPowerState = true;
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
  log.info("updateStateManager",
           "idleTime: " + global.savers.getDelay(),
           "blankTime: " + (global.savers.getDelay() + global.savers.getSleep())
  );

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
  releaseChecker.checkLatestRelease();
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

var buildMenuTemplate = function(a) {
  var app = a;
  var openAddNewWindow = function(w) {
    w.webContents.send("request-open-add-screensaver");
  };

  var base = [
    {
      label: "File",
      submenu: [
        {
          label: "Add New Screensaver",
          accelerator: "CmdOrCtrl+N",
          click: function(item, focusedWindow) {
            openAddNewWindow(focusedWindow);
          }
        },
      ]
    },

    {
      label: "Edit",
      submenu: [
        {
          label: "Undo",
          accelerator: "CmdOrCtrl+Z",
          role: "undo"
        },
        {
          label: "Redo",
          accelerator: "Shift+CmdOrCtrl+Z",
          role: "redo"
        },
        {
          type: "separator"
        },
        {
          label: "Cut",
          accelerator: "CmdOrCtrl+X",
          role: "cut"
        },
        {
          label: "Copy",
          accelerator: "CmdOrCtrl+C",
          role: "copy"
        },
        {
          label: "Paste",
          accelerator: "CmdOrCtrl+V",
          role: "paste"
        },
        {
          label: "Select All",
          accelerator: "CmdOrCtrl+A",
          role: "selectall"
        }
      ]
    },
    {
      label: "View",
      submenu: [
        {
          label: "Reload",
          accelerator: "CmdOrCtrl+R",
          click: function(item, focusedWindow) {
            if (focusedWindow) {
              focusedWindow.reload();
            }
          }
        },
        {
          label: "Toggle Developer Tools",
          accelerator: (function() {
            if (process.platform == "darwin") {
              return "Alt+Command+I";
            }
            else {
              return "Ctrl+Shift+I";
            }
          })(),
          click: function(item, focusedWindow) {
            if (focusedWindow) {
              focusedWindow.toggleDevTools();
            }
          }
        }
      ]
    },
    {
      label: "Window",
      role: "window",
      submenu: [
        {
          label: "Minimize",
          accelerator: "CmdOrCtrl+M",
          role: "minimize"
        },
        {
          label: "Close",
          accelerator: "CmdOrCtrl+W",
          role: "close"
        }
      ]
    },
    {
      label: "Help",
      role: "help",
      submenu: [
        {
          label: "Learn More",
          click: function() {
            require("electron").shell.openExternal("https://github.com/muffinista/before-dawn");
          }
        },
        {
          label: "Help",
          click: function() {
            require("electron").shell.openExternal(global.HELP_URL);
          }
        }
      ]
    }
  ];


  if (process.platform == "darwin") {
    var name = app.getName();
    base.unshift({
      label: name,
      submenu: [
        {
          label: "About " + name,
          role: "about"
        },
        {
          type: "separator"
        },
        {
          label: "Services",
          role: "services",
          submenu: []
        },
        {
          type: "separator"
        },
        {
          label: "Hide " + name,
          accelerator: "Command+H",
          role: "hide"
        },
        {
          label: "Hide Others",
          accelerator: "Command+Alt+H",
          role: "hideothers"
        },
        {
          label: "Show All",
          role: "unhide"
        },
        {
          type: "separator"
        },
        {
          label: "Quit",
          accelerator: "Command+Q",
          click: function() {
            exitOnQuit = false;
            app.quit();
          }
        }
      ]
    });
  }


  return base;
};


// load a few global variables
require("./bootstrap.js");

log.transports.file.level = "debug";
log.transports.file.maxSize = 1 * 1024 * 1024;

if ( typeof(global.RAVEN_PRIVATE_URL) !== "undefined" ) {
  Raven = require("raven");
  log.info("Setup sentry logging with " + global.RAVEN_PRIVATE_URL);
  Raven.config(global.RAVEN_PRIVATE_URL, global.RAVEN_OPTIONS).install();
}


log.info("Hello from version: " + global.APP_VERSION_BASE);

if (global.IS_DEV) {
	log.info("Running in development");
}
else {
	log.info("Running in production");
}

// store our root path as a global variable so we can access it from screens
if ( process.env.BEFORE_DAWN_DIR !== undefined ) {
  global.basePath = process.env.BEFORE_DAWN_DIR;
}
else {
  global.basePath = path.join(app.getPath("appData"), global.APP_DIR);
}
global.savers = require("../lib/savers.js");

/**
 * make sure we're only running a single instance
 */
if ( testMode !== true ) {
  shouldQuit = app.makeSingleInstance(function(commandLine, workingDirectory) {
    return true;
  });

  if (shouldQuit) {
    log.info("looks like another copy of app is running, exiting!");
    app.quit();
    process.exit();
  }
}

// load some global CSS we'll inject into running screensavers
globalCSSCode = fs.readFileSync( path.join(__dirname, "assets", "global.css"), "ascii");  

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
    click: function() {
      exitOnQuit = true;
      app.quit();
    }
  }
]);


//
// if the user has updated one of their screensavers, we can let
// the prefs window know that it needs to reload
//
ipcMain.on("savers-updated", (event, arg) => {
  global.savers.reset();  
  if ( prefsWindowHandle !== null ) {
    global.savers.reload(function() {
      prefsWindowHandle.send("savers-updated", arg);
    });
  }
});

//
// user has updated their preferences, let's reload
//
ipcMain.on("prefs-updated", (event, arg) => {
  log.info("prefs-updated");
  global.savers.reset();
  global.savers.reload(function() {
    updateStateManager();
  });
});

//
// handle request to open the prefs window
//
ipcMain.on("open-prefs", (event) => {
  log.info("open-prefs");
  openPrefsWindow();
});


//
// handle request to open 'add new saver' window
//
ipcMain.on("open-add-screensaver", (event, screenshot) => {
  log.info("open-add-screensaver");
  addNewSaver(screenshot);
});

ipcMain.on("open-editor", (event, args) => {
  var key = args.src;
  var screenshot = args.screenshot;

  var w = new BrowserWindow({
    // @todo i added this when switching to webpack/vue,
    // can it be tossed again?
    webPreferences: {
      webSecurity: false
    },
  });
  w.savers = global.savers;
  
  // pass the key of the screensaver we want to load
  // as well as the URL to our screenshot image

  var editorUrl = urlPrefix + "/editor.html";
 
  var target = editorUrl + "?" +
               "src=" + encodeURIComponent(key) +
               "&screenshot=" + encodeURIComponent(screenshot);
  w.loadURL(target);

  w.on("closed", () => {
    w = null;
    hideDockIfInactive();
  });
  
  showDock();
});


ipcMain.on("set-autostart", (event, value) => {
  var AutoLaunch = require("auto-launch");
  var appName = global.APP_NAME;
  var appLauncher = new AutoLaunch({
    name: appName
  });

  if ( value === true ) {
    appLauncher.isEnabled().then((isEnabled) => {
      if ( isEnabled ) {
        return;
      }
      
      appLauncher.enable().
                  then((err) =>{
                    log.info("appLauncher enable", err);
                  }).catch((err) => {
                    log.info("appLauncher enable failed", err);
                  });
    });
  }
  else {
    log.info("set auto start == false");
    appLauncher.isEnabled().then((isEnabled) => {
      if ( !isEnabled ) {
        return;
      }
      appLauncher.disable().
                  then(function(x) { }).
                  catch((err) => {
                    log.info("appLauncher disable failed", err);
                  });
    });
  }


});

//
// generate screensaver template with specified attributes
//
ipcMain.on("generate-screensaver", (event, args) => {
  var src = path.join(getSystemDir(), "__template");
  var data = global.savers.generateScreensaver(src, args);
  event.sender.send("generate-screensaver", data);

  global.savers.reset();
  global.savers.reload(function() {
    if ( prefsWindowHandle !== null ) {
      prefsWindowHandle.send("savers-updated");
    }
  });
});

// seems like we need to catch this event to keep OSX from exiting app after screensaver runs?
app.on("window-all-closed", function() {
  log.info("window-all-closed");
});
app.on("before-quit", function(e) {
  log.info("before-quit");
});
app.on("will-quit", function(e) {
  log.info("will-quit");
  if ( testMode !== true && global.IS_DEV !== true && exitOnQuit !== true ) {
    console.log("don't quit yet!");
    e.preventDefault();
  }
});
app.on("quit", function() {
  log.info("quit");
});


process.on("uncaughtException", function (ex) {
  log.info(ex);
  log.info(ex.stack);

  if ( typeof(Raven) !== "undefined" ) {
    Raven.captureException(ex);
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.once("ready", bootApp);




