#!/usr/bin/env node

"use strict";

const path = require("path");
const fs = require("fs-extra");
const Application = require("spectron").Application;
const appPath = require("electron");
const helpers = require("../test/helpers.js");

let env = {
//  BEFORE_DAWN_DIR: workingDir,
  TEST_MODE: true,
  QUIET_MODE: true
};

let app = new Application({
  path: appPath,
  args: [path.join(__dirname, "..", "output", "main.js")],
  env: env
});


app.start().
  then(() => helpers.sleep(200) ).
  then(() => app.client.waitUntilWindowLoaded() ).
  then(() => app.electron.ipcRenderer.send("open-prefs")).
  then(() => helpers.waitForWindow(app, "Before Dawn: Preferences") ).
  then(() => app.client.click("[type=radio][data-name='Emoji Starfield']")).
  then(() => helpers.sleep(2000) ).
  then(() => 
    app.browserWindow.capturePage().then(function (imageBuffer) {
      console.log("prefs");
      fs.writeFileSync(path.join(__dirname, "..", "assets", "prefs.png"), imageBuffer);
    })
  ).
  then(() => app.client.click("=Preferences")).
  then(() => helpers.sleep(200) ).
  then(() => 
    app.browserWindow.capturePage().then(function (imageBuffer) {
      console.log("prefs-settings");
      fs.writeFileSync(path.join(__dirname, "..", "assets", "prefs-settings.png"), imageBuffer);
    })
  ).
  then(() => app.client.click("=Advanced")).
  then(() => helpers.sleep(200) ).
  then(() => 
    app.browserWindow.capturePage().then(function (imageBuffer) {
      console.log("prefs-advanced");
      fs.writeFileSync(path.join(__dirname, "..", "assets", "prefs-advanced.png"), imageBuffer);
    })
  ).
  then(() => app.client.click("button.create")).
  then(() => helpers.waitForWindow(app, "Before Dawn: Create Screensaver!") ).
  then(() => helpers.sleep(200) ).
  then(() => 
    app.browserWindow.capturePage().then(function (imageBuffer) {
      console.log("create-screensaver");

      fs.writeFileSync(path.join(__dirname, "..", "assets", "create-screensaver.png"), imageBuffer);
    })
  ).
  then(() => helpers.sleep(1000) ).
  then(() => app.client.click("button.cancel")).
  then(() => helpers.waitForWindow(app, "Before Dawn: Preferences") ).
  then(() => app.client.click("=Screensavers")).
  then(() => helpers.sleep(200) ).
  then(() => app.client.click("a.edit[data-name='Emoji Starfield']")).
  then(() => helpers.waitForWindow(app, "Before Dawn: Editor") ).
  then(() => helpers.sleep(1200) ).
  then(() => 
    app.browserWindow.capturePage().then(function (imageBuffer) {
      console.log("editor");
      fs.writeFileSync(path.join(__dirname, "..", "assets", "editor.png"), imageBuffer);
    })
  ).
  then(() => app.client.click("=Description")).
  then(() => helpers.sleep(200) ).
//  then(() => app.browserWindow.setSize(800, 1300) ).
  then(() => 
    app.browserWindow.capturePage().then(function (imageBuffer) {
      console.log("editor-description");
      fs.writeFileSync(path.join(__dirname, "..", "assets", "editor-description.png"), imageBuffer);
    })
  ).
  then(() => app.client.click("=Options")).
  then(() => helpers.sleep(200) ).
  then(() => 
    app.browserWindow.capturePage().then(function (imageBuffer) {
      console.log("editor-options");
      fs.writeFileSync(path.join(__dirname, "..", "assets", "editor-options.png"), imageBuffer);
    })
  ).

  then(() => app.stop() );
