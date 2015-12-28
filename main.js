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
  if (process.platform != 'darwin') {
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

    var openAddPackageWindow = function() {
        var w = new BrowserWindow({width:500, height:200});
        w.loadURL('file://' + __dirname + '/ui/add-new.html');
        w.on('closed', function() {
            w = null;
            if ( mainWindow ) {
                mainWindow.reload();
            }
        });
    };
    
    var openPrefsWindow = function() {
        var prefsUrl = 'file://' + __dirname + '/ui/prefs.html';
        var w = new BrowserWindow({width:800, height:600});

        w.loadURL(prefsUrl);
        w.webContents.openDevTools();
        w.on('closed', function() {
            w = null;
            global.savers.reload();
        });
    };

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
        global.savers.setOpts(url_opts);

        var url = global.savers.getCurrentUrl(url_opts);
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
            // Dereference the window object, usually you would store windows
            // in an array if your app supports multi windows, this is the time
            // when you should delete the corresponding element.
            saverWindow = null;
            
            isActive = false;
        });


        // and load the index.html of the app.
        saverWindow.loadURL(url);
    };

    var stopScreenSaver = function() {
        if ( saverWindow ) {
            saverWindow.close();
        }
    };

    var trayMenu = Menu.buildFromTemplate([
        {
            label: 'Run Now',
            click: function() { runScreenSaver(); }
        },
        {
            label: 'Add Package',
             click: function() { openAddPackageWindow(); }
        },
        {
            label: 'Preferences',
            click: function() { openPrefsWindow(); }
        },
        // {
        //     label: 'Reload',
        //     click: function() { mainWindow.reload(); }
        // },

        {
            label: 'Toggle DevTools',
            click: function() { mainWindow.toggleDevTools(); }
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
        if ( isActive && idle < lastIdle ) {
            stopScreenSaver();
        }
        else if ( isActive == false && idle > 120 ) {
            runScreenSaver();
        }

        lastIdle = idle;
    };
    checkTimer = setInterval(checkIdle, 250);
});
