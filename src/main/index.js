"use strict";

process.traceDeprecation = true;
process.traceProcessWarnings = true;


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

const {app,
  globalShortcut,
  BrowserWindow,
  ipcMain,
  Menu,
  Tray,
  dialog,
  shell,
  systemPreferences} = require("electron");

const fs = require("fs");
const path = require("path");
const url = require("url");

const screenLock = require("./screen.js");

const StateManager = require("./state_manager.js");
const SaverPrefs = require("../lib/prefs.js");
const SaverFactory = require("../lib/saver-factory.js");
const Saver = require("../lib/saver.js");
const SaverListManager = require("../lib/saver-list.js");
const Package = require("../lib/package.js");
const Power = require("../lib/power.js");

var releaseChecker;

const menusAndTrays = require("./menus.js");
const dock = require("./dock.js");
const windows = require("./windows.js");

const Mutex = require("async-mutex").Mutex;
const withTimeout = require("async-mutex").withTimeout;

const mutex = withTimeout(new Mutex(), 30000, new Error("timeout"));

// NOTE -- this needs to be global, otherwise the app icon gets
// garbage collected and won't show up in the system tray
let appIcon = null;

let debugMode = ( process.env.DEBUG_MODE !== undefined );
let testMode = ( process.env.TEST_MODE !== undefined );

let cursor;

//
// don't hide cursor in tests or in windows, since
// that causes the tray to stop working???
//
if ( testMode || process.platform === "win32" ) {
  cursor = {
    hide: () => {},
    show: () => {}
  };
}
else {
  cursor = require("hide-cursor");
}

let cachedScreens = [];
let cachedPrimaryScreen = undefined;

let exitOnQuit = false;

// load some global CSS we'll inject into running screensavers
const globalCSSCode = fs.readFileSync( path.join(__dirname, "assets", "global.css"), "ascii");  

/**
 * track some information about windows and preview bounds for the prefs window
 * and editor window
 */
let handles = {
  prefs: {
    window: null,
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
  addNew: {
    window: null
  },
  editor: {
    window: null,
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

let trayMenu;

let electronScreen;

let prefs = undefined;
let savers = undefined;
let stateManager = undefined;
let saverOpts = {};

// usually we want to check power state before running, but
// we'll skip that check depending on the value of this toggle
// so that manually running screensaver works just fine
let checkPowerState = true;

const RELEASE_CHECK_INTERVAL = 1000 * 60 * 60 * 12;


const singleLock = app.requestSingleInstanceLock();
if (! singleLock ) {
  // eslint-disable-next-line no-console
  console.log("looks like another copy of app is running, exiting!");
  app.quit();
  process.exit();
}

try {
  const logDest = log.transports.file.getFile().path;
  console.log(`I am writing logs to ${logDest}`); 
}
catch(e) {
  console.log(e);
}


/**
 * Open the screengrab window
 * 
 * @returns {Promise} Promise that resolves once window is loaded
 */
var openGrabberWindow = function() {
  return new Promise((resolve) => {
    log.info("openGrabberWindow");
    const grabberUrl = `file://${__dirname}/assets/grabber.html`;

    var grabberWindow = new BrowserWindow({
      show: false,
      skipTaskbar: true,
      width: 100,
      height: 100,
      x: 6000,
      y: 2000,
      webPreferences: {
        nodeIntegration: true,
        enableRemoteModule: true,
        webSecurity: false
      }
    });
    grabberWindow.noTray = true;
    
    grabberWindow.once("ready-to-show", () => {
      log.info("grabber open");
      //grabberWindow.webContents.openDevTools();
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
  log.info(`grab screen ${s.id}`);
  return new Promise((resolve) => {
    //
    // bypass screen capture in test mode
    // or if the user has blocked screen access
    //
    if (
      (process.platform === "darwin" && systemPreferences.getMediaAccessStatus("screen") !== "granted" ) ||
      testMode === true ) {
      resolve({
        url: path.join(__dirname, "assets", "color-bars.png")
      });
    }
    else {
      let windowRef;
      ipcMain.once(`screenshot-${s.id}`, function(_e, message) {
        // log.info("got screenshot!", message);

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
        log.info("send request");
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
      webSecurity: false,
      nodeIntegration: true,
      enableRemoteModule: true
    }
  });

  const shimUrl = `file://${__dirname}/assets/shim.html`;
  testWindow.loadURL(shimUrl);
};


let screenshots = {};


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
    const primary = cachedPrimaryScreen;

    // take a screenshot of the main screen for use in previews
    grabScreen(primary).then((grab) => {
      screenshots[primary.id] = grab.url;

      const prefsUrl = getUrl("prefs.html");

      handles.prefs.window = new BrowserWindow({
        show: false,
        width: 910,
        height: 700,
        minWidth: 800,
        maxWidth: 910,
        minHeight: 600,
        resizable: true,
        webPreferences: {
          webSecurity: false,
          preload: path.join(__dirname, "assets", "preload.js"),
          nodeIntegration: true,
          enableRemoteModule: process.env.TEST_MODE === "true"
        },
        icon: path.join(__dirname, "assets", "iconTemplate.png")
      });

      if ( handles.prefs.window.removeMenu !== undefined ) {
        handles.prefs.window.removeMenu();
      }
      
      handles.prefs.window.on("closed", () => {
        handles.prefs.window = null;
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
      webSecurity: false,
      preload: path.join(__dirname, "assets", "preload.js"),
      nodeIntegration: true,
      enableRemoteModule: process.env.TEST_MODE === "true"
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

  log.info(`open ${settingsUrl}`);
  handles.settings.window.loadURL(settingsUrl);
};

/**
 * handle new screensaver event. open the window to create a screensaver
 */
var addNewSaver = function() {
  var newUrl = getUrl("new.html");
  var primary = cachedPrimaryScreen;

  // take a screenshot of the main screen for use in previews
  grabScreen(primary).then((grab) => {
    screenshots[primary.id] = grab.url;

    handles.addNew.window = new BrowserWindow({
      show: false,
      width: 450,
      height: 700,
      resizable:true,
      webPreferences: {
        webSecurity: false,
        preload: path.join(__dirname, "assets", "preload.js"),
        nodeIntegration: true,
        enableRemoteModule: process.env.TEST_MODE === "true"
      },
      icon: path.join(__dirname, "assets", "iconTemplate.png")
    });

    handles.addNew.window.on("closed", () => {
      handles.addNew.window = null;
      dock.hideDockIfInactive(app);
    });

    handles.addNew.window.once("ready-to-show", () => {
      handles.addNew.window.show();
      dock.showDock(app);
    });

    handles.addNew.window.loadURL(newUrl);
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
      preload: path.join(__dirname, "assets", "preload.js"),
      nodeIntegration: true,
      enableRemoteModule: process.env.TEST_MODE === "true"
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
               "src=" + encodeURIComponent(key);

  if ( handles.editor.window == null ) {
    handles.editor.window = new BrowserWindow({
      show: false,
      webPreferences: {
        webSecurity: false,
        preload: path.join(__dirname, "assets", "preload.js"),
        nodeIntegration: true,
        enableRemoteModule: process.env.TEST_MODE === "true"
      },
    });  
  }

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
    // autoHideMenuBar: true,
    // skipTaskbar: true,
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
    // opts.focusable = false;
    // opts.frame = false;
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
  

  if ( w.removeMenu !== undefined ) {
    w.removeMenu();
  }

  console.log(windowOpts);
  let diff = process.hrtime(tickCount);
  log.info("let's do this", s.id, diff[0] * 1e9 + diff[1]);


  return new Promise((resolve, reject) => {
    try {   
      // Emitted when the window is closed.
      w.on("closed", function() {
        if (process.platform !== "win32" ) {
          cursor.show();
        }
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
        if ( testMode !== true ) {
          windows.setFullScreen(w);
        }
        
        diff = process.hrtime(tickCount);
        log.info(`rendered in ${diff[0] * 1e9 + diff[1]} nanoseconds`);
        resolve(s.id);
      });
      
      if ( typeof(screenshot) !== "undefined" ) {
        url_opts.screenshot = encodeURIComponent("file://" + screenshot);
      }
      
      const urlParams = new URLSearchParams(url_opts);
      let url = `${saver.url}?${urlParams.toString()}`;
      
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
      reject(s.id, e);
    }
  });
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
    return Promise.resolve();
  }

  let tickCount = process.hrtime();

  //
  // if this screensaver uses a screengrab, get it. 
  // otherwise just boot it
  //
  const reqs = saver.requirements;
  if ( reqs !== undefined && reqs.findIndex((x) => { return x === "screen"; }) > -1 ) {
    return grabScreen(s).then((message) => {
      runSaver(message.url, saver, s, url_opts, tickCount);
    });
  }
  else {
    return runSaver(undefined, saver, s, url_opts, tickCount);
  }
};

/**
 * blank out the given screen
 */
var blankScreen = function(s) {
  return new Promise((resolve) => {
    if ( process.env.TEST_MODE ) {
      log.info("refusing to blank screen in test mode");
    }
    else {
      let windowOpts = getWindowOpts(s);
      let w = new BrowserWindow(windowOpts);     
      w.isSaver = true;
      
      windows.setFullScreen(w);
      
      log.info("blankScreen", s.id, windowOpts);
      
      w.show();  
    }
    
    resolve(s.id); 
  });
};



/**
 * grab a list of displays and cache it for later
 */
var loadDisplayData = function() {
  // log.info("loadDisplayData");
  cachedScreens = electronScreen.getAllDisplays();
  cachedPrimaryScreen = electronScreen.getPrimaryDisplay();
};

/**
 * get a list of displays connected to the computer.
 */
var getDisplays = function() {
  var displays = [];
  if ( debugMode === true || prefs.runOnSingleDisplay === true ) {
    displays = [
      cachedPrimaryScreen
    ];
  }
  else {
    displays = cachedScreens;
  }

  return displays;
};


/**
 * get a list of the non primary displays connected to the computer
 */
var getNonPrimaryDisplays = function() {
  var primary = cachedPrimaryScreen;
  return cachedScreens.filter((d) => {
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

var setStateToPaused = function() {
  stateManager.pause();
};
var resetState = function() {
  stateManager.reset();
};


/**
 * return a promise the resolves to the path to the screensaver and its options
 */
var findScreensaver = function() {
  const workingPath = getSystemDir();
  // check if the user is running the random screensaver. if so, pick one!
  const randomPath = path.join(workingPath, "system-savers", "random", "saver.json");
  log.info("random: " + randomPath);
  if ( prefs.saver === randomPath ) {
    return new Promise((resolve) => {
      savers.list(() => {
        // @todo s can be undefined
        // https://sentry.io/organizations/colin-mitchell/issues/955633850/?project=172824&query=is%3Aunresolved&statsPeriod=14d&utc=false
        let s = savers.random();
        resolve(s.key, prefs.getOptions(s.key));
      });
    });
  }

  return Promise.resolve(prefs.saver, prefs.getOptions(prefs.saver));
};

/**
 * run the user's chosen screensaver on any available screens
 */
var runScreenSaver = function() {
  log.info("runScreenSaver");
  const setupPromise = findScreensaver();

  setupPromise.
    then((saverKey, settings) => savers.loadFromFile(saverKey, settings)).
          catch((err) => {
            log.info("================ loading saver failed?");
            log.info(err.message);
            return undefined;
          }).
          then((saver) => {
            var displays = [];
            var blanks = [];
            
            // make sure we have something to display
            if ( typeof(saver) === "undefined" ) {
              log.info("No screensaver defined! Just blank everything");
              blanks = cachedScreens;
            }
            else {
              displays = getDisplays();
              if ( debugMode !== true && testMode !== true && prefs.runOnSingleDisplay === true ) {
                blanks = getNonPrimaryDisplays();
              }
            }

            // turn off idle checks for a couple seconds while loading savers
            stateManager.ignoreReset(true);

            cursor.hide();

            //
            // generate an array of promises for rendering screensavers on any screens
            //
            const promises = displays
              .map((d) => runScreenSaverOnDisplay(saver, d))
              .concat(
                blanks.map((d) => blankScreen(d))
              );


            Promise.all(promises).then(() => {
              log.info("our work is done, set state to running");
              stateManager.running(); 
            }).catch((e) => {
              log.info("running screensaver failed");
              log.info(e);

              stateManager.reset();
              cursor.show(); 
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
  cursor.show();
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

  if ( process.env.TEST_MODE ) {
    return path.join(__dirname, "..", "output");
  }
  if ( global.IS_DEV ) {
    return path.join(__dirname, "..", "..", "output");
  }

  return path.join(app.getAppPath(), "output");
};


/**
 * determine the path to any assets we need
 */
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

    if ( ! localPackageCheck.downloaded ) {
      log.info("check for updated download");
      const PackageDownloader = require("../lib/package-downloader.js");
      let pd = new PackageDownloader(prefs);
      await pd.updatePackage();
    }

    // stop processing here, we know we need to setup
    return true;
  }

  // log.info(`checking if ${prefs.saver} is valid`);
  const exists = await savers.confirmExists(prefs.saver);

  // let results = !exists;
  if ( ! exists ) {
    log.info("need to pick a new screensaver");
  }
  else {
    log.info("looks like we are good to go");
  }

  return !exists;
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
  if ( ! global.RELEASE_CHECK_URL ) {
    log.info("no release server set, so no release checks");
    return;
  }

  const ReleaseCheck = require("./release_check.js");
  
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
var checkForPackageUpdates = async function() {  
  log.info("checkForPackageUpdates");
  let result = {};

  const release = await mutex.acquire();
  try {
    const PackageDownloader = require("../lib/package-downloader.js");

    const pd = new PackageDownloader(prefs);
    result = await pd.updatePackage();
    
    log.info(result);
    toggleSaversUpdated();
  }
  finally {
    release();
  }
  return result;
};

/**
 * setup our recurring screensaver package check
 */
var setupPackageCheck = function() {
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
    const {dialog} = require("electron");

    const chosen = dialog.showMessageBoxSync({
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
 * check for permissions to access certain systems on OSX
 */
var askAboutMediaAccess = async function() {
  if (process.platform !== "darwin" || testMode === true ) {
    return;
  }

  ["microphone", "camera", "screen"].forEach(async (type) => {
    // note: this might be handy
    //     "mac-screen-capture-permissions": "^1.1.0",
    // if ( type === "screen" ) {
    //   const {
    //     hasScreenCapturePermission,
    //     hasPromptedForPermission 
    //   } = require('mac-screen-capture-permissions');
    //   const result = hasPromptedForPermission();
    //   const result2 = hasScreenCapturePermission();
    // }
    // https://www.electronjs.org/docs/api/system-preferences#systempreferencesaskformediaaccessmediatype-macos
    log.info(`access to ${type}: ${systemPreferences.getMediaAccessStatus(type)}`);

    // re: screen -- This permission can only be granted manually in the System
    // Preferences. Therefore systemPreferences.askForMediaAccess() cannot be
    // extended in the same way.

    if ( systemPreferences.getMediaAccessStatus(type) !== "granted" && type !== "screen" ) {
      await systemPreferences.askForMediaAccess(type);
    }
  });
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

    const { promisify } = require("util");

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
 * setup assorted IPC listeners
 */
let setupIPC = function() {
  /**
   * open the window specified by 'key', passing args along
   */
  ipcMain.on("open-window", (_event, key, args) => {
    windowMethods[key](args);
  });

  /**
   * set screensaver state to paused
   */
  ipcMain.on("pause", () => {
    setStateToPaused();
  });

  /**
   * set screensaver state to enabled
   */
  ipcMain.on("enable", () => {
    resetState();
  });
  
  /**
   * close the window specified by 'key'
   */
  ipcMain.on("close-window", (event, key) => {
    if ( handles[key].window ) {
      handles[key].window.close();
    }
  });

  /**
   * return prefs data to requester
   */
  ipcMain.handle("get-prefs", () => {
    log.info("get-prefs");
    return prefs.data;
  });

  /**
   * return a couple of global variables
   */
  ipcMain.handle("get-globals", () => {
    return {
      APP_VERSION: global.APP_VERSION,
      APP_REPO: global.APP_REPO,
      CONFIG_DEFAULTS: global.CONFIG_DEFAULTS,
      NEW_RELEASE_AVAILABLE: global.NEW_RELEASE_AVAILABLE
    };
  });

  /**
   * return a list of screensavers
   */
  ipcMain.handle("list-savers", async () => {
    // log.info("list-savers");
    const entries = await savers.list();
    return entries;
  });

  /**
   * load and return the specified screensaver
   */
  ipcMain.handle("load-saver", async (_event, key) => {
    // log.info("load-saver", key);
    return await savers.loadFromFile(key);
  });

  /**
   * delete the specified screensaver
   */
  ipcMain.handle("delete-saver", async(_event, attrs) => {
    log.info("delete-saver", attrs);
    await savers.delete(attrs);
    savers.reset();
    prefs.reload();
  });

  /**
   * update prefs with the incoming attrs
   */
  ipcMain.handle("update-prefs", async(_event, attrs) => {
    log.info("update-prefs", attrs);

    // ensure a value for this
    attrs.firstLoad = false;

    prefs.store.set(attrs);

    savers.reset();
    updateStateManager();
    checkForPackageUpdates();
  });


  /**
   * return the default settings for the app
   */
  ipcMain.handle("get-defaults", async() => {
    log.info("get-defaults");
    return prefs.defaults;
  });

  /**
   * update the local source settings
   */
  ipcMain.handle("update-local-source", async(_event, ls) => {
    log.info("update-local-source", ls);
    prefs.store.set("localSource", ls);

    savers.reset();
  });

  /**
   * create a new screensaver from our template
   */
  ipcMain.handle("create-screensaver", async(_event, attrs) => {
    const factory = new SaverFactory();
    
    let systemPath = getSystemDir();
    
    const src = path.join(systemPath, "system-savers", "__template");
    const dest = prefs.localSource;
    const data = factory.create(src, dest, attrs);
    
    savers.reset();

    return data;
  });

  /**
   * save/update a screensaver object
   */
  ipcMain.handle("save-screensaver", async(_event, attrs, dest) => {
    const s = new Saver(attrs);
    s.write(attrs, dest);
  });

  /**
   * return the bounds of the primary screen to the requester
   */
  ipcMain.handle("get-primary-display-bounds", () => {
    return cachedPrimaryScreen.bounds;
  });

  /**
   * return a screengrab of the primary screen to the requester
   */
  ipcMain.handle("get-primary-screenshot", () => {
    return screenshots[cachedPrimaryScreen.id];
  });

  /**
   * display information about an error happening in a preview in 
   * the editor window.
   * @todo i don't think this is working very well
   */
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
  
  /**
   * load the requested URL in a browser
   */
  ipcMain.on("launch-url", (_event, url) => {
    const { shell } = require("electron");
    shell.openExternal(url);
  });
  
  /**
   * handle savers-updated event. this is sent when a screensaver is created/updated
   */
  ipcMain.on("savers-updated", () => {
    log.info("savers-updated");
    toggleSaversUpdated();
  });

  /**
   * set autostart value
   */
  ipcMain.on("set-autostart", (_event, value) => {
    log.info("set-autostart");
    if ( process.env.TEST_MODE !== undefined ) {
      log.info("we're in test mode, skipping autostart");
      return;
    }
  
    const autostarter = require("./autostarter.js");
    autostarter.toggle(global.APP_NAME, value);
  });

  /**
   * handle event to set global launch shortcut
   */
  ipcMain.on("set-global-launch-shortcut", () => {
    log.info("set-global-launch-shortcut");
    setupLaunchShortcut();
  });

  /**
   * run the users specified screensaver
   */
  ipcMain.on("run-screensaver", () => {
    log.info("run-screensaver");
    setStateToRunning();
  });

  /**
   * display a dialog about a package update
   */
  ipcMain.on("display-update-dialog", async () => {
    const result = await dialog.showMessageBox({
      type: "info",
      title: "Update Available!",
      message: "There's a new update available! Would you like to download it?",
      buttons: ["No", "Yes"],
      defaultId: 0
    });
    
    if ( result.response === 1 ) {
      const appRepo = global.APP_REPO;
      shell.openExternal(`https://github.com/${appRepo}/releases/latest`);
    }
  });

  /**
   * display a dialog when the user wants to reset to default settings
   */
  ipcMain.handle("reset-to-defaults-dialog", async () => {
    const result = await dialog.showMessageBox({
      type: "info",
      title: "Are you sure?",
      message: "Are you sure you want to reset to the default settings?",
      buttons: ["No", "Yes"],
      defaultId: 0
    });
    return result.response;
  });

  /**
   * display a confirmation dialog for deleting a screensaver
   */
  ipcMain.handle("delete-screensaver-dialog", async (_event, saver) => {
    const result = await dialog.showMessageBox(
      {
        type: "info",
        title: "Are you sure?",
        message: "Are you sure you want to delete this screensaver?",
        detail: `Deleting screensaver ${saver.name}`,
        buttons: ["No", "Yes"],
        defaultId: 0
      }); 
    
    return result.response;
  });

  /**
   * display a folder chooser for setting local source
   */
  ipcMain.handle("show-open-dialog", async () => {
    const result = await dialog.showOpenDialog(
      {
        title: "Pick a screensaver directory",
        message: "Pick a folder to store your custom screensavers",
        properties: [ "openDirectory", "createDirectory" ]
      });
    return result;
  });

  if ( testMode === true ) {
    /**
     * handle requests to get the current state of the app. this
     * is currently only called by our test shim
     */
    ipcMain.handle("get-current-state", async () => {
      return stateManager.currentStateString;
    });
  }
  
  /**
   * handle quit app events
   */
  ipcMain.on("quit-app", () => {
    log.info("quit-app");
    quitApp();
  });
};


/**
 * handle initial startup of app
 */
var bootApp = async function() {
  electronScreen = electron.screen;

  askAboutApplicationsFolder();
  await askAboutMediaAccess();

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
    systemDir: path.join(getSystemDir(), "system-savers")
  };

  log.info("Loading prefs");
  log.info(`baseDir: ${saverOpts.base}`);
  log.info(`systemSource: ${saverOpts.systemDir}`);
  prefs = new SaverPrefs(saverOpts.base, saverOpts.systemDir);
  savers = new SaverListManager({
    prefs: prefs
  });


  loadDisplayData();

  //
  // setup some event handlers for when screen count changes, mostly
  // to ensure that we wake up if the user plugs in or removes a
  // monitor
  //
  ["display-added", "display-removed"].forEach((type) => {
    electronScreen.on(type, () => {
      windows.handleDisplayChange();
      loadDisplayData();
    });
  });

  ["suspend", "resume", "lock-screen", "unlock-screen"].forEach((type) => {
    electron.powerMonitor.on(type, () => {
      log.info(`system ${type} event, stop screensavers`);
      windows.closeRunningScreensavers();
    }); 
  });

  setupIPC();

  const idler = require("desktop-idle");
  stateManager = new StateManager();
  stateManager.idleFn = idler.getIdleTime;

  // stateManager.idleFn = () => {
  //   const x = idler.getIdleTime();
  //   log.info(x);
  //   return x;
  // };

  updateStateManager();

  let result = await setupIfNeeded();
  await openPrefsWindowIfNeeded(result);

  setupForTesting();

  setupMenuAndTray();
  setupReleaseCheck();
  setupPackageCheck();
  setupLaunchShortcut();

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
    const power = new Power();
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
    idleTime: prefs.delay > 0 ? prefs.delay * 60 : Number.POSITIVE_INFINITY,
    blankTime: prefs.sleep > 0 ? (prefs.delay + prefs.sleep) * 60 : Number.POSITIVE_INFINITY,
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
    try {
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
    catch(e) {
      log.info("shortcut registration threw an error?");
      log.info(e);
    }
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
  savers.reset();

  if ( handles.prefs.window !== null ) {
    handles.prefs.window.send("savers-updated", arg);
  }
};

// load a few global variables
require("./bootstrap.js");

log.transports.file.level = "debug";
log.transports.file.maxSize = 1 * 1024 * 1024;

log.info(`Hello from version: ${global.APP_VERSION_BASE} running in ${global.IS_DEV ? "development" : "production"}`);

if ( global.IS_DEV ) {
  app.name = global.APP_NAME;
  log.info(`set app name to ${app.name}`);

  if ( testMode !== true ) {
    let userDataPath = path.join(app.getPath("appData"), app.name);
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



const windowMethods = {
  editor: openEditor,
  settings: openSettingsWindow,
  prefs: openPrefsWindow,
  about: openAboutWindow,
  "add-new": addNewSaver
};


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
exports.setStateToPaused = setStateToPaused;
exports.resetState = resetState;
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
