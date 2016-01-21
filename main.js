'use strict';

const electron = require('electron');
const app = electron.app;  // Module to control application life.
const BrowserWindow = electron.BrowserWindow;  // Module to create native browser window.
const Menu = electron.Menu;
const Tray = electron.Tray;


var windowOpts;

let appIcon = null;
let checkTimer = null;
let isActive = false;
let idler = require('node-system-idle-time');
let parseArgs = require('minimist');
let saverWindows = [];
let argv = parseArgs(process.argv);

let debugMode = false;

// Report crashes to our server.
electron.crashReporter.start();

// don't show app in dock
app.dock.hide();

if ( argv.debug === true ) {
    debugMode = true;
}

// load a few global variables
require('./bootstrap.js');

// store our root path as a global variable so we can access it from screens
global.basePath = app.getPath('appData') + "/" + global.APP_NAME;
global.savers = require('./savers.js');
global.savers.init(global.basePath);

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if ( process.platform != 'darwin' ) {
    app.quit();
  }
});


var openPrefsWindow = function() {
    global.savers.reload(function() {
        var prefsUrl = 'file://' + __dirname + '/ui/prefs.html';
        var w = new BrowserWindow({
            width:800,
            height:750,
            resizable:false,
            icon: __dirname + '/assets/icon.png'
        });
        
        w.loadURL(prefsUrl);
        app.dock.show();

        if ( debugMode === true ) {
            w.webContents.openDevTools();
        }

        w.on('closed', function() {
            w = null;
            global.savers.reload();
            app.dock.hide();
        });
    });
};

var openAboutWindow = function() {
    var prefsUrl = 'file://' + __dirname + '/ui/about.html';
    var w = new BrowserWindow({
        width:450,
        height:300,
        resizable:false,
        icon: __dirname + '/assets/icon.png'
    });

    w.loadURL(prefsUrl);
    app.dock.show();
    
    if ( debugMode === true ) {
        w.webContents.openDevTools();
    }
    w.on('closed', function() {
        w = null;
        app.dock.hide();
    });
};

var runScreenSaver = function() {
    var electronScreen = electron.screen;
    var displays = electronScreen.getAllDisplays();
    var saver = global.savers.getCurrentData();

    // @todo maybe add an option to only run on a single display?

    // limit to a single screen when debugging
    if ( debugMode == true ) {
        displays = [
            electronScreen.getPrimaryDisplay()
        ];
    }


    for ( var i in displays ) {
        var s = displays[i];
        var size = s.bounds;
        var url_opts = { 
            width: size.width,
            height: size.height,
            platform: process.platform
        };

        var url = saver.getUrl(url_opts);
        console.log("loading " + url);

        var windowOpts = {
            fullscreen: ( debugMode !== true ),
            webgl: true,
            preload: __dirname + '/global.js',
            'auto-hide-menu-bar': true,
            x: s.bounds.x,
            y: s.bounds.y
        };

        var w = new BrowserWindow(windowOpts);

        if ( debugMode === true ) {
            w.webContents.openDevTools();
        }

        // Emitted when the window is closed.
        w.on('closed', function() {
            w = null;           
            isActive = false;
        });

        saverWindows.push(w);

        // and load the index.html of the app.
        w.loadURL(url);
    }       


    isActive = true;
};

var shouldLockScreen = function() {
    return ( process.platform === 'darwin' && savers.getLock() == true );
};

/**
 * lock the screen when the saver deactivates. currently this only works on OSX (and maybe not even there)
 */
var doLockScreen = function() {
    if ( process.platform === 'darwin' ) {
        var exec = require('child_process').exec;
        var cmd = "'/System/Library/CoreServices/Menu Extras/User.menu/Contents/Resources/CGSession' -suspend";
        
        exec(cmd, function(error, stdout, stderr) {
            console.log('stdout: ' + stdout);
            console.log('stderr: ' + stderr);
            if (error !== null) {
                console.log('exec error: ' + error);
            }
        });
    }

    // for windows:
    // rundll32.exe user32.dll,LockWorkStation
    // @see http://superuser.com/questions/21179/command-line-cmd-command-to-lock-a-windows-machine
};

var stopScreenSaver = function() {
    if ( saverWindows.length <= 0 ) {
        return;
    }

    if ( debugMode === true ) {
        return;
    }

    console.log("close it up");
    if ( shouldLockScreen() ) {
        doLockScreen();
    }

    for ( var s in saverWindows ) {
        saverWindows[s].close();
    }

    saverWindows = [];
};


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function() {  
    var trayMenu = Menu.buildFromTemplate([
        {
            label: 'Run Now',
            click: function() { runScreenSaver(); }
        },
        {
            label: 'Preferences',
            click: function() { openPrefsWindow(); }
        },
        {
            label: 'About Before Dawn',
            click: function() { openAboutWindow(); }
        },
        {
            label: 'Quit',
            selector: 'terminate:'
        }
    ]);

    appIcon = new Tray(__dirname + '/assets/icon.png');
    appIcon.setToolTip("Before Dawn");
    appIcon.setContextMenu(trayMenu); 

    var lastIdle = 0;
    var checkIdle = function() {
        var idle = idler.getIdleTime();
        var waitTime = savers.getDelay() * 60000;

        if ( waitTime <= 0 ) {
            return;
        }

        if ( isActive && idle < lastIdle ) {
            stopScreenSaver();
        }
        else if ( isActive == false && idle > waitTime ) {
            runScreenSaver();
        }

        lastIdle = idle;
    };

    // @todo save some clock cycles by making this longer when checking to activate
    // and shorter when checking to deactivate
    checkTimer = setInterval(checkIdle, 250);

    if ( argv.screen === "prefs" ) {
        openPrefsWindow();
    }
    else if ( argv.screen === "about" ) {
        openAboutWindow();
    }
    else if ( argv.screen === "saver" ) {
        runScreenSaver();
    }
});
