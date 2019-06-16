#!/usr/bin/env node

"use strict";

const path = require("path");
const fs = require("fs-extra");
const fsPromises = require('fs').promises;

const Application = require("spectron").Application;
const appPath = require("electron");
const helpers = require("../test/helpers.js");

let env = {
//  BEFORE_DAWN_DIR: workingDir,
  TEST_MODE: true,
  //QUIET_MODE: true
};

let app = new Application({
  path: appPath,
  args: [path.join(__dirname, "..", "output", "main.js")],
  env: env
});

const SCREENSAVER = 'Emoji Starfield';
app.start().
  then(() => app.client.waitUntilWindowLoaded() ).
  then(() => app.electron.ipcRenderer.send("open-prefs")).
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
  then(() => app.client.click("button.settings")).
  then(() => helpers.waitForWindow(app, "Before Dawn: Settings") ).
  then(() => app.browserWindow.capturePage()).
  then((imageBuffer) => fsPromises.writeFile(path.join(__dirname, "..", "assets", "settings.png"), imageBuffer)).
  then(() => app.electron.ipcRenderer.send("close-settings")).
  then(() => helpers.waitForWindow(app, "Before Dawn: Preferences") ).
  then(() => app.client.click("button.create")).
  then(() => helpers.waitForWindow(app, "Before Dawn: Create Screensaver!") ).
  then(() => helpers.sleep(200) ).
  then(() => app.browserWindow.capturePage()).
  then((imageBuffer) => fsPromises.writeFile(path.join(__dirname, "..", "assets", "create-screensaver.png"), imageBuffer)).
  then(() => helpers.sleep(200) ).
  then(() => app.client.click("button.cancel")).
  then(() => helpers.waitForWindow(app, "Before Dawn: Preferences") ).
  then(() => app.client.click("a.edit")).
  then(() => helpers.waitForWindow(app, "Before Dawn: Editor") ).
  then(() => helpers.sleep(1200) ).
  then(() => app.browserWindow.capturePage()).
  then((imageBuffer) => fsPromises.writeFile(path.join(__dirname, "..", "assets", "editor.png"), imageBuffer)).
  then(() => app.stop() );
