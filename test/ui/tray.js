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
  //   if ( process.platform === "win32" ) {
  //     // eslint-disable-next-line no-console
  //     console.log("skipping on win32");
  //     this.skip();
  //   }
  // });

  before(function() {
    if ( process.env.CI) {
      // eslint-disable-next-line no-console
      console.log("Cowardly skipping test in CI");
      this.skip();
    }
  });


  const clickAndExpect = async function(klass, title) {
    //await helpers.waitForWindow(app, "test shim");
    const el = await app.client.$(`button.${klass}`);
    try {
      el.click();
      await helpers.waitForWindow(app, title);
      return true;
    }
    catch(e) {
      console.log(e);
      return false;
    }
  };
  
  describe("run now", function() {
//    it("opens screensaver", async function() {
//      assert(await clickAndExpect("RunNow", "screensaver"));
//    });
  });

  describe("preferences", function() {
    it("opens prefs window", async function() {
      assert(await clickAndExpect("Preferences", "Before Dawn: Preferences"));
    });
  });

  describe("about", function() {
    it("opens about window", async function() {
      assert(await clickAndExpect("Preferences", "Before Dawn: About"));
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
      await helpers.click(app, "button.Disable");
      await helpers.sleep(1000);
      await helpers.waitForText(app, "body", "paused");
      await helpers.click(app, "button.Enable");
      await helpers.sleep(1000);
      await helpers.waitForText(app, "body", "idle");
    });
  });
});
