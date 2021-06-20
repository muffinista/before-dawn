#!/usr/bin/env node

"use strict";

const path = require("path");
const fs = require("fs-extra");
const fsPromises = require("fs").promises;

const Application = require("spectron").Application;
const appPath = require("electron");
const helpers = require("../test/helpers.js");

//const workingDir = "";

let env = {
  // BEFORE_DAWN_DIR: workingDir,
  CONFIG_DIR:  "/Users/colin/Library/Application Support/Before Dawn",
  BEFORE_DAWN_DIR:  "/Users/colin/Library/Application Support/Before Dawn",
  TEST_MODE: true
};

let app = new Application({
  path: appPath,
  args: [path.join(__dirname, "..", "output", "main.js")],
  env: env
});

const SCREENSAVER = "My Amazing Screensaver";
app.start().
  then(() => app.client.waitUntilWindowLoaded() ).
  then(() => app.electron.ipcRenderer.send("open-window", "prefs")).
  then(() => helpers.waitForWindow(app, "Before Dawn: Preferences") ).
  then(() => app.webContents
  .executeJavaScript(`document.querySelector("[data-name='${SCREENSAVER}']").scrollIntoView()`)).
  then(() => app.webContents.executeJavaScript(`document.querySelector("[type='radio'][data-name='${SCREENSAVER}']").click()`)).
  then(() => helpers.sleep(1000) ).
  then(() => 
    app.browserWindow.capturePage().then(function (imageBuffer) {
      fs.writeFileSync(path.join(__dirname, "..", "assets", "prefs.png"), imageBuffer);
    })
  ).
  then(() => app.webContents.executeJavaScript("document.querySelector('button.settings').click()")).
  then(() => helpers.waitForWindow(app, "Before Dawn: Settings") ).
  then(() => app.browserWindow.capturePage()).
  then((imageBuffer) => fsPromises.writeFile(path.join(__dirname, "..", "assets", "settings.png"), imageBuffer)).
  then(() => app.electron.ipcRenderer.send("close-window", "settings")).
  then(() => helpers.waitForWindow(app, "Before Dawn: Preferences") ).
  then(() => app.webContents.executeJavaScript("document.querySelector('button.create').click()")).
  then(() => helpers.waitForWindow(app, "Before Dawn: Create Screensaver!") ).
  then(() => helpers.sleep(200) ).
  then(() => app.browserWindow.capturePage()).
  then((imageBuffer) => fsPromises.writeFile(path.join(__dirname, "..", "assets", "create-screensaver.png"), imageBuffer)).
  then(() => helpers.sleep(200) ).
  then(() => app.webContents.executeJavaScript("document.querySelector('button.cancel').click()")).
  then(() => helpers.waitForWindow(app, "Before Dawn: Preferences") ).
  then(() => app.webContents.executeJavaScript("document.querySelector('button.edit').click()")).
  then(() => helpers.waitForWindow(app, "Before Dawn: Editor") ).
  then(() => helpers.sleep(1200) ).
  then(() => app.browserWindow.capturePage()).
  then((imageBuffer) => fsPromises.writeFile(path.join(__dirname, "..", "assets", "editor.png"), imageBuffer)).
  then(() => app.stop() );
