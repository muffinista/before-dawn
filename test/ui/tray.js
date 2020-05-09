"use strict";

const helpers = require("../helpers.js");

describe("tray", function() {
  var workingDir;
  let saversDir;
  let app;

  helpers.setupTest(this);

  beforeEach(function() {
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
    return app.start().
      then(() => helpers.waitUntilBooted(app, true));
  });

	afterEach(function() {
    if (this.currentTest.state === "failed") {
      helpers.outputLogs(app);
    }

    return helpers.stopApp(app);
	});

  before(function() {
    if ( process.platform === "win32" ) {
      // eslint-disable-next-line no-console
      console.log("skipping on win32");
      this.skip();
    }
  });

  describe("run now", function() {
    it("opens screensaver", function() {
      return helpers.waitForWindow(app, "test shim").
        then(() => app.client.click("button.RunNow")).
        then(() => helpers.waitForWindow(app, "screensaver"));
    });
  });

  describe("preferences", function() {
    it("opens prefs window", function() {
      return helpers.waitForWindow(app, "test shim").
        then(() => app.client.click("button.Preferences")).
        then(() => helpers.waitForWindow(app, "Before Dawn: Preferences") ); 
    });
  });

  describe("about", function() {
    it("opens about window", function() {
      return helpers.waitForWindow(app, "test shim").
        then(() => app.client.click("button.AboutBeforeDawn")).
        then(() => helpers.waitForWindow(app, "Before Dawn: About!") );
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

    it("toggles app status", function() {
      return helpers.waitForWindow(app, "test shim").
        then(() => app.client.waitUntilTextExists("body", "idle")).
        then(() => app.client.click("button.Disable")).
        then(() => {
          helpers.sleep(1000);
        }).
        then(() => app.client.waitUntilTextExists("body", "paused")).
        then(() => app.client.click("button.Enable")).
        then(() => {
          helpers.sleep(1000);
        }).
        then(() => app.client.waitUntilTextExists("body", "idle"));
    });
  });
});
