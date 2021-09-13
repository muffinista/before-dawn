#!/usr/bin/env node

"use strict";

const path = require("path");

const { _electron: electron } = require("playwright");
const appPath = require("electron");

const helpers = require("../test/helpers.js");

let shim;

const SCREENSAVER = "Screen Glitcher";

const callIpc = async(method, opts={}) => {
  await shim.fill("#ipc", method);
  await shim.fill("#ipcopts", JSON.stringify(opts));
  await shim.click("text=go");
};

async function main() {
  let env = {
    CONFIG_DIR:  "/Users/colin/Library/Application Support/Before Dawn",
    BEFORE_DAWN_DIR:  "/Users/colin/Library/Application Support/Before Dawn",
    TEST_MODE: true,
    QUIET_MODE: true
  };
  
  let app = await electron.launch({
    path: appPath,
    args: [path.join(__dirname, "..", "output/main.js")],
    env: env
  });
  
  // wait for the first window (our test shim) to open, and
  // hang onto it for later use
  shim = await app.firstWindow();

  await callIpc("open-window prefs");
  let window = await helpers.waitFor(app, "prefs");
  await window.click(`text=${SCREENSAVER}`);
  await helpers.sleep(1000);
  await window.screenshot({ path: path.join(__dirname, "..", "assets", "prefs.png") });

  await window.click("button.settings");
  let settings = await helpers.waitFor(app, "settings");
  await helpers.sleep(1000);
  await settings.screenshot({ path: path.join(__dirname, "..", "assets", "settings.png") });

  await callIpc("close-window settings");

  await window.click("button.create");
  let create = await helpers.waitFor(app, "new");
  await helpers.sleep(1000);
  await create.screenshot({ path: path.join(__dirname, "..", "assets", "create-screensaver.png") });
  await create.click("button.cancel");

  var saversDir = helpers.getTempDir();
  const saverJSON = helpers.addSaver(saversDir, "saver-one", "saver.json");

  await callIpc("open-window editor", {
    screenshot: "file://" + path.join(__dirname, "../fixtures/screenshot.png"),
    src: saverJSON
  });

  let editor = await helpers.waitFor(app, "editor");
  await helpers.sleep(1000);
  await editor.screenshot({ path: path.join(__dirname, "..", "assets", "editor.png"), fullPage: true });

  app.close();
}

main().catch(e => console.error(e));