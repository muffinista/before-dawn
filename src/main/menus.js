"use strict";

const main = require("./index.js");

const icons = {
  "win32" : {
    active: __dirname + "/assets/icon.ico",
    paused: __dirname + "/assets/icon-paused.ico"
  },
  "default": {
    active: __dirname + "/assets/iconTemplate.png",
    paused: __dirname + "/assets/icon-pausedTemplate.png"
  }
};

var openUrl = (url) => {
  try {
    require("electron").shell.openExternal(url);
  }
  catch(e) {
    main.log.info(e);
  }
};

/**
 * open the help section in a browser
 */
var openHelpUrl = () => { openUrl(global.HELP_URL); };


/**
 * open the github issues url in a browser
 */
var openIssuesUrl = () => { openUrl(global.ISSUES_URL); };

/**
 * open the website for the app
 */
var openHomepage = () => { openUrl("https://github.com/muffinista/before-dawn"); };

/**
 * Build the menubar for the app
 * 
 * @param {Application} a the main app instance
 */
var buildMenuTemplate = function(a) {
  var app = a;
  var base = [
    {
      label: "File",
      submenu: [
        {
          label: "Add New Screensaver",
          accelerator: "CmdOrCtrl+N",
          click: function() {
            main.addNewSaver();
          }
        },
      ]
    },

    {
      label: "Edit",
      submenu: [
        {
          label: "Undo",
          accelerator: "CmdOrCtrl+Z",
          role: "undo"
        },
        {
          label: "Redo",
          accelerator: "Shift+CmdOrCtrl+Z",
          role: "redo"
        },
        {
          type: "separator"
        },
        {
          label: "Cut",
          accelerator: "CmdOrCtrl+X",
          role: "cut"
        },
        {
          label: "Copy",
          accelerator: "CmdOrCtrl+C",
          role: "copy"
        },
        {
          label: "Paste",
          accelerator: "CmdOrCtrl+V",
          role: "paste"
        },
        {
          label: "Select All",
          accelerator: "CmdOrCtrl+A",
          role: "selectall"
        }
      ]
    },
    {
      label: "View",
      submenu: [
        {
          label: "Reload",
          accelerator: "CmdOrCtrl+R",
          click: function(item, focusedWindow) {
            if (focusedWindow) {
              focusedWindow.reload();
            }
          }
        },
        {
          label: "Toggle Developer Tools",
          accelerator: (function() {
            if (process.platform == "darwin") {
              return "Alt+Command+I";
            }
            else {
              return "Ctrl+Shift+I";
            }
          })(),
          click: function(item, focusedWindow) {
            if (focusedWindow) {
              focusedWindow.toggleDevTools();
            }
          }
        }
      ]
    },
    {
      label: "Window",
      role: "window",
      submenu: [
        {
          label: "Minimize",
          accelerator: "CmdOrCtrl+M",
          role: "minimize"
        },
        {
          label: "Close",
          accelerator: "CmdOrCtrl+W",
          role: "close"
        }
      ]
    },
    {
      label: "Help",
      role: "help",
      submenu: [
        {
          label: "Learn More",
          click: openHomepage
        },
        {
          label: "Help",
          click: openHelpUrl
        }
      ]
    }
  ];


  if (process.platform == "darwin") {
    var name = app.getName();
    base.unshift({
      label: name,
      submenu: [
        {
          label: "About " + name,
          role: "about"
        },
        {
          type: "separator"
        },
        {
          label: "Services",
          role: "services",
          submenu: []
        },
        {
          type: "separator"
        },
        {
          label: "Hide " + name,
          accelerator: "Command+H",
          role: "hide"
        },
        {
          label: "Hide Others",
          accelerator: "Command+Alt+H",
          role: "hideothers"
        },
        {
          label: "Show All",
          role: "unhide"
        },
        {
          type: "separator"
        },
        {
          label: "Quit",
          accelerator: "Command+Q",
          click: main.quitApp
        }
      ]
    });
  }


  return base;
};

/**
 * build the tray menu template for the app
 */
var trayMenuTemplate = function() {
  return [
    {
      label: "Run Now",
      click: function() {
        setTimeout(main.setStateToRunning, 50);
      }
    },
    {
      label: "Disable",
      click: function() {
        let stateManager = main.getStateManager();

        stateManager.pause();
        updateTrayIcon();
        main.trayMenu.items[1].visible = false;
        main.trayMenu.items[2].visible = true;
      }
    },
    {
      label: "Enable",
      click: function() { 
        let stateManager = main.getStateManager();
        stateManager.reset();

        updateTrayIcon();
        main.trayMenu.items[1].visible = true;
        main.trayMenu.items[2].visible = false;
      },
      visible: false
    },
    {
      label: "Update Available!",
      click: function() { 
        require("electron").shell.openExternal("https://github.com/" + global.APP_REPO + "/releases/latest");
      },
      visible: (global.NEW_RELEASE_AVAILABLE === true)
    },
    {
      label: "Preferences",
      click: () => {
        main.openPrefsWindow();
      }
    },
    {
      label: "About " + global.APP_NAME,
      click: () => {
        main.openAboutWindow();
      }
    },
    {
      label: "Help",
      click: () => {
        openHelpUrl();
      }
    },
    {
      label: "Report a Bug",
      click: () => {
        openIssuesUrl();
      }
    },
    {
      label: "Quit",
      click: () => {
        main.quitApp();
      }
    }
  ];
};


/**
 * get icons for the current platform
 */
var getIcons = function() {
  if ( icons[process.platform] ) {
    return icons[process.platform];
  }

  return icons.default;
};

/**
 * update tray icon to match our current state
 */
var updateTrayIcon = function() {
  var icons = getIcons();
  let stateManager = main.getStateManager();
  let appIcon = main.getAppIcon();

  if ( stateManager.currentState === stateManager.STATES.STATE_PAUSED ) {
    appIcon.setImage(icons.paused);
  }
  else {
    appIcon.setImage(icons.active);
  }
};


exports.getIcons = getIcons;
exports.buildMenuTemplate = buildMenuTemplate;
exports.trayMenuTemplate = trayMenuTemplate;