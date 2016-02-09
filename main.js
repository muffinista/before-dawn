'use strict';

const electron = require('electron');
const app = electron.app;  // Module to control application life.
const BrowserWindow = electron.BrowserWindow;  // Module to create native browser window.
const Menu = electron.Menu;
const Tray = electron.Tray;
const ipcMain = require('electron').ipcMain;
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
let screenshot = require('desktop-screenshot');
let temp = require("temp").track();

let debugMode = false;

var screenshot_file = temp.path({suffix: '.png'});

var appReady = false;
var configLoaded = false;


// don't show app in dock
if ( typeof(app.dock) !== "undefined" ) {
    app.dock.hide();
}

if ( argv.debug === true ) {
    debugMode = true;
}

// load a few global variables
require('./bootstrap.js');

// store our root path as a global variable so we can access it from screens
global.basePath = app.getPath('appData') + "/" + global.APP_NAME;
global.savers = require('./savers.js');

var openPrefsWindow = function() {
    global.savers.reload(function() {
        var prefsUrl = 'file://' + __dirname + '/ui/prefs.html';
        var w = new BrowserWindow({
            width:800,
            height:675,
            resizable:false,
            icon: __dirname + '/assets/icon.png'
        });

        var menuTemplate = [
            {
                label: 'Edit',
                submenu: [
                    {
                        label: 'Undo',
                        accelerator: 'CmdOrCtrl+Z',
                        role: 'undo'
                    },
                    {
                        label: 'Redo',
                        accelerator: 'Shift+CmdOrCtrl+Z',
                        role: 'redo'
                    },
                    {
                        type: 'separator'
                    },
                    {
                        label: 'Cut',
                        accelerator: 'CmdOrCtrl+X',
                        role: 'cut'
                    },
                    {
                        label: 'Copy',
                        accelerator: 'CmdOrCtrl+C',
                        role: 'copy'
                    },
                    {
                        label: 'Paste',
                        accelerator: 'CmdOrCtrl+V',
                        role: 'paste'
                    },
                    {
                        label: 'Select All',
                        accelerator: 'CmdOrCtrl+A',
                        role: 'selectall'
                    }
                ]
            },
            {
                label: 'View',
                submenu: [
                    {
                        label: 'Reload',
                        accelerator: 'CmdOrCtrl+R',
                        click: function(item, focusedWindow) {
                            if (focusedWindow)
                                focusedWindow.reload();
                        }
                    },
                    {
                        label: 'Toggle Developer Tools',
                        accelerator: (function() {
                            if (process.platform == 'darwin')
                                return 'Alt+Command+I';
                            else
                                return 'Ctrl+Shift+I';
                        })(),
                        click: function(item, focusedWindow) {
                            if (focusedWindow)
                                focusedWindow.toggleDevTools();
                        }
                    }
                ]
            },
            {
                label: 'Window',
                role: 'window',
                submenu: [
                    {
                        label: 'Minimize',
                        accelerator: 'CmdOrCtrl+M',
                        role: 'minimize'
                    },
                    {
                        label: 'Close',
                        accelerator: 'CmdOrCtrl+W',
                        role: 'close'
                    }
                ]
            },
            {
                label: 'Help',
                role: 'help',
                submenu: [
                    {
                        label: 'Learn More',
                        click: function() {
                            require('electron').shell.openExternal('https://github.com/muffinista/before-dawn');
                        }
                    }
                ]
            }
        ];

        if (process.platform == 'darwin') {
            var name = require('electron').app.getName();
            menuTemplate.unshift({
                label: name,
                submenu: [
                    {
                        label: 'About ' + name,
                        role: 'about'
                    },
                    {
                        type: 'separator'
                    },
                    {
                        label: 'Services',
                        role: 'services',
                        submenu: []
                    },
                    {
                        type: 'separator'
                    },
                    {
                        label: 'Hide ' + name,
                        accelerator: 'Command+H',
                        role: 'hide'
                    },
                    {
                        label: 'Hide Others',
                        accelerator: 'Command+Alt+H',
                        role: 'hideothers'
                    },
                    {
                        label: 'Show All',
                        role: 'unhide'
                    },
                    {
                        type: 'separator'
                    },
                    {
                        label: 'Quit',
                        accelerator: 'Command+Q',
                        click: function() { app.quit(); }
                    }
                ]
            });
        }

        var menu = Menu.buildFromTemplate(menuTemplate);
        Menu.setApplicationMenu(menu);
        
        w.loadURL(prefsUrl);

        if ( typeof(app.dock) !== "undefined" ) {
            app.dock.show();
        }

        if ( debugMode === true ) {
            w.webContents.openDevTools();
        }

        w.on('closed', function() {
            w = null;
            global.savers.reload();
            if ( typeof(app.dock) !== "undefined" ) {
                app.dock.hide();
            }
        });
    });
};

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

var runScreenSaver = function() {
    var electronScreen = electron.screen;
    var displays = [];
    var saver = global.savers.getCurrentData();
    var globalJSCode = fs.readFileSync( path.join(__dirname, 'global-js-handlers.js'), 'ascii');

    // @todo maybe add an option to only run on a single display?

    // limit to a single screen when debugging
    if ( debugMode === true ) {
        displays = [
            electronScreen.getPrimaryDisplay()
        ];
        if ( typeof(app.dock) !== "undefined" ) {
            app.dock.show();
        }
    }
    else {
        displays = electronScreen.getAllDisplays();
    }


    screenshot(screenshot_file, function(error, complete) {
        for ( var i in displays ) {
            var s = displays[i];
            var size = s.bounds;
            var url_opts = { 
                width: size.width,
                height: size.height,
                platform: process.platform
            };
            
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
            
            if ( error ) {
                console.log("Screenshot failed", error);
            }
            else {
                url_opts.screenshot = encodeURIComponent("file://" + screenshot_file);
            }
            
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

        } // for
    });

    isActive = true;
};

var shouldLockScreen = function() {
    return ( savers.getLock() === true );
};

/**
 * lock the screen when the saver deactivates. currently this only works on OSX (and maybe not even there)
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

var stopScreenSaver = function() {
    console.log("received stopScreenSaver call");

    if ( saverWindows.length <= 0 ) {
        return;
    }

    if ( debugMode === true ) {
        return;
    }

    if ( shouldLockScreen() ) {
        doLockScreen();
    }

    for ( var s in saverWindows ) {
        console.log("close", s);
        saverWindows[s].close();
    }

    saverWindows = [];
};


var shouldQuit = app.makeSingleInstance(function(commandLine, workingDirectory) {
    return true;
});

if (shouldQuit) {
    app.quit();
}



//
// listen for a message from global.js that we should stop running the screensaver
//
ipcMain.on('asynchronous-message', function(event, arg) {
    if ( arg === "stopScreenSaver" ) {
        stopScreenSaver();
    }
});

// seems like we need to catch this event to keep OSX from exiting app after screensaver runs?
app.on('window-all-closed', function() {
    console.log("window-all-closed");
});


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function() {  
    var paused = false;

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

    appIcon = new Tray(__dirname + '/assets/icon.png');
    appIcon.setToolTip(global.APP_NAME);
    appIcon.setContextMenu(trayMenu); 

    var lastIdle = 0;
    var checkIdle = function() {
        var idle, waitTime;

        if ( paused === true || isActive === true ) {
            return;
        }

        waitTime = savers.getDelay() * 60000;
        if ( waitTime <= 0 ) {
            return;
        }
        
        idle = idler.getIdleTime();
         if ( idle > waitTime ) {
            runScreenSaver();
        }
        
        lastIdle = idle;
    };
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


global.savers.init(global.basePath, function() {
    configLoaded = true;
    openPrefsOnFirstLoad();
});

