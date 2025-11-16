"use strict";

import * as main from "./index.js";

import * as path from "path";
import { 
  nativeImage, 
  nativeTheme,
  shell 
} from "electron";



var openUrl = (url) => {
  try {
    shell.openExternal(url);
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
export const buildMenuTemplate = function(a) {
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
    var name = app.name;
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
export const trayMenuTemplate = function() {
  return [
    {
      label: "Run Now",
      click: function() {
        setTimeout(main.setStateToRunning, 1000);
      }
    },
    {
      label: "Disable",
      click: function() {
        main.setStateToPaused();
        updateTrayIcon();
        main.getTrayMenu().items[1].visible = false;
        main.getTrayMenu().items[2].visible = true;
        main.updateTrayMenu();
      }
    },
    {
      label: "Enable",
      click: function() { 
        main.resetState();
        updateTrayIcon();
        main.getTrayMenu().items[1].visible = true;
        main.getTrayMenu().items[2].visible = false;
        main.updateTrayMenu();
      },
      visible: false
    },
    {
      label: "Update Available!",
      click: function() { 
        shell.openExternal(global.PACKAGE_DOWNLOAD_URL);
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
export const getIcons = function() {
  const useDarkIcon = !nativeTheme.shouldUseDarkColorsForSystemIntegratedUI;
  const modifier = useDarkIcon ? '-dark' : ''; 
  const icons = {
    "win32" : {
      active: path.join(main.getAssetsDir() , "icon.ico"),
      paused: path.join(main.getAssetsDir(), "icon-paused.ico")
    },
    "default": {
      active: path.join(main.getAssetsDir() , `iconTemplate${modifier}.png`),
      paused: path.join(main.getAssetsDir() , `icon-pausedTemplate${modifier}.png`)
    }
  };
  
  if ( icons[process.platform] ) {
    return icons[process.platform];
  }

  return icons.default;
};

export const trayIconImage = function() {
  var icons = getIcons();
  let stateManager = main.getStateManager();

  let iconPath;
  if ( stateManager.currentState === stateManager.STATES.STATE_PAUSED ) {
    iconPath = icons.paused;

  }
  else {
    iconPath = icons.active;
  }

  main.log.info(`use icon ${iconPath}`);
  return nativeImage.createFromPath(iconPath);
};

/**
 * update tray icon to match our current state
 */
var updateTrayIcon = function() {
  let appIcon = main.getAppIcon();

  const iconImage = trayIconImage();
  if ( !iconImage.isEmpty() ) {
    appIcon.setImage(iconImage);
  }
};
