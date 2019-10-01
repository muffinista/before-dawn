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

const {app, dialog, globalShortcut, BrowserWindow, BrowserView, ipcMain, Menu, Tray} = require("electron");

const fs = require("fs");
const path = require("path");
const url = require("url");
const { promisify } = require("util");

const screenLock = require("./screen.js");
const power = require("./power.js");

const idler = require("desktop-idle");

const StateManager = require("./state_manager.js");
const SaverPrefs = require("../lib/prefs.js");
const SaverListManager = require("../lib/saver-list.js");
const Package = require("../lib/package.js");
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

const PREVIEW_PADDING = 1.15;


/**
 * track some information about windows, previews, bounds for the prefs window
 * and editor window
 */
let handles = {
  prefs: {
    window: null,
    preview: null,
    bounds: {
      width: 320,
      height: 0
    },
    max: {
      width: 320,
      height: 320
    }
  },
  settings: {
    window: null
  },
  editor: {
    window: null,
    preview: null,
    bounds: {
      width: 320,
      height: 0
    },
    max: {
      width: 320,
      height: 320
    }
  }
};

var trayMenu;

var electronScreen;

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


const GRABBER_WINDOW_OPTS = {
  show:false,
  width:100,
  height:100,
  x: 6000,
  y: 2000,
  webPreferences: {
    nodeIntegration: true,
    webSecurity: false, //!global.IS_DEV
    preload: global.TRACK_ERRORS ? path.join(__dirname, "assets", "sentry.js") : undefined
  }
};


/**
 * Open the screengrab window
 * 
 * @returns {Promise} Promise that resolves once window is loaded
 */
var openGrabberWindow = function() {
  return new Promise((resolve) => {
    const grabberUrl = "file://" + __dirname + "/assets/grabber.html";

    var grabberWindow = new BrowserWindow(GRABBER_WINDOW_OPTS);
    grabberWindow.noTray = true;
    
    grabberWindow.once("ready-to-show", () => {
      // grabberWindow.webContents.openDevTools();
      resolve(grabberWindow);
    });

    grabberWindow.loadURL(grabberUrl); 
  });
};

/**
 * open our screen grabber tool and issue a screengrab request
 * @param {Screen} s the screen to grab
 * @returns {Promise} Promise that resolves with object containing URL of screenshot
 */
var grabScreen = function(s) {
  return new Promise((resolve) => {
    // bypass screen capture in test mode
    // this is a hack and if i can find a better
    // way to do it (listening for the prefs window, etc),
    // i'll do that instead
    if ( testMode === true ) {
      resolve({
        url: "file://" + __dirname + "/../test/fixtures/screenshot.png"
      });
    }
    else {
      let windowRef;
      ipcMain.once(`screenshot-${s.id}`, function(_e, message) {
        log.info("got screenshot!", message);

        // close the screen grabber window
        try {
          windowRef.close();
        }
        catch(ex) {
          if ( typeof(Sentry) !== "undefined" ) {
            // eslint-disable-next-line no-undef
            Sentry.captureException(ex);
          }
        }

        resolve(message);
      });

      openGrabberWindow().then((w) => {
        windowRef = w;
        windowRef.webContents.send("request-screenshot", { 
          id: s.id, 
          width: s.bounds.width, 
          height: s.bounds.height});  
      });
    }
  });
};


/**
 * open a simple window that our mocha/spectron tests can use.
 *
 * this exists mostly because it's basically impossible to test
 * an app that doesn't open a window.
 */
var openTestShim = function() {
  var testWindow = new BrowserWindow({
    width: 200,
    height: 400,
    webPreferences: {
      nodeIntegration: true
    }
  });

  var shimUrl = "file://" + __dirname + "/shim.html";
  testWindow.loadURL(shimUrl);
};


/**
 * Open the preferences window
 * @returns {Promise} Promise that resolves when prefs window is shown
 */
var openPrefsWindow = function() {
  if ( handles.prefs.window !== null && handles.prefs.window !== undefined ) {
    return new Promise((resolve) => {
      handles.prefs.window.show();
      resolve();
    });
  }

  return new Promise((resolve) => {
    var primary = electronScreen.getPrimaryDisplay();

    // take a screenshot of the main screen for use in previews
    grabScreen(primary).then((message) => {
      var prefsUrl = getUrl("prefs.html");

      handles.prefs.window = new BrowserWindow({
        show: false,
        width: 910,
        height: 700,
        minWidth: 800,
        maxWidth: 910,
        minHeight: 600,
        resizable: true,
        webPreferences: {
          webSecurity: false, //!global.IS_DEV
          nodeIntegration: true,
          preload: global.TRACK_ERRORS ? path.join(__dirname, "assets", "sentry.js") : undefined
        },
        icon: path.join(__dirname, "assets", "iconTemplate.png")
      });

      if ( handles.prefs.window.removeMenu !== undefined ) {
        handles.prefs.window.removeMenu();
      }

      prefsUrl = prefsUrl + "?screenshot=" + encodeURIComponent("file://" + message.url);
      handles.prefs.window.saverOpts = saverOpts;
      handles.prefs.window.screenshot = message.url;
        
      handles.prefs.window.on("closed", () => {
        handles.prefs.window = null;

        if ( handles.prefs.preview ) {
          handles.prefs.preview.destroy();
          handles.prefs.preview = null;  
        }
        dock.hideDockIfInactive(app);
      });

      handles.prefs.window.once("ready-to-show", () => {
        handles.prefs.window.show();
        dock.showDock(app);
      });
  
      handles.prefs.window.once("show", resolve);
  
      log.info("loading " + prefsUrl);
      handles.prefs.window.loadURL(prefsUrl);
    });
  });
};

var openSettingsWindow = function() {
  if ( handles.settings.window !== null && handles.settings.window !== undefined ) {
    return new Promise((resolve) => {
      handles.settings.window.show();
      resolve();
    });
  }

  var settingsUrl = getUrl("settings.html");
  handles.settings.window = new BrowserWindow({
    show: false,
    width:600,
    height:600,
    maxWidth: 600,
    minWidth: 600,
    resizable: true,
    parent: handles.prefs.window,
    modal: true,
    icon: path.join(__dirname, "assets", "iconTemplate.png"),
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false, //!global.IS_DEV
      preload: global.TRACK_ERRORS ? path.join(__dirname, "assets", "sentry.js") : undefined
    }
  });

  // hide the file menu
  if ( handles.settings.window.removeMenu !== undefined ) {
    handles.settings.window.removeMenu();
  }

  handles.settings.window.on("closed", () => {
    handles.settings.window = null;
    dock.hideDockIfInactive(app);
  });

  handles.settings.window.once("ready-to-show", () => {
    handles.settings.window.show();
    dock.showDock(app);
  });

  handles.settings.window.saverOpts = saverOpts;

  log.info(`open ${settingsUrl}`);
  handles.settings.window.loadURL(settingsUrl);
};

/**
 * handle new screensaver event. open the window to create a screensaver
 */
var addNewSaver = function() {
  var newUrl = getUrl("new.html");
  var primary = electronScreen.getPrimaryDisplay();

  // take a screenshot of the main screen for use in previews
  grabScreen(primary).then((message) => {
    newUrl = newUrl + "?screenshot=" + encodeURIComponent("file://" + message.url);

    var w = new BrowserWindow({
      show: false,
      width: 450,
      height: 700,
      resizable:true,
      webPreferences: {
        webSecurity: false, //!global.IS_DEV
        nodeIntegration: true,
        preload: global.TRACK_ERRORS ? path.join(__dirname, "assets", "sentry.js") : undefined
      },
      icon: path.join(__dirname, "assets", "iconTemplate.png")
    });

    w.saverOpts = saverOpts;
    w.screenshot = message.url;

    w.on("closed", () => {
      w = null;
      dock.hideDockIfInactive(app);
    });

    w.once("ready-to-show", () => {
      w.show();
      dock.showDock(app);
    });

    w.loadURL(newUrl);
  });
};

/**
 * Open the About window for the app
 */
var openAboutWindow = function() {
  var aboutUrl = getUrl("about.html");
  var w = new BrowserWindow({
    show: false,
    width:500,
    height:600,
    resizable:false,
    icon: path.join(__dirname, "assets", "iconTemplate.png"),
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false, //!global.IS_DEV
      preload: global.TRACK_ERRORS ? path.join(__dirname, "assets", "sentry.js") : undefined
    }
  });

  if ( w.removeMenu !== undefined ) {
    w.removeMenu();
  }

  w.on("closed", () => {
    w = null;
    dock.hideDockIfInactive(app);
  });

  w.once("ready-to-show", () => {
    w.show();
    dock.showDock(app);
  });

  log.info(`open ${aboutUrl}`);
  w.loadURL(aboutUrl);
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

  var editorUrl = getUrl("editor.html");
 
  var target = editorUrl + "?" +
               "src=" + encodeURIComponent(key) +
               "&screenshot=" + encodeURIComponent(screenshot);

  if ( handles.editor.window == null ) {
    handles.editor.window = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: true,
        webSecurity: false, //!global.IS_DEV
        preload: global.TRACK_ERRORS ? path.join(__dirname, "assets", "sentry.js") : undefined
      },
    });  
  }

  handles.editor.window.saverOpts = saverOpts;
  handles.editor.window.screenshot = screenshot;

  handles.editor.window.once("ready-to-show", () => {
    handles.editor.window.show();
    dock.showDock(app);
  });

  handles.editor.window.on("closed", () => {
    handles.editor.window = null;
    if ( handles.editor.preview ) {
      handles.editor.preview.destroy();
    }
    handles.editor.preview = null;

    dock.hideDockIfInactive(app);
  });

  handles.editor.window.loadURL(target);  
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
 * 
 * @param {String} screenshot URL of screenshot
 * @param {Saver} saver the screensaver to run
 * @param {Screen} s the screen to run it on
 * @param {Object} url_opts any options to pass on the url
 * @param {number} tickCount hrtime value of when we started
 */
var runSaver = function(screenshot, saver, s, url_opts, tickCount) {
  const windowOpts = getWindowOpts(s);
  var w = new BrowserWindow(windowOpts);       
  w.isSaver = true;
 
  let diff = process.hrtime(tickCount);
  log.info("let's do this", s.id, diff[0] * 1e9 + diff[1]);


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
    
    if ( typeof(screenshot) !== "undefined" ) {
      url_opts.screenshot = encodeURIComponent("file://" + screenshot);
    }

    let url = saver.getUrl(url_opts);

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
  
  log.info("runScreenSaverOnDisplay", s.id);

  // don't do anything if we don't actually have a screensaver
  if ( typeof(saver) === "undefined" || saver === null ) {
    log.info("no saver, exiting");
    return;
  }

  let tickCount = process.hrtime();

  //
  // if this screensaver uses a screengrab, get it. 
  // otherwise just boot it
  //
  const reqs = saver.getRequirements();
  if ( reqs.findIndex((x) => { return x === "screen"; }) > -1 ) {
    grabScreen(s).then((message) => {
      runSaver(message.url, saver, s, url_opts, tickCount);
    });
  }
  else {
    runSaver(undefined, saver, s, url_opts, tickCount);
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
    displays = getAllDisplays();
  }

  return displays;
};

/**
 * get a list of all displays
 */
var getAllDisplays = function() {
  return electronScreen.getAllDisplays();
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
  let savers = new SaverListManager({
    prefs: prefs
  });

  let setupPromise;

  log.info("runScreenSaver");

  let workingPath = getSystemDir();
  // check if the user is running the random screensaver. if so, pick one!
  let randomPath = path.join(workingPath, "system-savers", "random", "saver.json");
  log.info("random: " + randomPath);
  if ( prefs.current === randomPath ) {
    setupPromise = new Promise((resolve) => {
      savers.list(() => {
        // @todo s can be undefined
        // https://sentry.io/organizations/colin-mitchell/issues/955633850/?project=172824&query=is%3Aunresolved&statsPeriod=14d&utc=false
        let s = savers.random();
        resolve(s.key, prefs.getOptions(s.key));
      });
    });
  }
  else {
    setupPromise = Promise.resolve(prefs.current, prefs.getOptions(prefs.current));
  }

  setupPromise.
    then((saverKey, settings) => savers.loadFromFile(saverKey, settings)).
    catch((err) => {
      log.info("================ loading saver failed?");
      log.info(err);
      return undefined;
    }).
    then((saver) => {
      var displays = [];
      var blanks = [];
        
      // make sure we have something to display
      if ( typeof(saver) === "undefined" ) {
        log.info("No screensaver defined!");
        blanks = getAllDisplays();
      }
      else {
        displays = getDisplays();
        if ( debugMode !== true && testMode !== true && prefs.runOnSingleDisplay === true ) {
          blanks = getNonPrimaryDisplays();
        }
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
        for ( i in blanks ) {
          blankScreen(blanks[i]);
        }
      }
      catch (e) {
        log.info("running screensaver failed");
        log.info(e);
        stateManager.ignoreReset(false);
      }
      finally {
        setTimeout(function() {
          stateManager.ignoreReset(false);
        }, 2500);
      }
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
    return path.join(__dirname, "..", "..", "output");
  }
  else if ( process.env.TEST_MODE) {
    return __dirname;
  }

  return path.join(app.getAppPath(), "output");
};


var getAssetDir = function() {
  if ( process.env.TEST_MODE) {
    return path.join(__dirname, "data");
  }
  if ( global.IS_DEV ) {
    return path.join(__dirname, "..", "..", "data");
  }
  return path.join(app.getAppPath(), "data");
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
      return url.resolve(baseUrl, dest);
    }
    
    return `${__dirname}/../../output/${dest}`;
  }
  else {
    return `file://${__dirname}/${dest}`;
  }

};

var setupForTesting = function() {
  if ( testMode === true ) {
    log.info("opening shim for test mode");
    openTestShim();
  }    
};

/**
 * build and apply an application menu and tray menu
 */
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

/**
 * setup any requirements for the app
 * 
 * @returns {Promise} Promise that resolves with true if setup for first time, false if app was ready
 */
var setupIfNeeded = async function() {
  log.info("setupIfNeeded");

  let localPackageCheck = await handleLocalPackage();
  if ( localPackageCheck.downloaded ) {
    log.info(`set update to ${new Date(localPackageCheck.published_at)}`);
    prefs.sourceUpdatedAt = new Date(localPackageCheck.published_at);
  }

  if ( process.env.QUIET_MODE === "true" ) {
    log.info("Quiet mode, skip setup checks!");
    return false;
  }

  // check if we should download savers, set something up, etc
  if ( localPackageCheck.downloaded || process.env.FORCE_SETUP || prefs.needSetup ) {
    log.info("needSetup!");
    prefs.setDefaultRepo(global.SAVER_REPO);
    prefs.ensureDefaults();
    prefs.writeSync();

    if ( ! localPackageCheck.downloaded ) {
      log.info("check for updated download");
      let pd = new PackageDownloader(prefs);
      await pd.updatePackage();
    }

    // stop processing here, we know we need to setup
    return true;
  }

  var savers = new SaverListManager({
    prefs: prefs
  });

  log.info(`checking if ${prefs.current} is valid`);
  let exists = await savers.confirmExists(prefs.current);

  let results = !exists;
  if ( ! exists ) {
    log.info("need to pick a new screensaver");
  }
  else {
    log.info("looks like we are good to go");
  }

  return results;
};

/**
 * open the preferences window if needed
 * 
 * @param {Boolean} status true if we need to open the prefs window
 */
var openPrefsWindowIfNeeded = function(status) {
  log.info("openPrefsWindowIfNeeded");
  if ( status === true ) {
    log.info("we do need to open prefs window");
    return openPrefsWindow();
  }

  return Promise.resolve();
};

/**
 * setup our periodic release check
 */
var setupReleaseCheck = function() {
  if ( global.CHECK_FOR_RELEASE !== true ) {
    return;
  }

  releaseChecker = new ReleaseCheck();

  releaseChecker.setFeed(global.RELEASE_CHECK_URL);
  releaseChecker.setLogger(log.info);
  releaseChecker.onUpdate(() => {
    global.NEW_RELEASE_AVAILABLE = true;
    log.info("update available, show it");

    getTrayMenu().items[3].visible = global.NEW_RELEASE_AVAILABLE;
  });
  releaseChecker.onNoUpdate(() => {
    global.NEW_RELEASE_AVAILABLE = false;

    log.info("no update available, hide it");
    getTrayMenu().items[3].visible = global.NEW_RELEASE_AVAILABLE;
  });

  log.info("Run initial release check");
  checkForNewRelease();

  // check for a new release every 12 hours
  log.info("Setup release check");
  setInterval(checkForNewRelease, RELEASE_CHECK_INTERVAL);
};

/**
 * check for screensaver package updates
 */
var checkForPackageUpdates = function() {  
  log.info("checkForPackageUpdates");
  let pd = new PackageDownloader(prefs);
  return pd.updatePackage().then((result) => {
    log.info(result);
    toggleSaversUpdated();
  }); 
};

/**
 * setup our recurring screensaver package check
 */
var setupPackageCheck = function() {
  if ( global.CHECK_FOR_RELEASE !== true ) {
    return;
  }

  log.info("run initial package check");
  checkForPackageUpdates().then(() => {
    log.info("Setup recurring package check");
    setInterval(() => checkForPackageUpdates, RELEASE_CHECK_INTERVAL);
  });
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
 * Before Dawn releases will come with a zipfile of screensavers
 */
var handleLocalPackage = async function() {
  log.info(`handleLocalPackage ${global.LOCAL_PACKAGE}`);
  if ( !global.LOCAL_PACKAGE || !global.LOCAL_PACKAGE_DATA) {
    return {downloaded: false};
  }

  let saverZip = path.join(getAssetDir(), global.LOCAL_PACKAGE);
  let saverData = path.join(getAssetDir(), global.LOCAL_PACKAGE_DATA);
  
  let resultsJSON = path.join(app.getPath("userData"), `${global.LOCAL_PACKAGE}.json`);

  if ( !fs.existsSync(resultsJSON) && fs.existsSync(saverZip) && fs.existsSync(saverData) ) {
    log.info(`load savers from ${saverZip}`);
    var attrs = {
      dest: path.join(app.getPath("userData"), "savers"),
      local_zip: saverZip
    };

    let p = new Package(attrs);
    await p.checkLatestRelease(true);

    let results = JSON.parse(fs.readFileSync(saverData));
    results.downloaded = true;

    const writeFileAsync = promisify(fs.writeFile);
    await writeFileAsync(resultsJSON, JSON.stringify(results));

    return results;
  }
  else {
    log.info(`don't load savers from ${saverZip}`);
    return {
      downloaded: false
    };
  }
};

/**
 * handle initial startup of app
 */
var bootApp = async function() {
  askAboutApplicationsFolder();

  global.NEW_RELEASE_AVAILABLE = false;

  // ensure proper data in about panel when available
  if ( app.setAboutPanelOptions ) {
    app.setAboutPanelOptions({
      applicationName: global.APP_NAME,
      applicationVersion: global.APP_VERSION,
      version: global.APP_VERSION_BASE,
      credits: global.APP_CREDITS
    });
  }

  // these are some variables we'll pass to windows so they
  // can bootstrap access to data/etc
  saverOpts = {
    base: global.basePath,
    systemDir: path.join(getSystemDir(), "system-savers"),
    logger: log.info
  };


  log.info("Loading prefs");
  log.info(`baseDir: ${saverOpts.base}`);
  log.info(`systemSource: ${saverOpts.systemDir}`);
  prefs = new SaverPrefs({
    baseDir: saverOpts.base,
    systemSource: saverOpts.systemDir
  });

  //
  // setup some event handlers for when screen count changes, mostly
  // to ensure that we wake up if the user plugs in or removes a
  // monitor
  //
  electronScreen = electron.screen;
  ["display-added", "display-removed", "display-metrics-changed"].forEach((type) => {
    electronScreen.on(type, windows.handleDisplayChange);
  });

  ["suspend", "resume", "lock-screen", "unlock-screen"].forEach((type) => {
    electron.powerMonitor.on(type, () => {
      log.info(`system ${type} event, stop screensavers`);
      windows.closeRunningScreensavers();
    }); 
  });

  stateManager = new StateManager();
  stateManager.idleFn = idler.getIdleTime;

  updateStateManager();

  let result = await setupIfNeeded();
  await openPrefsWindowIfNeeded(result);
  setupForTesting();

  setupMenuAndTray();
  setupReleaseCheck();
  setupPackageCheck();
  setupLaunchShortcut();

  screenLock.setLogger(log.info);
  screenLock.setDir(getSystemDir());

  // don't show app in dock
  dock.hideDockIfInactive(app);

  // start the idle check
  stateManager.startTicking();
};

/**
 * toggle our 'ok to quit' variable and quit
 */
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
  log.info(`updateStateManager idleTime: ${prefs.delay} blankTime: ${(prefs.delay + prefs.sleep)}`);

  stateManager.setup({
    idleTime: prefs.delay * 60,
    blankTime: (prefs.delay + prefs.sleep) * 60,
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

var setupLaunchShortcut = function() {
  globalShortcut.unregisterAll();
  if ( prefs.launchShortcut !== undefined && prefs.launchShortcut !== "" ) {
    log.info(`register launch shortcut: ${prefs.launchShortcut}`);
    const ret = globalShortcut.register(prefs.launchShortcut, () => {
      log.info("shortcut triggered!");
      if ( handles.prefs.window && handles.prefs.window.isFocused() ) {
        log.info("no shortcut when prefs active!");
        return;
      }

      try {
        // turn off idle checks for a couple seconds while loading savers
        stateManager.ignoreReset(true);
        setStateToRunning();
      }
      catch (e) {
        log.info(e);
        stateManager.ignoreReset(false);
      }
      finally {
        setTimeout(function() {
          stateManager.ignoreReset(false);
        }, 2500);
      }
    });

    if ( ! ret ) {
      log.info("shortcut registration failed");
    }

    log.info(`registered? ${globalShortcut.isRegistered(prefs.launchShortcut)}`);
  }
};


/**
 * return our state manager
 * @returns {StateManager}
 */
let getStateManager = function() {
  return stateManager;
};

/**
 * return the app icon
 * @returns {Tray}
 */
let getAppIcon = function() {
  return appIcon;
};

/**
 * return the tray menu
 * @returns {Menu}
 */
let getTrayMenu = function() {
  return trayMenu;
};


/**
 * if the user has updated one of their screensavers, we can let
 * the prefs window know that it needs to reload
 */
let toggleSaversUpdated = (arg) => {
  prefs.reload();  
  if ( handles.prefs.window !== null ) {
    handles.prefs.window.send("savers-updated", arg);
  }
};


/**
 * 
 * @param {String} name of the target window.
 * @param {Object} bounds hash with keys x, y, width, height
 */
let setBounds = function(target, bounds) {
  bounds.x = parseInt(bounds.x, 10);
  bounds.y = parseInt(bounds.y, 10);
  bounds.width = parseInt(bounds.width, 10);
  bounds.height = parseInt(bounds.height, 10);

  handles[target].max.width = bounds.width;
  handles[target].max.height = bounds.height;

  // if we have an aspect ratio, we assume the width is fixed, and
  // match the height to our expected proportions
  if ( handles[target].ratio ) {
    bounds.height = parseInt(bounds.width * handles[target].ratio, 10);

    // don't exceed our max dimensions
    if ( bounds.height > handles[target].max.height ) {
      bounds.height = handles[target].max.height;
      bounds.width = parseInt(bounds.width / handles[target].ratio, 10);
    }
  }

  handles[target].preview.setBounds(bounds);
};

/**
 * set the preview url for a window
 * 
 * @param {String} name of the target window.
 * @param {String} url to load in the preview
 */
let setPreviewUrl = function(target, url, force) {
  const viewHandle = handles[target].preview;
  if ( force === true || url !== viewHandle.webContents.getURL() ) {
    // log.info(`switch ${target} preview to ${url} ${force}`);

    viewHandle.webContents.once("did-stop-loading", function() {
      viewHandle.webContents.insertCSS(globalCSSCode);
    });
    viewHandle.webContents.loadURL(url);
  }
};

/**
 * setup a preview BrowserView
 * 
 * @param {String} name of the target window.
 */
let setupPreview = function(target, incomingBounds) {
  var primary = electronScreen.getPrimaryDisplay();
  var size = primary.bounds;
  let zf = incomingBounds.height / (size.height * PREVIEW_PADDING);

  if ( ! handles[target].preview ) {
    var ratio = size.height / size.width;
    handles[target].ratio = ratio;

    handles[target].preview = new BrowserView({
      webPreferences: {
        preload: path.join(__dirname, "assets", "preview.js"),
        zoomFactor: zf
      }
    });
    handles[target].window.setBrowserView(handles[target].preview);
    handles[target].preview.webContents.on("console-message",
      (event, level, message, line, sourceId) => {
        // log.info(level, message, line, sourceId);
        handles[target].window.webContents.send("console-message",
          event, level, message, line, sourceId);
      });
  }
};

// load a few global variables
require("./bootstrap.js");

log.transports.file.level = "debug";
log.transports.file.maxSize = 1 * 1024 * 1024;

log.info(`Hello from version: ${global.APP_VERSION_BASE} running in ${global.IS_DEV ? "development" : "production"}`);

if ( global.IS_DEV ) {
  app.setName(global.APP_NAME);
  app.name = global.APP_NAME;
  log.info(`set app name to ${app.getName()}`);

  if ( testMode !== true ) {
    let userDataPath = path.join(app.getPath("appData"), app.getName());
    log.info(`set userData path to ${userDataPath}`);
    app.setPath("userData", userDataPath);
  }
}

// store our root path as a global variable so we can access it from screens
if ( process.env.BEFORE_DAWN_DIR !== undefined ) {
  global.basePath = process.env.BEFORE_DAWN_DIR;
}
else {
  global.basePath = app.getPath("userData");
  // global.basePath = path.join(app.getPath("appData"), global.APP_DIR);
}
log.info("use base path", global.basePath);

/**
 * make sure we're only running a single instance
 */
if ( testMode !== true ) {
  app.on("second-instance", () => {
    if ( handles.prefs.window === null && handles.prefs.window !== undefined ) {
      openPrefsWindow();
    }
    else {
      if ( handles.prefs.window.isMinimized() ) {
        handles.prefs.window.restore();
      }
      handles.prefs.window.focus();
    }
  });
}

ipcMain.on("preview-error", (_event, message, source, lineno) => {
  let opts = {
    message: message,
    source: source,
    lineno: lineno
  };
  if ( handles.editor.window ) {
    handles.editor.window.webContents.send("preview-error", opts);
  }
  else if ( handles.prefs.window ) {
    handles.prefs.window.webContents.send("preview-error", opts);
  }
});

ipcMain.on("savers-updated", () => {
  toggleSaversUpdated();
});

ipcMain.on("open-settings", () => {
  openSettingsWindow();
});

let updatePreview = function(arg) {
  setupPreview(arg.target, arg.bounds);
  setPreviewUrl(arg.target, arg.url, arg.force);
  setBounds(arg.target, arg.bounds);
};

// event for switching preview url
ipcMain.on("preview-url", (_event, arg) => {
  updatePreview(arg);
});

// event for switching preview location and/or url
ipcMain.on("preview-bounds", (_event, arg) => {
  updatePreview(arg);
});

//
// user has updated their preferences, let's reload
//
ipcMain.on("prefs-updated", () => {
  log.info("prefs-updated");
  prefs.reload();
  updateStateManager();
  checkForPackageUpdates();
  handles.prefs.window.webContents.send("savers-updated");
});

//
// handle request to open the prefs window
//
ipcMain.on("open-prefs", () => {
  log.info("open-prefs");
  openPrefsWindow();
});
ipcMain.on("close-prefs", () => {
  log.info("close-prefs");
  if ( handles.prefs.window ) {
    handles.prefs.window.close();
  }
});
ipcMain.on("close-settings", () => {
  log.info("close-prefs");
  if ( handles.settings.window ) {
    handles.settings.window.close();
  }
});

ipcMain.on("open-about", () => {
  log.info("open-about");
  openAboutWindow();
});

//
// handle request to open 'add new saver' window
//
ipcMain.on("open-add-screensaver", (_event, screenshot) => {
  log.info("open-add-screensaver");
  addNewSaver(screenshot);
});

ipcMain.on("open-editor", (_event, args) => {
  openEditor(args);
});

ipcMain.on("set-autostart", (_event, value) => {
  log.info("set-autostart");
  autostarter.toggle(global.APP_NAME, value);
});

ipcMain.on("set-global-launch-shortcut", () => {
  log.info("set-global-launch-shortcut");
  setupLaunchShortcut();
});

ipcMain.on("quit-app", () => {
  log.info("quit-app");
  quitApp();
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
    log.info(`don't quit! testMode: ${testMode} IS_DEV ${global.IS_DEV} exitOnQuit ${exitOnQuit}`);
    e.preventDefault();
  }
  else {
    globalShortcut.unregisterAll();
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
exports.getTrayMenu = getTrayMenu;
exports.openPrefsWindow = openPrefsWindow;
exports.openAboutWindow = openAboutWindow;
exports.addNewSaver = addNewSaver;
exports.openEditor = openEditor;
exports.getSystemDir = getSystemDir;
exports.toggleSaversUpdated = toggleSaversUpdated;
exports.quitApp = quitApp;
