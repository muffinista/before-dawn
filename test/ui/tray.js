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

  // before(function() {
  //   if ( process.env.CI) {
  //     // eslint-disable-next-line no-console
  //     console.log("Cowardly skipping test in CI");
  //     this.skip();
  //   }
  // });

  /**
   * 
   * @param {string} klass class name of button to click
   * @param {string} title title of window we expect to get
   */
  const sendIpcAndExpect = async function(cmd, title) {
    await helpers.callIpc(app, cmd);
    try {
      await helpers.waitForWindow(app, title);
      return true;
    }
    catch(e) {
      console.log(e);
      return false;
    }
  };

  describe("run now", function() {
   it("opens screensaver", async function() {
    await helpers.callIpc(app, "run-screensaver");
    await helpers.waitForText(app, "#currentState", "running");
   });
  });

  describe("preferences", function() {
    it("opens prefs window", async function() {
      assert(await sendIpcAndExpect("open-window prefs", "Before Dawn: Preferences"));
    });
  });

  describe("about", function() {
    it("opens about window", async function() {
      assert(await sendIpcAndExpect("open-window about", "Before Dawn: About"));
    });
  });

  describe("enable/disable", function() {
    before(function() {
      if ( process.platform === "win32" ) {
        // eslint-disable-next-line no-console
        console.log("skipping on win32");
        this.skip();
      }
    });

    it("toggles app status", async function() {
      await helpers.waitForText(app, "body", "idle");

      await helpers.callIpc(app, "pause");
      await helpers.waitForText(app, "body", "paused");

      await helpers.callIpc(app, "enable");
      await helpers.waitForText(app, "body", "idle");
    });
  });
});
