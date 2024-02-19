/* eslint-disable mocha/no-setup-in-describe */
"use strict";

import assert from 'assert';
import * as helpers from "../helpers.js";

describe("tray", function() {
  var workingDir;
  let saversDir;
  let app;
  let window;

  helpers.setupTest(this);

  beforeEach(async function() {
    workingDir = helpers.getTempDir();
    saversDir = helpers.getTempDir();
    let saverJSONFile = helpers.addSaver(saversDir, "saver");

    helpers.setupConfig(workingDir, "config", {
      "firstLoad": false,
      "sourceRepo": "",
      "localSource": saversDir,
      "saver": saverJSONFile 
    });

    app = await helpers.application(workingDir, true);
    await helpers.waitForWindow(app, 'test shim');

    window = await helpers.getWindowByTitle(app, 'test shim'); 
  });

  describe("run now", function() {
   it("opens screensaver", async function() {
    await window.click("button.RunNow");
    await helpers.waitForText(window, "#currentState", "running");
   });
  });

  describe("preferences", function() {
    it("opens prefs window", async function() {
      await window.click("button.Preferences");
      assert(await helpers.waitForWindow(app, "Before Dawn: Preferences"));
    });
  });

  describe("about", function() {
    it("opens about window", async function() {
      await window.click("button.AboutBeforeDawn");
      await helpers.waitForWindow(app, "Before Dawn: About!");
      assert(await helpers.getWindowByTitle(app, "Before Dawn: About!"));
    });
  });

  describe("enable/disable", function() {
    it("toggles app status", async function() {
      await helpers.waitForText(window, "body", "idle");


      await window.click("button.Disable");
      await helpers.waitForText(window, "body", "paused");

      await window.click("button.Enable");
      await helpers.waitForText(window, "body", "idle");
    });
  });
});
