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
  BrowserWindow,
  desktopCapturer,
  dialog,
  globalShortcut,
  ipcMain,
  Menu,
  session,
  shell,
  systemPreferences,
  Tray} = require("electron");

const fs = require("fs");
const path = require("path");
const url = require("url");
const exec = require("child_process").execFile;

const screenLock = require("./screen.js");

const StateManager = require("./state_manager.js");
const SaverPrefs = require("../lib/prefs.js");
const SaverFactory = require("../lib/saver-factory.js");
const Saver = require("../lib/saver.js");
const SaverListManager = require("../lib/saver-list.js");
const Package = require("../lib/package.js");
const Power = require("../main/power.js");

var releaseChecker;

const menusAndTrays = require("./menus.js");
const dock = require("./dock.js");
const windows = require("./windows.js");

const forcefocus = require("forcefocus");

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
  about: {
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
  },
  // shim: {
  //   window: null
  // }
};

let trayMenu;

let electronScreen;

let prefs = undefined;
let savers = undefined;
let stateManager = undefined;


// usually we want to check power state before running, but
// we'll skip that check depending on the value of this toggle
// so that manually running screensaver works just fine
let checkPowerState = true;

const RELEASE_CHECK_INTERVAL = 1000 * 60 * 60 * 12;

// load a few global variables
require("./bootstrap.js");

const defaultWebPreferences = {
  enableRemoteModule: false,
  contextIsolation: true,
  nodeIntegration: false,
  nativeWindowOpen: true,
  webSecurity: !global.IS_DEV
};

const defaultPreloadPrefrences = {
  ...defaultWebPreferences,
  sandbox: false,
  preload: path.join(__dirname, "assets", "preload.js")  
}


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

const power = new Power({
  platform: process.platform,
  method: electron.powerMonitor.isOnBatteryPower
});


let screenData = [];
var listScreens = async function() {
  const sources = await desktopCapturer.getSources({
    types: ["screen"],
    thumbnailSize: { width: 0, height: 0 }
  });
  
  screenData = sources;

  return sources;
};


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
      // width: 500,
      // height: 500,
      width: 100,
      height: 100,
      x: 6000,
      y: 2000,
      webPreferences: {
        ...defaultWebPreferences,
        sandbox: false,
        preload: path.join(__dirname, "assets", "grabber.js")
      }
    });
    grabberWindow.noTray = true;
    
    grabberWindow.once("ready-to-show", () => {
      log.info("grabber open");
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

  let screen = screenData.find((s) => { return s.display_id.toString() === s.id.toString(); });
  if ( ! screen ) {
    screen = screenData[0];
  }
  // log.info(screen);

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
      ipcMain.once(`screenshot-${screen.id}`, function(_e, message) {
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

        // rewrite file paths to always have unix slashes instead
        // of windows slashes. sometimes windows slashes are fine, but
        // there's a few situations where they won't render properly.
        message.url = message.url.split(path.sep).join(path.posix.sep);

        resolve(message);
      });

      openGrabberWindow().then((w) => {
        windowRef = w;
        log.info("send screengrab request");

        windowRef.webContents.send("request-screenshot", { 
          // id: s.id, 
          id: screen.id, 
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
    width: 400,
    height: 400,
    webPreferences: {
      ...defaultWebPreferences,
      preload: path.join(__dirname, "assets", "shim.js")
    }
  });

  const shimUrl = `file://${__dirname}/assets/shim.html`;
  testWindow.loadURL(shimUrl);

  //handles.shim.window = testWindow;
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
    const primary = electronScreen.getPrimaryDisplay();

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
        webPreferences: defaultPreloadPrefrences,
        icon: path.join(__dirname, "assets", "iconTemplate.png")
      });

      if ( !global.IS_DEV && handles.prefs.window.removeMenu !== undefined ) {
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
    height:650,
    maxWidth: 600,
    minWidth: 600,
    resizable: true,
    parent: handles.prefs.window,
    modal: true,
    icon: path.join(__dirname, "assets", "iconTemplate.png"),
    webPreferences: defaultPreloadPrefrences,
  });

  // hide the file menu
  if ( !global.IS_DEV && handles.settings.window.removeMenu !== undefined ) {
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
  var primary = electronScreen.getPrimaryDisplay();

  // take a screenshot of the main screen for use in previews
  grabScreen(primary).then((grab) => {
    screenshots[primary.id] = grab.url;

    handles.addNew.window = new BrowserWindow({
      show: false,
      width: 450,
      height: 700,
      resizable:true,
      webPreferences: defaultPreloadPrefrences,
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
  handles.about.window = new BrowserWindow({
    show: false,
    width:500,
    height:600,
    resizable:false,
    icon: path.join(__dirname, "assets", "iconTemplate.png"),
    webPreferences: defaultPreloadPrefrences,
  });

  if ( !global.IS_DEV && handles.about.window.removeMenu !== undefined ) {
    handles.about.window.removeMenu();
  }

  handles.about.window.on("closed", () => {
    handles.about.window = null;
    dock.hideDockIfInactive(app);
  });

  handles.about.window.once("ready-to-show", () => {
    handles.about.window.show();
    dock.showDock(app);
  });

  log.info(`open ${aboutUrl}`);
  handles.about.window.loadURL(aboutUrl);
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
      webPreferences: defaultPreloadPrefrences,
    });  
  }

  handles.editor.window.screenshot = screenshot;

  handles.editor.window.once("ready-to-show", () => {
    handles.editor.window.show();

    if (process.env.NODE_ENV === "test") {
      handles.editor.window.webContents.closeDevTools();
    }

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
    alwaysOnTop: true,
    x: s.bounds.x,
    y: s.bounds.y,
    show: false,
    roundedCorners: false,
    titleBarStyle: "customButtonsOnHover",
    webPreferences: defaultWebPreferences
  };

  // osx will display window immediately if fullscreen is true
  // so we default it to false there
  if (process.platform !== "darwin" ) {
    opts.fullscreen = true;
  }

  if ( testMode === true ) {
    opts.fullscreen = false;
    // opts.x = 100;
    // opts.y = 100;
    opts.show = true;
    opts.width = 400;
    opts.height = 400;
  }

  return opts;
};

var applyScreensaverWindowEvents = function(w) {
  // Emitted when the window is closed.
  w.on("closed", function() {
    if (process.platform !== "win32" ) {
      cursor.show();
    }
    windows.forceWindowClose(w);
  });
  
  // inject our custom CSS into the screensaver window
  w.webContents.on("did-finish-load", function() {
    log.info("did-finish-load");
    if (!w.isDestroyed()) {
      w.webContents.insertCSS(globalCSSCode);
    }
  });
  
  // we could do something nice with either of these events
  w.webContents.on("render-process-gone", log.info);
  w.webContents.on("unresponsive", log.info);
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

  let diff = process.hrtime(tickCount);
  log.info(`run screensaver ${saver.name} on screen ${s.id} ${saver.url} ts: ${diff[0] * 1e9 + diff[1]}`);


  return new Promise((resolve, reject) => {
    try {
      applyScreensaverWindowEvents(w);
      
      w.once("ready-to-show", () => {
        log.info("ready-to-show", s.id);
        if ( testMode !== true ) {
          windows.setFullScreen(w);
        }

        if (process.platform === "win32" ) {
          log.info("force focus");
          forcefocus.focusWindow(w);
        }
        
        diff = process.hrtime(tickCount);
        log.info(`rendered in ${diff[0] * 1e9 + diff[1]} nanoseconds`);
        resolve(s.id);
      });
      
      if ( typeof(screenshot) !== "undefined" ) {
        log.info(`pass screenshot ${screenshot}`);
        url_opts.screenshot = encodeURIComponent("file://" + screenshot);
      }
      // w.webContents.openDevTools();


      // generate screensaver object, then get url to load
      const saverObj = new Saver(saver);
      const url = saverObj.urlWithParams(url_opts);
      
      log.info("Loading " + url, s.id);
      
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
      console.log(message);
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
var blankScreen = async function(s) {
  if ( process.env.TEST_MODE ) {
    log.info("refusing to blank screen in test mode");
    return s.id;
  }

  const systemPath = getSystemDir();
  const blankUrl = `file://${path.join(systemPath, "system-savers", "blank", "index.html")}`;
  const saver = {
    name: "Blank",
    url: blankUrl
  };
  return runScreenSaverOnDisplay(saver, s);
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
  log.info("setStateToRunning");
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
  // log.info("random: " + randomPath);
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
            let displays = [];
            let blanks = [];
            // make sure we have something to display
            if ( typeof(saver) === "undefined" ) {
              log.info("No screensaver defined! Just blank everything");
              blanks = getDisplays().concat(getNonPrimaryDisplays());
            }
            else if ( testMode === true ) {
              blanks = [];
            } else {
              displays = getDisplays();
              if ( debugMode !== true && testMode !== true && prefs.runOnSingleDisplay === true ) {
                blanks = getNonPrimaryDisplays();
              }
            }

            // log.info("displays", displays);
            // log.info("blanks", blanks);

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

            Promise.all(promises).then(setRunningInABit).catch((e) => {
              log.info("running screensaver failed");
              log.info(e);

              stateManager.reset();
              cursor.show(); 
            });
          });
};

/**
 * After a short delay, set state manager to running. This should
 * help with mouse wiggle/etc
 */
var setRunningInABit = function() {
  setTimeout(function() {
    log.info("our work is done, set state to running");
    stateManager.running();
  }, 1500);
};

/**
 * should we lock the user's screen when returning from running the saver?
 */
var shouldLockScreen = function() {
  // we can't lock the screen on OSX because it would involve using
  // private APIs and is a super pain in the butt
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
  else if ( shouldLockScreen() && screenLock.doLockScreen ) {
    log.info("lock the screen");
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
 * return the URL prefix we should use when loading app windows. if
 * running in development mode with hot reload enabled, we'll use an
 * HTTP request, otherwise we'll use a file:// url.
 */
var getUrl = function(dest) {
  let baseUrl;
  if ( !testMode && process.env.NODE_ENV === "development" ) {
    if ( ! process.env.DISABLE_RELOAD ) {
      let devPort;

      try {
        let packageJSON = require("../../package.json");
        devPort = packageJSON.devport;
      }
      catch(e) {
        devPort = 9080;
      }
      
      baseUrl = `http://localhost:${devPort}`;
      return new URL(dest, new URL(baseUrl)).toString(); // url.resolve(baseUrl, dest);
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
  var menu = Menu.buildFromTemplate(menusAndTrays.buildMenuTemplate(app));

  Menu.setApplicationMenu(menu);

  //
  // build the tray menu
  //
  trayMenu = Menu.buildFromTemplate(menusAndTrays.trayMenuTemplate());

  trayMenu.items[3].visible = global.NEW_RELEASE_AVAILABLE;

  const iconImage = menusAndTrays.trayIconImage();

  appIcon = new Tray(iconImage);
  appIcon.setToolTip(global.APP_NAME);
  appIcon.setContextMenu(trayMenu); 
  
  // show tray menu on right click
  // @todo should this be osx only?
  appIcon.on("right-click", () => {
    appIcon.popUpContextMenu();
  });
  appIcon.on("click", () => {
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

  if ( process.env.QUIET_MODE === "true" || process.env.NODE_ENV === "test" ) {
    log.info("Quiet/test mode, skip setup checks!");
    return false;
  }

  // check if we should download savers, set something up, etc
  if ( process.env.FORCE_SETUP || prefs.needSetup ) {
    // stop processing here, we know we need to setup
    log.info("needSetup!");
    return true;
  }

  // log.info(`checking if ${prefs.saver} is valid`);
  const exists = await savers.confirmExists(prefs.saver);
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

const getPackage = function() {
  const attrs = {
    repo: prefs.sourceRepo,
    dest: prefs.defaultSaversDir,
    log: log.info
  };

  console.log(attrs);

  return new Package(attrs);
};


/**
 * setup assorted IPC listeners
 */
let setupIPC = function() {
  /**
   * open the window specified by 'key', passing args along
   */
  ipcMain.on("open-window", (_event, key, args) => {
    console.log(key, args);
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

  ipcMain.on("close-all-windows", () => {
    console.log("close-all-windows");
    Object.keys(handles).forEach(function(key) {
      if ( handles[key].window ) {
        console.log("close $key");
        handles[key].window.close();
      }
    });
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
      NEW_RELEASE_AVAILABLE: global.NEW_RELEASE_AVAILABLE
    };
  });

  /**
   * return a list of screensavers
   */
  ipcMain.handle("list-savers", async () => {
    const entries = await savers.list();
    return entries;
  });

  /**
   * load and return the specified screensaver
   */
  ipcMain.handle("load-saver", async (_event, key) => {
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
    if ( attrs.launchShortcut === undefined ) {
      attrs.launchShortcut = "";
    }

    prefs.store.set(attrs);

    savers.reset();
    updateStateManager();
  });

  ipcMain.handle("check-screensaver-package", async() => {
    log.info("check-screensaver-package");
    return getPackage().getReleaseInfo();
  });

  ipcMain.handle("download-screensaver-package", async() => {
    log.info("download-screensaver-package");
    const result = await getPackage().downloadRelease();
    
    log.info(result);
    toggleSaversUpdated();
    return result;
  });


  /**
   * return the default settings for the app
   */
  ipcMain.handle("get-defaults", async() => {
    log.info("get-defaults");
    log.info(prefs.defaults);
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
    return electronScreen.getPrimaryDisplay().bounds;
  });

  /**
   * return a screengrab of the primary screen to the requester
   */
  ipcMain.handle("get-primary-screenshot", () => {
    return screenshots[electronScreen.getPrimaryDisplay().id];
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

  ipcMain.on("toggle-dev-tools", () => {
    log.info("toggle-dev-tools");
    if ( handles.editor.window !== null ) {
      handles.editor.window.webContents.openDevTools();
    }
  });

  /**
   * open a folder
   */
  ipcMain.on("open-folder", (_event, src) => {
    var cmd;
    var args = [];
    
    // figure out the path to the screensaver folder. use
    // decodeURIComponent to convert %20 to spaces
    var filePath = path.dirname(decodeURIComponent(url.parse(src).path));

    switch(process.platform) {
    case "darwin":
      cmd = "open";
      args = [ filePath ];
      break;
    case "win32":
      if (process.env.SystemRoot) {
        cmd = path.join(process.env.SystemRoot, "explorer.exe");
      }
      else {
        cmd = "explorer.exe";
      }
      args = [`/select,${filePath}`];
      break;
    default:
      // # Strip the filename from the path to make sure we pass a directory
      // # path. If we pass xdg-open a file path, it will open that file in the
      // # most suitable application instead, which is not what we want.
      cmd = "xdg-open";
      args = [ filePath ];
    }
    
    exec(cmd, args, function() {});
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

  //
  // setup a couple of IPC methods we only use in tests
  //
  if ( testMode === true ) {
    /**
     * handle requests to get the current state of the app. this
     * is currently only called by our test shim
     */
    ipcMain.handle("get-current-state", async () => {
      return stateManager.currentStateString;
    });

    /**
     * get a list of tray item labels
     */
    ipcMain.handle("get-tray-items", async () => {
      return menusAndTrays.trayMenuTemplate().map(item => item.label);
    });

    /**
     * fake a click on a tray item
     */
    ipcMain.handle("click-tray-item", (_event, label) => {
      log.info(`click-tray-item ${label}`);
      const items = menusAndTrays.trayMenuTemplate();
      const item = items.find(item => item.label === label);
      item.click();
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
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    // console.log(details);
    callback({responseHeaders: Object.fromEntries(Object.entries(details.responseHeaders).filter(header => !/x-frame-options/i.test(header[0])))});
  });

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

  let saversDir;
  if ( process.env.SAVERS_DIR ) {
    saversDir = process.env.SAVERS_DIR;
  }
  else if ( global.IS_DEV ) {
    saversDir = path.join(__dirname, "..", "..", "data", "savers");
    log.info("hello from dev mode, 'node bin/download-screensavers' to grab screensavers");
  }
  else {
    saversDir = path.join(process.resourcesPath, "savers");
  }

  const systemDir = path.join(getSystemDir(), "system-savers");

  let basePath;
  // store our root path as a global variable so we can access it from screens
  if ( process.env.BEFORE_DAWN_DIR !== undefined ) {
    basePath = process.env.BEFORE_DAWN_DIR;
  }
  else {
    basePath = app.getPath("userData");
  }
  log.info("use base path", basePath);


  log.info("Loading prefs");
  log.info(`baseDir: ${basePath}`);
  log.info(`saversDir: ${saversDir}`);
  log.info(`system savers: ${systemDir}`);

  prefs = new SaverPrefs(basePath, systemDir, saversDir);
  savers = new SaverListManager({
    prefs: prefs
  });

  await listScreens();

  //
  // setup some event handlers for when screen count changes, mostly
  // to ensure that we wake up if the user plugs in or removes a
  // monitor
  //
  ["display-added", "display-removed"].forEach((type) => {
    electronScreen.on(type, async () => {
      await listScreens();
      windows.handleDisplayChange();
    });
  });

  ["suspend", "resume", "lock-screen", "unlock-screen"].forEach((type) => {
    electron.powerMonitor.on(type, () => {
      log.info(`system ${type} event, stop screensavers`);
      windows.closeRunningScreensavers();
    }); 
  });

  electron.powerMonitor.on("on-ac", () => {
    log.info("system on-ac event, reset state manager");
    stateManager.reset();
  }); 

  setupIPC();

  stateManager = new StateManager();
  stateManager.idleFn = electron.powerMonitor.getSystemIdleTime;

  updateStateManager();

  let result = await setupIfNeeded();
  await openPrefsWindowIfNeeded(result);

  setupForTesting();

  setupMenuAndTray();
  setupReleaseCheck();
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
var runScreenSaverIfPowered = async function() {
  log.info("runScreenSaverIfPowered");

  if ( windows.screenSaverIsRunning() ) {
    log.info("looks like we're already running");
    return;
  }
  
  // check if we are on battery, and if we should be running in that case
  if ( checkPowerState && prefs.disableOnBattery ) {
    const isPowered = await power.charging();

    if ( isPowered ) {       
      runScreenSaverIfNotFullscreen();
    }
    else {
      log.info("I would run, but we're on battery :(");
      stateManager.unrunnable();
    }
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
  const delayTime = prefs.delay > 0 ? prefs.delay * 60 : Number.POSITIVE_INFINITY;
  const blankOffset = process.platform === "win32" ? 0 : prefs.delay;
  const blankTime = prefs.sleep > 0 ? (blankOffset + prefs.sleep) * 60 : Number.POSITIVE_INFINITY;
  log.info(`updateStateManager idleTime: ${delayTime} blankTime: ${blankTime}`);

  stateManager.setup({
    idleTime: delayTime,
    blankTime: blankTime,
    onIdleTime: runScreenSaverIfPowered, 
    onBlankTime: blankScreenIfNeeded,
    onReset: windows.closeRunningScreensavers,
    logger: log.info
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
 * setup a global shortcut to run a screensaver
 */
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
    try {
      if ( handles.prefs.window === null && handles.prefs.window !== undefined ) {
        openPrefsWindow();
      }
      else {
        if ( handles.prefs.window.isMinimized() ) {
          handles.prefs.window.restore();
        }
        handles.prefs.window.focus();
      }
    }
    catch(e) {
      console.log(e);
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
exports.toggleSaversUpdated = toggleSaversUpdated;
exports.quitApp = quitApp;
