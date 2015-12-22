'use strict';
const electron = require('electron');
const app = electron.app;  // Module to control application life.
const BrowserWindow = electron.BrowserWindow;  // Module to create native browser window.
const Menu = electron.Menu;
const Tray = electron.Tray;


require('./bootstrap.js');

// Report crashes to our server.
electron.crashReporter.start();


// store our root path as a global variable so we can access it from screens
//var APP_NAME = "Before Dawn";
global.basePath = app.getPath('appData') + "/" + global.APP_NAME;

var savers = require('./savers.js');
savers.init(global.basePath);

var windowOpts;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

let x = new Promise(function() {});

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform != 'darwin') {
    app.quit();
  }
});


let appIcon = null;

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function() {  
    var prefsUrl = 'file://' + __dirname + '/ui/prefs.html';

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
        var w = new BrowserWindow({width:800, height:600});
        w.loadURL(prefsUrl);
        w.on('closed', function() {
            w = null;
            //mainWindow.reload();
        });
    };

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
        savers.setOpts(url_opts);

        var url = savers.getCurrentUrl(url_opts);
        console.log("loading " + url);
        var windowOpts = {
            fullscreen: true,
            webgl: true,
            preload: __dirname + '/global.js',
            'auto-hide-menu-bar': true
        };

        // Create the browser window.
        var saverWindow = new BrowserWindow(windowOpts);

        // and load the index.html of the app.
        saverWindow.loadUrl(url);

        // Emitted when the window is closed.
        saverWindow.on('closed', function() {
            // Dereference the window object, usually you would store windows
            // in an array if your app supports multi windows, this is the time
            // when you should delete the corresponding element.
            saverWindow = null;
        });

    };

    var template = [
        {
            label: 'Before Dawn',
            submenu: [
                {
                    label: 'Add Package',
                    accelerator: 'CmdOrCtrl+A',
                    click: function() { openAddPackageWindow(); }
                },
                {
                    label: 'Reload',
                    accelerator: 'CmdOrCtrl+R',
                    click: function() { mainWindow.reload(); }
                },
                {
                    label: 'Toggle DevTools',
                    accelerator: 'Alt+CmdOrCtrl+I',
                    click: function() { mainWindow.toggleDevTools(); }
                },
                {
                    label: 'Quit',
                    accelerator: 'CmdOrCtrl+Q',
                    selector: 'terminate:'
                }
            ]
        }
    ];
        
    var menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

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
        {
            label: 'Reload',
            click: function() { mainWindow.reload(); }
        },
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

    // Create the browser window.
    mainWindow = new BrowserWindow(windowOpts);

    // and load the index.html of the app.
    mainWindow.loadURL(prefsUrl);
    
    // Emitted when the window is closed.
    mainWindow.on('closed', function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });
});
