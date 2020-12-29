"use strict";

const assert = require("assert");
const helpers = require("../helpers.js");

describe("tray", function() {
  var workingDir;
  let saversDir;
  let app;

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

    app = helpers.application(workingDir);
    await app.start();
    await helpers.waitUntilBooted(app, true);
    await helpers.waitForWindow(app, "test shim");
  });

	afterEach(async function() {
    if (this.currentTest.state === "failed") {
      helpers.outputLogs(app);
    }
    await helpers.stopApp(app);
	});

  describe("run now", function() {
   it("opens screensaver", async function() {
    await helpers.click(app, "button.RunNow");
    await helpers.waitForText(app, "#currentState", "running");
   });
  });

  describe("preferences", function() {
    it("opens prefs window", async function() {
      await helpers.click(app, "button.Preferences");
      assert(await helpers.waitForWindow(app, "Before Dawn: Preferences"));
    });
  });

  describe("about", function() {
    it("opens about window", async function() {
      await helpers.click(app, "button.AboutBeforeDawn");
      assert(await helpers.waitForWindow(app, "Before Dawn: About"));
    });
  });

  describe("enable/disable", function() {
    it("toggles app status", async function() {
      await helpers.waitForText(app, "body", "idle");


      await helpers.click(app, "button.Disable");
      await helpers.waitForText(app, "body", "paused");

      await helpers.click(app, "button.Enable");
      await helpers.waitForText(app, "body", "idle");
    });
  });
});
