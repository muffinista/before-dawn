"use strict";

const assert = require("assert");
const fs = require("fs-extra");
const path = require("path");

const helpers = require("../helpers.js");

describe("bootstrap", function() {
  let configDest;
  var workingDir;
  let app;
  
  var bootApp = function() {
    app = helpers.application(workingDir);  
    return app.start().
      then(() => helpers.waitUntilBooted(app));
  };

  helpers.setupTimeout(this);

  beforeEach(() => {
    workingDir = helpers.getTempDir();
    configDest = path.join(workingDir, "config.json");  
  });
  afterEach(() => {
    return helpers.stopApp(app);
  });


  describe("without config", () => {
    beforeEach(() => {
      assert(!fs.existsSync(configDest));
      return bootApp();
    });
    
    it("creates config file", function() {
      assert(fs.existsSync(configDest));
    });  

    it("shows prefs", function() {
      return helpers.waitForWindow(app, "Before Dawn: Preferences");
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
        return helpers.waitForWindow(app, "Before Dawn: Preferences", true).
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
        return helpers.waitForWindow(app, "Before Dawn: Preferences");
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
      return helpers.waitForWindow(app, "Before Dawn: Preferences");
    });
  });

  it("downloads package");
  
});
