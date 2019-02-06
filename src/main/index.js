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

const {app, dialog, BrowserWindow, ipcMain, Menu, Tray} = require("electron");

const fs = require("fs");
const path = require("path");
const url = require("url");

const screenLock = require("./screen.js");
const power = require("./power.js");

const idler = require("node-system-idle-time");

const StateManager = require("./state_manager.js");
const SaverPrefs = require("../lib/prefs.js");
const SaverListManager = require("../lib/saver-list.js");
const PackageDownloader = require("../lib/package-downloader.js");
const ReleaseCheck = require("./release_check.js");

var releaseChecker;

const menusAndTrays = require("./menus.js");
const dock = require("./dock.js");
const windows = require("./windows.js");
const autostarter = require("./autostarter.js");


// NOTE -- this needs to be global, otherwise the app icon gets
// garbage collected and won't show up in the system tray
let appIcon = null;

let debugMode = ( process.env.DEBUG_MODE !== undefined );
let testMode = ( process.env.TEST_MODE !== undefined );

var exitOnQuit = false;

// load some global CSS we'll inject into running screensavers
const globalCSSCode = fs.readFileSync( path.join(__dirname, "assets", "global.css"), "ascii");  


var prefsWindowHandle = null;
var trayMenu;

var electronScreen;

var testWindow;

let grabberWindow = null;

let prefs = undefined;
let stateManager = undefined;
let saverOpts = {};

// usually we want to check power state before running, but
// we'll skip that check depending on the value of this toggle
// so that manually running screensaver works just fine
var checkPowerState = true;

const RELEASE_CHECK_INTERVAL = 1000 * 60 * 60 * 12;


const singleLock = app.requestSingleInstanceLock();
if (! singleLock ) {
  // eslint-disable-next-line no-console
  console.log("looks like another copy of app is running, exiting!");
  app.quit();
  process.exit();
}


/**
 * Open the screengrab window
 * 
 * @param {function} cb - callback triggered when window is ready
 */
var openGrabberWindow = function() {
  return new Promise((resolve) => {
    var grabberUrl = "file://" + __dirname + "/assets/grabber.html";
    grabberWindow = new BrowserWindow({
      show: debugMode === true,
      width:100,
      height:100,
      x: 4000,
      y: 2000,
      webPreferences: {
        nodeIntegration: true,
        webSecurity: !global.IS_DEV,
        preload: global.TRACK_ERRORS ? path.join(__dirname, "assets", "sentry.js") : undefined
      }
    });
    grabberWindow.noTray = true;
    
    grabberWindow.on("closed", () => {});
    grabberWindow.once("ready-to-show", resolve);
    grabberWindow.loadURL(grabberUrl);  
  });
};

/**
 * open our screen grabber tool and issue a screengrab request
 * @param {Screen} s the screen to grab
 * @param {Function} cb callback triggered when work is done
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
  
  ipcMain.once("screenshot-" + s.id, function(e, message) {
    log.info("got screenshot!", message);
    cb(message);
  });

  grabberWindow.webContents.send("request-screenshot", { 
    id: s.id, 
    width: s.bounds.width, 
    height: s.bounds.height});

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
    height: 200,
    webPreferences: {
      nodeIntegration: true
    }
  });

  var shimUrl = "file://" + __dirname + "/shim.html";
  testWindow.loadURL(shimUrl);
  // testWindow.webContents.openDevTools();
};

/**
 * Open the preferences window
 */
var openPrefsWindow = function() {
  return new Promise((resolve) => {
    var primary = electronScreen.getPrimaryDisplay();

    // take a screenshot of the main screen for use in previews
    grabScreen(primary, function(message) {
      var prefsUrl = getUrl("prefs.html");
  
      prefsWindowHandle = new BrowserWindow({
        width:800,
        height:600,
        minWidth: 800,
        minHeight: 500,
        maxWidth: 1200,
        maxHeight: 1000,
        resizable:true,
        webPreferences: {
          webSecurity: !global.IS_DEV,
          nodeIntegration: true,
          preload: global.TRACK_ERRORS ? path.join(__dirname, "assets", "sentry.js") : undefined
        },
        icon: path.join(__dirname, "assets", "iconTemplate.png")
      });
  
      prefsWindowHandle.saverOpts = saverOpts;
      prefsWindowHandle.screenshot = message.url;
  
      prefsUrl = prefsUrl + "?screenshot=" + encodeURIComponent("file://" + message.url);
      
      log.info("loading " + prefsUrl);
      prefsWindowHandle.loadURL(prefsUrl);
  
      dock.showDock(app);
  
      prefsWindowHandle.on("closed", function() {
        prefsWindowHandle = null;
        dock.hideDockIfInactive(app);
      });
  
      // we could do something nice with either of these events
      // prefsWindowHandle.webContents.on("crashed", outputError);
      // prefsWindowHandle.webContents.on("unresponsive", outputError);
  
      prefsWindowHandle.once("show", resolve);
    });
  });
};


/**
 * handle new screensaver event. open the window to create a screensaver
 */
var addNewSaver = function() {
  var newUrl = getUrl("new.html");
  var primary = electronScreen.getPrimaryDisplay();

  // take a screenshot of the main screen for use in previews
  grabScreen(primary, function(message) {
    newUrl = newUrl + "?screenshot=" + encodeURIComponent("file://" + message.url);

    var w = new BrowserWindow({
      width:450,
      height:620,
      resizable:true,
      webPreferences: {
        webSecurity: !global.IS_DEV,
        nodeIntegration: true,
        preload: global.TRACK_ERRORS ? path.join(__dirname, "assets", "sentry.js") : undefined
      },
      icon: path.join(__dirname, "assets", "iconTemplate.png")
    });

    w.saverOpts = saverOpts;
    w.screenshot = message.url;

    w.loadURL(newUrl);

    dock.showDock(app);
    w.on("closed", () => {
      w = null;
      dock.hideDockIfInactive(app);
    });
  });
};

/**
 * Open the About window for the app
 */
var openAboutWindow = function() {
  var aboutUrl = getUrl("about.html");
  var w = new BrowserWindow({
    width:500,
    height:600,
    resizable:false,
    icon: path.join(__dirname, "assets", "iconTemplate.png"),
    webPreferences: {
      nodeIntegration: true,
      webSecurity: !global.IS_DEV,
      preload: global.TRACK_ERRORS ? path.join(__dirname, "assets", "sentry.js") : undefined
    }
  });

  w.loadURL(aboutUrl);

  dock.showDock(app);

  w.on("closed", () => {
    w = null;
    dock.hideDockIfInactive(app);
  });
};


/**
 * open the editor tool for a screensaver
 * @param {Object} args object with arguments
 * @param {string} args.src path to the JSON file for the screensaver
 * @param {string} args.screenshot path to the screenshot to use when editing
 */
var openEditor = (args) => {
  var key = args.src;
  var screenshot = args.screenshot;

  var w = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      webSecurity: !global.IS_DEV,
      preload: global.TRACK_ERRORS ? path.join(__dirname, "assets", "sentry.js") : undefined
    },
  });

  var editorUrl = getUrl("editor.html");
 
  var target = editorUrl + "?" +
               "src=" + encodeURIComponent(key) +
               "&screenshot=" + encodeURIComponent(screenshot);

  w.saverOpts = saverOpts;
  w.screenshot = screenshot;
  w.loadURL(target);

  w.on("closed", () => {
    w = null;
    dock.hideDockIfInactive(app);
  });
  
  dock.showDock(app);
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
    show: false,
    webPreferences: {
      nodeIntegration: false
    }
  };

  // osx will display window immediately if fullscreen is true
  // so we default it to false there
  if (process.platform !== "darwin" ) {
    opts.fullscreen = true;
  }

  if ( testMode === true ) {
    opts.fullscreen = false;
    opts.width = 100;
    opts.height = 100;
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
  var reqs;


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
    w.isSaver = true;
   
    diff = process.hrtime(tickCount);
    log.info("got screenshot back, let's do this", s.id, diff[0] * 1e9 + diff[1]);
    
    try {   
      // Emitted when the window is closed.
      w.on("closed", function() {
        windows.forceWindowClose(w);
      });
      
      // inject our custom JS and CSS into the screensaver window
      w.webContents.on("did-finish-load", function() {
        log.info("did-finish-load", s.id);
        if (!w.isDestroyed()) {
          w.webContents.insertCSS(globalCSSCode);
        }
      });

      // we could do something nice with either of these events
      w.webContents.on("crashed", log.info);
      w.webContents.on("unresponsive", log.info);

      
      w.once("ready-to-show", () => {
        log.info("ready-to-show", s.id);
        if ( debugMode !== true && testMode !== true ) {
          windows.setFullScreen(w);
        }

        diff = process.hrtime(tickCount);
        log.info(`rendered in ${diff[0] * 1e9 + diff[1]} nanoseconds`);
      });
      
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
      windows.forceWindowClose(w);
    }
  };

  //
  // if this screensaver uses a screengrab, get it. 
  // otherwise just boot it
  //
  reqs = saver.getRequirements();
  if ( reqs.findIndex((x) => { return x === "screen"; }) > -1 ) {
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
  w.isSaver = true;

  windows.setFullScreen(w);

  log.info("blankScreen", s.id, windowOpts);

  w.show();
};


/**
 * get a list of displays connected to the computer.
 */
var getDisplays = function() {
  var displays = [];
  if ( debugMode === true || prefs.runOnSingleDisplay === true ) {
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
  var primary = electronScreen.getPrimaryDisplay();
  return electronScreen.getAllDisplays().filter((d) => {
    return d.id !== primary.id;
  });
};

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

  var savers = new SaverListManager({
    prefs: prefs
  });

  var settings;
  var saverKey = prefs.current;
  let setupPromise;

  log.info("runScreenSaver");

  // check if the user is running the random screensaver. if so, pick one!
  let randomPath = path.join(global.basePath, "system-savers", "random", "saver.json");
  if ( saverKey === randomPath ) {
    setupPromise = new Promise((resolve) => {
      savers.list(() => {
        let s = savers.random();
        resolve(s.key);
      });
    });
  }
  else {
    setupPromise = Promise.resolve(saverKey);
  }

  setupPromise.then((k) => {
    saverKey = k;
    settings = prefs.getOptions(saverKey);    

    savers.loadFromFile(saverKey, settings).then((saver) => {
      // make sure we have something to display
      if ( typeof(saver) === "undefined" ) {
        log.info("No screensaver defined!");
        return;
      }
      
      // limit to a single screen when debugging
      if ( debugMode === true ) {
        dock.showDock(app);
      }
      
      try {
        var i;
        // turn off idle checks for a couple seconds while loading savers
        stateManager.ignoreReset(true);

        for ( i in displays ) {
          runScreenSaverOnDisplay(saver, displays[i]);
        } // for

        // if we're only running on primary display, blank out the other ones
        if ( debugMode !== true && testMode !== true && prefs.runOnSingleDisplay === true ) {
          var otherDisplays = getNonPrimaryDisplays();
          for ( i in otherDisplays ) {
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
    });
  });
};



/**
 * should we lock the user's screen when returning from running the saver?
 */
var shouldLockScreen = function() {
  return ( prefs.lock === true );
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
    screenLock.doLockScreen();
  }

  windows.closeRunningScreensavers();
};


/**
 * determine what our system directory is. this should basically be
 * where the app exists, and where the system-savers directory and
 * other critical files exist.
 */
var getSystemDir = function() {
  if ( process.env.BEFORE_DAWN_SYSTEM_DIR !== undefined ) {
    return process.env.BEFORE_DAWN_SYSTEM_DIR;
  }
  
  if ( global.IS_DEV ) {
    return __dirname;
  }

  return path.join(app.getAppPath(), "output");
};

/**
 * return the URL prefix we should use when loading app windows. if
 * running in development mode with hot reload enabled, we'll use an
 * HTTP request, otherwise we'll use a file:// url.
 */
var getUrl = function(dest) {
  let baseUrl;
  if ( !testMode && process.env.NODE_ENV === "development" ) {
    if ( ! process.env.DISABLE_RELOAD ) {
      baseUrl = "http://localhost:9080";
    }
    else {
      baseUrl = "file://" + __dirname + "/../../output";
    }
  }
  else {
    baseUrl = "file://" + __dirname + "/";
  }

  return url.resolve(baseUrl, dest);
};

var setupForTesting = function() {
  if ( testMode === true ) {
    log.info("opening shim for test mode");
    openTestShim();
  }    
};

var setupMenuAndTray = function() {
  var icons = menusAndTrays.getIcons();
  var menu = Menu.buildFromTemplate(menusAndTrays.buildMenuTemplate(app));

  Menu.setApplicationMenu(menu);

  //
  // build the tray menu
  //
  trayMenu = Menu.buildFromTemplate(menusAndTrays.trayMenuTemplate());

  trayMenu.items[3].visible = global.NEW_RELEASE_AVAILABLE;

  appIcon = new Tray(icons.active);
  appIcon.setToolTip(global.APP_NAME);
  appIcon.setContextMenu(trayMenu); 
  
  // show tray menu on right click
  // @todo should this be osx only?
  appIcon.on("right-click", () => {
    appIcon.popUpContextMenu();
  });
};


var setupIfNeeded = function() {
  log.info("setupIfNeeded");

  return new Promise((resolve) => {
    if ( process.env.QUIET_MODE && process.env.QUIET_MODE === "true" ) {
      log.info("Quiet mode, skip setup checks!");
      return resolve({setup: false});
    }

    // check if we should download savers, set something up, etc
    if ( process.env.FORCE_SETUP || prefs.needSetup ) {
      log.info("needSetup!");
      prefs.setDefaultRepo(global.SAVER_REPO);
      prefs.ensureDefaults();
      prefs.writeSync();

      let pd = new PackageDownloader(prefs);
      if ( global.LOCAL_PACKAGE ) {
        pd.setLocalFile(global.LOCAL_PACKAGE);
      }

      return pd.updatePackage().then(() => resolve({ setup: true }));
    }

    var savers = new SaverListManager({
      prefs: prefs
    });

    log.info("checking if " + prefs.current + " is valid");
    savers.confirmExists(prefs.current).then((exists) => {
      let results = { setup: !exists };
      if ( ! exists ) {
        log.info("need to pick a new screensaver");
      }
      else {
        log.info("looks like we are good to go");
      }
      return resolve(results);

    });
  });
};

var openPrefsWindowIfNeeded = function(status) {
  log.info("openPrefsWindowIfNeeded");
  if ( status.setup === true ) {
    return openPrefsWindow();
  }

  return Promise.resolve();
};

var setupReleaseCheck = function() {
  if ( global.CHECK_FOR_RELEASE !== true ) {
    return;
  }

  releaseChecker = new ReleaseCheck();

  releaseChecker.setFeed(global.RELEASE_CHECK_URL);
  releaseChecker.setLogger(log.info);
  releaseChecker.onUpdate(() => {
    global.NEW_RELEASE_AVAILABLE = true;
    trayMenu.items[3].visible = global.NEW_RELEASE_AVAILABLE;
  });
  releaseChecker.onNoUpdate(() => {
    global.NEW_RELEASE_AVAILABLE = false;
    trayMenu.items[3].visible = global.NEW_RELEASE_AVAILABLE;
  });

  log.info("Run initial release check");
  checkForNewRelease();

  // check for a new release every 12 hours
  log.info("Setup release check");
  setInterval(checkForNewRelease, RELEASE_CHECK_INTERVAL);
};

var checkForPackageUpdates = function() {  
  log.info("checkForPackageUpdates");
  let pd = new PackageDownloader(prefs);
  return pd.updatePackage().then(log.info); 
};

var setupPackageCheck = function() {
  if ( global.CHECK_FOR_RELEASE === true ) {
    return;
  }

  log.info("Setup package check");
  setInterval(() => checkForPackageUpdates, RELEASE_CHECK_INTERVAL);
};

/**
 * Check if we should move the app to the actual application folder.
 * This is important because the app is pretty fragile on OSX otherwise.
 */
var askAboutApplicationsFolder = function() {
  if ( testMode === true || global.IS_DEV === true || app.isInApplicationsFolder === undefined ) {
    return;
  }

  if ( !app.isInApplicationsFolder() ) {
    const chosen = dialog.showMessageBox({
      type: "question",
      buttons: ["Move to Applications", "Do Not Move"],
      message: "Move to Applications folder?",
      detail: "Hello! I work better in your Applications folder, should I move myself there?"
    });

    if ( chosen === 0 ) {
      app.moveToApplicationsFolder();
    }
  }
};

/**
 * handle initial startup of app
 */
var bootApp = function() {
  askAboutApplicationsFolder();

  global.NEW_RELEASE_AVAILABLE = false;

  log.info("Loading prefs");
  prefs = new SaverPrefs(global.basePath);

  // these are some variables we'll pass to windows so they
  // can bootstrap access to data/etc
  saverOpts = {
    base: global.basePath,
    systemDir: getSystemDir(),
    logger: log.info
  };

  //
  // setup some event handlers for when screen count changes, mostly
  // to ensure that we wake up if the user plugs in or removes a
  // monitor
  //
  electronScreen = electron.screen;
  electronScreen.on("display-added", windows.handleDisplayChange);
  electronScreen.on("display-removed", windows.handleDisplayChange);
  electronScreen.on("display-metrics-changed", windows.handleDisplayChange);    

  electron.powerMonitor.on("suspend", () => {
    log.info("The system is going to sleep, stop screensavers");
    windows.closeRunningScreensavers();
  });
  electron.powerMonitor.on("resume", () => {
    log.info("The system just woke up, stop screensavers");
    windows.closeRunningScreensavers();
  });



  stateManager = new StateManager();
  stateManager.idleFn = idler.getIdleTime;

  updateStateManager();
  stateManager.startTicking();
  
  setupMenuAndTray();
  
  openGrabberWindow().
    then(() => setupIfNeeded()).
    then((result) => openPrefsWindowIfNeeded(result)).
    then(() => setupForTesting()).
    then(() => {
      setupReleaseCheck();
      setupPackageCheck();    

      // don't show app in dock
      dock.hideDockIfInactive(app);
    });
};

var quitApp = () => {
  exitOnQuit = true;
  app.quit(); 
};

/**
 * try and guess if we are in fullscreen mode or not
 */
var inFullscreen = require("detect-fullscreen").isFullscreen;

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

  if ( windows.screenSaverIsRunning() ) {
    log.info("looks like we're already running");
    return;
  }
  
  // check if we are on battery, and if we should be running in that case
  if ( checkPowerState && prefs.disableOnBattery ) {
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
  if ( windows.screenSaverIsRunning() ) {
    log.info("running, close windows");
    stopScreenSaver(true);
    screenLock.doSleep();
  }
};

/**
 * update the state manager with our
 * timeout values, etc
 */
var updateStateManager = function() {
  log.info("updateStateManager",
           "idleTime: " + prefs.delay,
           "blankTime: " + (prefs.delay + prefs.sleep)
  );

  stateManager.setup({
    idleTime: prefs.delay * 60000,
    blankTime: (prefs.delay + prefs.sleep) * 60000,
    onIdleTime: runScreenSaverIfPowered,
    onBlankTime: blankScreenIfNeeded,
    onReset: windows.closeRunningScreensavers
  });
};


/**
 * check for a new release of the app
 */

var checkForNewRelease = function() {
  log.info("checkForNewRelease");
  releaseChecker.checkLatestRelease();
};

let getStateManager = function() {
  return stateManager;
};
let getAppIcon = function() {
  return appIcon;
};

// load a few global variables
require("./bootstrap.js");

log.transports.file.level = "debug";
log.transports.file.maxSize = 1 * 1024 * 1024;

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
log.info("use base path", global.basePath);

/**
 * make sure we're only running a single instance
 */

if ( testMode !== true ) {
  app.on("second-instance", () => {
    if ( prefsWindowHandle === null ) {
      openPrefsWindow();
    }
    else {
      if ( prefsWindowHandle.isMinimized() ) {
        prefsWindowHandle.restore();
      }
      prefsWindowHandle.focus();
    }
  });
}


//
// if the user has updated one of their screensavers, we can let
// the prefs window know that it needs to reload
//

let toggleSaversUpdated = (arg) => {
  prefs.reload();  
  if ( prefsWindowHandle !== null ) {
    prefsWindowHandle.send("savers-updated", arg);
  }
};

ipcMain.on("savers-updated", () => {
  toggleSaversUpdated();
});


//
// user has updated their preferences, let's reload
//
ipcMain.on("prefs-updated", (event, arg) => {
  log.info("prefs-updated", Object.keys(arg));
  prefs.reload();
  updateStateManager();
  checkForPackageUpdates();
});

ipcMain.on("close-window", (event) => {
  log.info("close-window");
  event.sender.getOwnerBrowserWindow().close();
});

//
// handle request to open the prefs window
//
ipcMain.on("open-prefs", () => {
  log.info("open-prefs");
  openPrefsWindow();
});

ipcMain.on("open-about", () => {
  log.info("open-about");
  openAboutWindow();
});

//
// handle request to open 'add new saver' window
//
ipcMain.on("open-add-screensaver", (event, screenshot) => {
  log.info("open-add-screensaver");
  addNewSaver(screenshot);
});

ipcMain.on("open-editor", (event, args) => {
  openEditor(args);
});

ipcMain.on("set-autostart", (event, value) => {
  log.info("set-autostart");
  autostarter.toggle(global.APP_NAME, value);
});

// seems like we need to catch this event to keep OSX from exiting app after screensaver runs?
app.on("window-all-closed", function() {
  log.info("window-all-closed");
});
app.on("before-quit", function() {
  log.info("before-quit");
});
app.on("will-quit", function(e) {
  log.info("will-quit");
  if ( testMode !== true && global.IS_DEV !== true && exitOnQuit !== true ) {
    log.info(`don't quit yet! testMode: ${testMode} IS_DEV ${global.IS_DEV} exitOnQuit ${exitOnQuit}`);
    e.preventDefault();
  }
});
app.on("quit", function() {
  log.info("quit");
});


process.on("uncaughtException", function (ex) {
  log.info(ex);
  log.info(ex.stack);
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.once("ready", bootApp);

if ( testMode === true ) {
  exports.getTrayMenuItems = function() {
    return menusAndTrays.trayMenuTemplate();
  };  
}

exports.log = log;
exports.setStateToRunning = setStateToRunning;
exports.getStateManager = getStateManager;
exports.getAppIcon = getAppIcon;
exports.trayMenu = trayMenu;
exports.openPrefsWindow = openPrefsWindow;
exports.openAboutWindow = openAboutWindow;
exports.addNewSaver = addNewSaver;
exports.openEditor = openEditor;
exports.getSystemDir = getSystemDir;
exports.toggleSaversUpdated = toggleSaversUpdated;
exports.quitApp = quitApp;
