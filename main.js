'use strict';
const electron = require('electron');
const app = electron.app;  // Module to control application life.
const BrowserWindow = electron.BrowserWindow;  // Module to create native browser window.

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


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function() {
    var url = 'file://' + __dirname + '/ui/prefs.html';
    windowOpts = {
        width: 800, 
        height: 600,
        resizable: false
    };
    
    var Menu = require('menu');
    
    var openAddPackageWindow = function() {
        var w = new BrowserWindow({width:500, height:200});
        w.loadURL('file://' + __dirname + '/ui/add-new.html');
        w.on('closed', function() {
            w = null;
            mainWindow.reload();
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
    

    // Create the browser window.
    mainWindow = new BrowserWindow(windowOpts);

    // and load the index.html of the app.
    mainWindow.loadURL(url);
    
    // Emitted when the window is closed.
    mainWindow.on('closed', function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });
});
