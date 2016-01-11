'use strict';

const electron = require('electron');
const app = electron.app;  // Module to control application life.
const BrowserWindow = electron.BrowserWindow;  // Module to create native browser window.
const Menu = electron.Menu;
const Tray = electron.Tray;

// Report crashes to our server.
electron.crashReporter.start();


// don't show app in dock
// @todo -- show prefs window/etc
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
        var prefsUrl = 'file://' + __dirname + '/ui/prefs.html';
        var w = new BrowserWindow({width:800, height:750, resizable:false});

        w.loadURL(prefsUrl);
        w.webContents.openDevTools();
        w.on('closed', function() {
            w = null;
            global.savers.reload();
        });
    };

    // uncomment this to test the prefs window
    // but also, should probably have a command line option to open it
    //openPrefsWindow();

    // Create the browser window.
    var saverWindow = null;

    var runScreenSaver = function() {
        // lets pull together some handy values that screensavers might want to know about
        // @todo different params for preview mode
        var atomScreen = require('screen');
        var size = atomScreen.getPrimaryDisplay().bounds;
        var url_opts = { 
            width: size.width,
            height: size.height,
            platform: process.platform
        };

        var saver = global.savers.getCurrentData();
        console.log("SAVER OPTS", saver);
        var url = saver.getUrl(url_opts);
        console.log("loading " + url);

        isActive = true;

        var windowOpts = {
            fullscreen: true,
            webgl: true,
            preload: __dirname + '/global.js',
            'auto-hide-menu-bar': true
        };

        saverWindow = new BrowserWindow(windowOpts);
        // Emitted when the window is closed.
        saverWindow.on('closed', function() {
            saverWindow = null;           
            isActive = false;
        });


        // and load the index.html of the app.
        // @todo - load before opening?
        saverWindow.loadURL(url);
        //        saverWindow.toggleDevTools();
    };

    var shouldLockScreen = function() {
        return ( process.platform === 'darwin' && savers.getLock() == true );
    };

    var doLockScreen = function() {
        var exec = require('child_process').exec;
        var cmd = "'/System/Library/CoreServices/Menu Extras/User.menu/Contents/Resources/CGSession' -suspend";

        exec(cmd, function(error, stdout, stderr) {
            console.log('stdout: ' + stdout);
            console.log('stderr: ' + stderr);
            if (error !== null) {
                console.log('exec error: ' + error);
            }
        });
    };

    var stopScreenSaver = function() {
        console.log("close it up");
        if ( saverWindow ) {
            if ( shouldLockScreen() ) {
                doLockScreen();
            }
            saverWindow.close();
        }
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
    checkTimer = setInterval(checkIdle, 250);
});
