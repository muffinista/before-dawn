"use strict";

const assert = require("assert");
const helpers = require("../helpers.js");
const path = require("path");

describe("tray", function() {
  var workingDir;
  let app;
  
  helpers.setupTimeout(this);

  beforeEach(() => {
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

  afterEach(() => {
    return helpers.stopApp(app);
  });

  // describe("disable/enable", () => {
  //   it("can disable", () => {
  //     helpers.getWindowByTitle(app, "Before Dawn: About!");
  //   })
  //   it("can enable", () => {
  //     helpers.getWindowByTitle(app, "Before Dawn: About!");
  //   })
  // });

  describe("run now", () => {
    it("opens screensaver", () => {
      return helpers.getWindowByTitle(app, "test shim").
        then(() => app.client.click("button.RunNow")).
        // short delay because we don't launch right away
        then(() => helpers.sleep(1000)).
        then(() => helpers.getWindowByTitle(app, "screensaver")).
        then(() => app.client.getTitle()).
        then((res) => {
          assert.equal("screensaver", res);
        }); 
    });
  });

  describe("preferences", () => {
    it("opens prefs window", () => {
      return helpers.getWindowByTitle(app, "test shim").
        then(() => app.client.click("button.Preferences")).
        then(() => helpers.getWindowByTitle(app, "Before Dawn: Preferences")).
        then(() => app.client.getTitle()).
        then((res) => {
          assert.equal("Before Dawn: Preferences", res);
        }); 
    });
  });

  describe("about", () => {
    it("opens about window", () => {
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
