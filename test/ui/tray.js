"use strict";

const assert = require("assert");
const helpers = require("../helpers.js");
const path = require("path");

describe("tray", function() {
  var workingDir;
  let app;
  let windowWaitDelay = 1000;

  if ( process.env.CI ) {
    windowWaitDelay = 5000;
  }
  
  helpers.setupTimeout(this);

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
      then(() => helpers.waitUntilBooted(app));
  });

  afterEach(function() {
    return helpers.stopApp(app);
  });

  describe("run now", function() {
    it("opens screensaver", function() {
      return helpers.getWindowByTitle(app, "test shim").
        then(() => app.client.click("button.RunNow")).
        then(() => helpers.waitForWindow(app, "screensaver"));
    });
  });

  describe("preferences", function() {
    it("opens prefs window", function() {
      return helpers.getWindowByTitle(app, "test shim").
        then(() => app.client.click("button.Preferences")).
        then(() => helpers.getWindowByTitle(app, "Before Dawn: Preferences")).
        then(() => app.client.getTitle()).
        then((res) => {
          assert.equal("Before Dawn: Preferences", res);
        }); 
    });
  });

  describe("about", function() {
    it("opens about window", function() {
      return helpers.getWindowByTitle(app, "test shim").
        then(() => app.client.click("button.AboutBeforeDawn")).
        then(() => helpers.getWindowByTitle(app, "Before Dawn: About!")).
        then(() => app.client.getTitle()).
        then((res) => {
          assert.equal("Before Dawn: About!", res);
        }); 

    });    
  });
});
