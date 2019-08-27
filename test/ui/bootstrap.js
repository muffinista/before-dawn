"use strict";

const assert = require("assert");
const fs = require("fs-extra");
const path = require("path");

const helpers = require("../helpers.js");

describe("bootstrap", function() {
  const prefsWindowTitle = "Before Dawn: Preferences";
  const saverZip = path.join(__dirname, "..", "fixtures", "test-savers.zip");
  const saverData = path.join(__dirname, "..", "fixtures", "test-savers.json");

  let configDest;
  var workingDir;
  let app;

  var bootApp = function() {
    app = helpers.application(workingDir, false, saverZip, saverData);  
    return app.start().
      then(() => helpers.waitUntilBooted(app));
  };

  helpers.setupTest(this);

  beforeEach(() => {
    workingDir = helpers.getTempDir();
    configDest = path.join(workingDir, "config.json");  
    app = helpers.application(workingDir, false, saverZip, saverData);
  });

  afterEach(() => {
    return helpers.stopApp(app);
  });


  describe("without config", () => {
    beforeEach(() => {
     assert(!fs.existsSync(configDest));
      return app.start().
        then(() => helpers.waitUntilBooted(app));
    });

    it("creates config file and shows prefs", function() {
      return helpers.waitForWindow(app, prefsWindowTitle).
        then(() => { assert(fs.existsSync(configDest)); });
    });
  });

  describe("with up to date config", () => {
    beforeEach(() => {
      helpers.specifyConfig(workingDir, "config");
      helpers.setConfigValue(workingDir, "sourceRepo", "foo/bar");
      helpers.setConfigValue(workingDir, "sourceUpdatedAt", new Date(0));
    });

    describe("and a valid screenaver", () => {
      beforeEach(() => {
        let saversDir = path.join(workingDir, "savers");
        let saverJSONFile = helpers.addSaver(saversDir, "saver");
        helpers.setConfigValue(workingDir, "saver", saverJSONFile);
        return bootApp();
      });

      it("does not show prefs", function() {
        return helpers.waitForWindow(app, prefsWindowTitle, true).
          then((res) => {
            assert.equal(-1, res);
          });
      });
    });

    describe("and an invalid screenaver", () => {
      beforeEach(() => {
        let saversDir = path.join(workingDir, "savers");
        helpers.addSaver(saversDir, "saver");
        helpers.setConfigValue(workingDir, "saver", "i-dont-exist");
        return bootApp();
      });

      it("shows prefs", function() {
        return helpers.waitForWindow(app, prefsWindowTitle);
      });
    });
  });


  describe("with invalid config", () => {
    beforeEach(() => {
      helpers.specifyConfig(workingDir, "bad-config");
      return bootApp();
    });
    
    it("re-creates config file", function(done) {
      assert(fs.existsSync(configDest));
      let data = JSON.parse(fs.readFileSync(configDest));
      assert.equal("muffinista/before-dawn-screensavers", data.sourceRepo);
      done();
    });  

    it("shows prefs", function() {
      return helpers.waitForWindow(app, prefsWindowTitle);
    });
  });  

});
