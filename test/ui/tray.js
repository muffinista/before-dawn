"use strict";

const helpers = require("../helpers.js");
const path = require("path");

describe("tray", function() {
  var workingDir;
  let app;
  
  helpers.setupTimeout(this);

  // retry all tests in this suite up to 3 times
  helpers.setupRetries(this);

  beforeEach(function() {
    workingDir = helpers.getTempDir();
    let saversDir = path.join(workingDir, "savers");
    let saverJSONFile = helpers.addSaver(saversDir, "saver");

    helpers.specifyConfig(workingDir, "config");
    helpers.setConfigValue(workingDir, "sourceRepo", "foo/bar");
    helpers.setConfigValue(workingDir, "sourceUpdatedAt", new Date(0));
    helpers.setConfigValue(workingDir, "saver", saverJSONFile);

    app = helpers.application(workingDir);  
    return app.start().
      then(() => helpers.waitUntilBooted(app, true));
  });

  afterEach(function() {
    return helpers.stopApp(app);
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
