'use strict';

const electron = require('electron');
const app = electron.app;  // Module to control application life.
const BrowserWindow = electron.BrowserWindow;  // Module to create native browser window.
const Menu = electron.Menu;
const Tray = electron.Tray;
const {ipcMain} = require('electron')
const fs = require('fs');
const path = require('path');

var windowOpts;

let appIcon = null;
let checkTimer = null;
let isActive = false;
let idler = require('node-system-idle-time');
let parseArgs = require('minimist');
let saverWindows = [];
let argv = parseArgs(process.argv);
let releaseChecker = require('./lib/release_check.js');
let power = require('./lib/power.js');

let debugMode = ( argv.debug === true );


var appReady = false;
var configLoaded = false;

var grabber;

// track total displays so that when the screensaver is
// running everywhere we can handle some background work
var totalDisplays = 0;

var wakeupTimer;

var paused = false;
var lastIdle = 0;



// load a few global variables
require('./bootstrap.js');

// store our root path as a global variable so we can access it from screens
global.basePath = app.getPath('appData') + "/" + global.APP_NAME;
global.savers = require('./lib/savers.js');


/**
 * Open the preferences window
 */

var prefsWindowHandle = null;
var openPrefsWindow = function() {
  var electronScreen = electron.screen;
  var primary = electronScreen.getPrimaryDisplay();
  var displays = [
    primary
  ];
  
  ipcMain.once("screenshot-" + primary.id, function(e, message) {
    grabber.reload();

    // call savers.reload to make sure our data is properly refreshed
    // and check for any system updates
    global.savers.reload(function() {
      var prefsUrl = 'file://' + __dirname + '/ui/prefs.html';
      prefsWindowHandle = new BrowserWindow({
        width:800,
        height:675,
        resizable:true,
        icon: path.join(__dirname, 'assets', 'icon.png')
      });

      prefsUrl = prefsUrl + "?screenshot=" + encodeURIComponent("file://" + message.url);
      
      prefsWindowHandle.loadURL(prefsUrl);
      
      if ( typeof(app.dock) !== "undefined" ) {
        app.dock.show();
      }

      if ( debugMode === true ) {
        prefsWindowHandle.webContents.openDevTools();
      }

      prefsWindowHandle.on('closed', function() {
        prefsWindowHandle = null;
        global.savers.reload();
        if ( typeof(app.dock) !== "undefined" ) {
          app.dock.hide();
        }
      });
    });
  });


  grabber.webContents.send('screengrab-request', displays);
};


/**
 * Open the (very simple) About window for the app
 */
var openAboutWindow = function() {
  var prefsUrl = 'file://' + __dirname + '/ui/about.html';
  var w = new BrowserWindow({
    width:450,
    height:300,
    resizable:false,
    icon: path.join(__dirname, 'assets', 'icon.png')
  });

  w.loadURL(prefsUrl);
  if ( typeof(app.dock) !== "undefined" ) {
    app.dock.show();
  }
  
  if ( debugMode === true ) {
    w.webContents.openDevTools();
  }
  w.on('closed', function() {
    w = null;
    if ( typeof(app.dock) !== "undefined" ) {
      app.dock.hide();
    }
  });
};


/**
 * open our screen grabber tool. this should run in the background,
 * waiting to take screenshots.
 */
var openScreenGrabber = function() {
  var grabberUrl = 'file://' + __dirname + '/ui/grabber.html';
  grabber = new BrowserWindow({
    show: debugMode === true,
    width:800,
    height:600
  });

  grabber.loadURL(grabberUrl);
  
  if ( debugMode === true ) {
    grabber.webContents.openDevTools();
  }
  grabber.on('closed', function() {
    grabber = null;
  });
};

var updateActiveState = function() {
  var openWindows = saverWindows.filter(function(w) {
    return (typeof(w) !== "undefined" && w.isClosed !== true);
  });

  if ( openWindows.length == 0 ) {
    saverWindows = [];
    isActive = false;
  }
};

/**
 * run the specified screensaver on the specified screen
 */
var runScreenSaverOnDisplay = function(saver, s) {
  var globalJSCode = fs.readFileSync( path.join(__dirname, 'assets', 'global-js-handlers.js'), 'ascii');

  var size = s.bounds;
  var url_opts = { 
    width: size.width,
    height: size.height,
    platform: process.platform
  };
  
  var windowOpts = {
    fullscreen: ( debugMode !== true ),
    preload: path.join(__dirname, 'assets', 'global.js'),
    'auto-hide-menu-bar': true,
    x: s.bounds.x,
    y: s.bounds.y
  };

  // listen for an event that we have an image of the display we will run on before completing setup
  ipcMain.once("screenshot-" + s.id, function(e, message) {
    var w = new BrowserWindow(windowOpts);       

    saverWindows.push(w);

    if ( debugMode === true ) {
      w.webContents.openDevTools();
    }
    
    // Emitted when the window is closed.
    w.on('closed', function() {
      w.isClosed = true;
      updateActiveState();
    });
    
    
    url_opts.screenshot = encodeURIComponent("file://" + message.url);

    var url = saver.getUrl(url_opts);
    console.log("loading " + url);
    
    // and load the index.html of the app.
    w.loadURL(url);
    
    // windows is having some issues with putting the window behind existing
    // stuff -- @see https://github.com/atom/electron/issues/2867
    if ( process.platform == "win32" ) {
      w.minimize();
      w.focus();
    }
    
    // inject our custom JS and CSS here
    w.webContents.executeJavaScript(globalJSCode);

    // reload the screengrabber window to keep it from churning
    // CPU, until I can figure out why that is even happening
    if ( saverWindows.length >= totalDisplays ) {
      console.log("Reloading screengrabber");
      grabber.reload();
    }

  });
};

var getDisplays = function() {
  var electronScreen = electron.screen;
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
 * run the user's chosen screensaver on any available screens
 */
var runScreenSaver = function() {
  var displays = getDisplays();
  var saver = global.savers.getCurrentData();

  if ( typeof(saver) === "undefined" ) {
    return;
  }
  
  // @todo maybe add an option to only run on a single display?
  
  // limit to a single screen when debugging
  if ( debugMode === true ) {
    if ( typeof(app.dock) !== "undefined" ) {
      app.dock.show();
    }
  }

  totalDisplays = displays.length;

  try {
    for ( var i in displays ) {
      runScreenSaverOnDisplay(saver, displays[i]);
    } // for

    console.log("send event screengrab-request");
    grabber.webContents.send('screengrab-request', displays);
  }
  catch (e) {
    console.log(e);
  }

  // set the idle timer to something > 0
  if ( lastIdle < 99 ) {
    lastIdle = 99;
  }

  isActive = true;
  wakeupTimer = setInterval(checkForWakeup, 100);
};

/**
 * should we lock the user's screen when returning from running the saver?
 */
var shouldLockScreen = function() {
  return ( savers.getLock() === true );
};

/**
 * lock the screen when the saver deactivates. currently this only works on OSX and Windows
 */
var doLockScreen = function() {
  var exec = require('child_process').exec;
  var cmd;
  
  if ( process.platform === 'darwin' ) {
    cmd = "'/System/Library/CoreServices/Menu Extras/User.menu/Contents/Resources/CGSession' -suspend";       
  }
  else if ( process.platform === 'win32' ) {
    // @see http://superuser.com/questions/21179/command-line-cmd-command-to-lock-a-windows-machine
    cmd = "rundll32.exe user32.dll,LockWorkStation";
  }
  else {
    return;
  }

  exec(cmd, function(error, stdout, stderr) {
    console.log('stdout: ' + stdout);
    console.log('stderr: ' + stderr);
    if (error !== null) {
      console.log('exec error: ' + error);
    }
  });
};

/**
 * stop the running screensaver
 */
var stopScreenSaver = function() {
  console.log("received stopScreenSaver call");

  clearInterval(wakeupTimer);
  lastIdle = 0;

  if ( saverWindows.length <= 0 || debugMode === true ) {
    return;
  }

  // trigger lock screen before actually closing anything
  if ( shouldLockScreen() ) {
    doLockScreen();
  }

  console.log("closing " + saverWindows.length + " windows");
  for ( var s in saverWindows ) {
    console.log("close", s);
    saverWindows[s].destroy();
  }
};

var checkForWakeup = function() {
  var idle;
  
  if ( paused === true || isActive !== true ) {
    return;
  }

  idle = idler.getIdleTime();
  if ( idle < lastIdle ) {
    stopScreenSaver();
  }
};

var checkIdle = function() {
  var idle, waitTime;

  // check if we're already running, or paused
  if ( paused === true || isActive === true ) {
    return;
  }

  // check that we are actually supposed to be running
  waitTime = savers.getDelay() * 60000;
  if ( waitTime <= 0 ) {
    return;
  }


  
  // are we past our idle time
  idle = idler.getIdleTime();
  if ( idle > waitTime ) {
    // check if we are on battery, and if we should be running in that case
    if ( savers.getDisableOnBattery() ) {
      power.charging().then((is_powered) => {
        if ( is_powered ) {
          runScreenSaver();
        }
      });
    }
    else {
      runScreenSaver();
    }
  }
  
  lastIdle = idle;
};


var trayMenu = Menu.buildFromTemplate([
  {
    label: 'Run Now',
    click: function() { runScreenSaver(); }
  },
  {
    label: 'Disable',
    click: function() { 
      paused = true;
      trayMenu.items[1].visible = false;
      trayMenu.items[2].visible = true;
    }
  },
  {
    label: 'Enable',
    click: function() { 
      paused = false;
      trayMenu.items[1].visible = true;
      trayMenu.items[2].visible = false;
    },
    visible: false
  },
  {
    label: 'Update Available!',
    click: function() { 
      require('electron').shell.openExternal('https://github.com/' + global.APP_REPO + '/releases/latest');
    },
    visible: (global.NEW_RELEASE_AVAILABLE === true)
  },
  {
    label: 'Preferences',
    click: function() { openPrefsWindow(); }
  },
  {
    label: 'About ' + global.APP_NAME,
    click: function() { openAboutWindow(); }
  },
  {
    label: 'Quit',
    click: function() { app.quit(); }
  }
]);


/**
 * make sure we're only running a single instance
 */
var shouldQuit = app.makeSingleInstance(function(commandLine, workingDirectory) {
  return true;
});

if (shouldQuit) {
  app.quit();
}


// don't show app in dock
if ( typeof(app.dock) !== "undefined" ) {
  app.dock.hide();
}


// seems like we need to catch this event to keep OSX from exiting app after screensaver runs?
app.on('window-all-closed', function() {
  console.log("window-all-closed");
});



// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.once('ready', function() {  
  appIcon = new Tray(__dirname + '/assets/icon.png');
  appIcon.setToolTip(global.APP_NAME);
  appIcon.setContextMenu(trayMenu); 

  var menuTemplate = require("./ui/menu_template.js").buildMenuTemplate(app);
  var menu = Menu.buildFromTemplate(menuTemplate);

  Menu.setApplicationMenu(menu);

  openScreenGrabber();

  checkTimer = setInterval(checkIdle, 2500);

  if ( argv.screen === "prefs" ) {
    openPrefsWindow();
  }
  else if ( argv.screen === "about" ) {
    openAboutWindow();
  }
  else if ( argv.screen === "saver" ) {
    runScreenSaver();
  }

  appReady = true;

  openPrefsOnFirstLoad();
});


//
// listen for a message from global.js that we should stop running the screensaver
//
ipcMain.on('asynchronous-message', function(event, arg) {
  if ( arg === "stopScreenSaver" ) {
    stopScreenSaver();
  }
});


//
// if the user has updated one of their screensavers, we can let
// the prefs window know that it needs to reload
//
ipcMain.on('savers-updated', (event, arg) => {
  console.log("SAVER UPDATED", arg);
  if ( prefsWindowHandle !== null ) {
    prefsWindowHandle.send('savers-updated', arg);
  }
});



/**
 * once the app is ready and our config is loaded, check to see if the app
 * has been loaded before. if not, let's go ahead and open the prefs window now.
 */
var openPrefsOnFirstLoad = function() {
  if ( appReady === false || configLoaded === false ) {
    return;
  }
  if ( savers.firstLoad() === true ) {
    setTimeout(openPrefsWindow, 1000);
  }
};


/**
 * handle initial startup of app
 */
var bootApp = function(_basePath) {
  if ( typeof(_basePath) !== "undefined" ) {
    global.basePath = _basePath;
  }

  trayMenu.items[3].visible = global.NEW_RELEASE_AVAILABLE;

  global.savers.init(global.basePath, function() {
    configLoaded = true;
    openPrefsOnFirstLoad();
  });
};

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
