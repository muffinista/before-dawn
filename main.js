'use strict';

const electron = require('electron');
const app = electron.app;  // Module to control application life.
const BrowserWindow = electron.BrowserWindow;  // Module to create native browser window.
const Menu = electron.Menu;
const Tray = electron.Tray;

// Report crashes to our server.
electron.crashReporter.start();

// don't show app in dock
app.dock.hide();


// load a few global variables
require('./bootstrap.js');

// store our root path as a global variable so we can access it from screens
global.basePath = app.getPath('appData') + "/" + global.APP_NAME;
global.savers = require('./savers.js');
global.savers.init(global.basePath);

var windowOpts;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if ( process.platform != 'darwin' ) {
    app.quit();
  }
});


let appIcon = null;
let checkTimer = null;
let isActive = false;
var idler = require('@paulcbetts/system-idle-time');


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function() {  
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

            //            w.webContents.openDevTools();
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
        w.on('closed', function() {
            w = null;
            app.dock.hide();
        });
    };

    // uncomment this to test the prefs window
    // but also, should probably have a command line option to open it
    //openPrefsWindow();

    // Create the browser window.
    var saverWindows = [];

    var runScreenSaver = function() {
        var electronScreen = electron.screen;
        var displays = electronScreen.getAllDisplays();

        var saver = global.savers.getCurrentData();
        console.log("SAVER OPTS", saver);

        isActive = true;

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
                fullscreen: true,
                webgl: true,
                preload: __dirname + '/global.js',
                'auto-hide-menu-bar': true,
                x: s.bounds.x,
                y: s.bounds.y
            };

            var w = new BrowserWindow(windowOpts);
            // Emitted when the window is closed.
            w.on('closed', function() {
                w = null;           
                isActive = false;
            });

            saverWindows.push(w);

            // and load the index.html of the app.
            w.loadURL(url);
            //w.toggleDevTools();
        }       
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

        console.log("close it up");
        if ( shouldLockScreen() ) {
            doLockScreen();
        }

        for ( var s in saverWindows ) {
            saverWindows[s].close();
        }

        saverWindows = [];
    };

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
        var idle = idler.getIdleTime() / 1000;
        var waitTime = savers.getDelay() * 60;

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
    checkTimer = setInterval(checkIdle, 2500);
});
