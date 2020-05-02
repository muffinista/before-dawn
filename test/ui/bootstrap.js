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

  var bootApp = async function() {
    app = helpers.application(workingDir, false, saverZip, saverData);  
    await app.start();
    await helpers.waitUntilBooted(app);
  };

  helpers.setupTest(this);

  before(function() {
    if ( process.env.CI) {
      // eslint-disable-next-line no-console
      console.log("Cowardly skipping test in CI");
      this.skip();
    }
  });

  beforeEach(() => {
    workingDir = helpers.getTempDir();
    configDest = path.join(workingDir, "config.json");  
    app = helpers.application(workingDir, false, saverZip, saverData);
  });

	afterEach(async function() {
    if (this.currentTest.state === "failed") {
      helpers.outputLogs(app);
    }

    await helpers.stopApp(app);
	});


  describe("without config", () => {
    beforeEach(async () => {
      assert(!fs.existsSync(configDest));
      await app.start();
      await helpers.waitUntilBooted(app);
    });

    it("creates config file and shows prefs", async function() {
      await helpers.waitForWindow(app, prefsWindowTitle);
      assert(fs.existsSync(configDest));
    });
  });

  describe("with up to date config", () => {
    beforeEach(() => {
      helpers.setupConfig(workingDir, "config", {
        "firstLoad": false,
        "sourceRepo": "foo/bar",
        "sourceUpdatedAt": new Date(0)
      });
    });

    describe("and a valid screenaver", () => {
      beforeEach(async () => {
        let saversDir = path.join(workingDir, "savers");
        let saverJSONFile = helpers.addSaver(saversDir, "saver");
        helpers.setConfigValue(workingDir, "saver", saverJSONFile);
        await bootApp();
      });

      it("does not show prefs", async function() {
        const res = await helpers.waitForWindow(app, prefsWindowTitle, true);
        assert.equal(-1, res);
      });
    });

    describe("and an invalid screenaver", () => {
      beforeEach(async () => {
        let saversDir = path.join(workingDir, "savers");
        helpers.addSaver(saversDir, "saver");
        helpers.setConfigValue(workingDir, "saver", "i-dont-exist");
        await bootApp();
      });

      it("shows prefs", async function() {
        await helpers.waitForWindow(app, prefsWindowTitle);
      });
    });
  });


  describe("with invalid config", () => {
    beforeEach(async () => {
      helpers.specifyConfig(configDest, "bad-config");
      await bootApp();
    });
    
    it("re-creates config file", function() {
      assert(fs.existsSync(configDest));
      let data = JSON.parse(fs.readFileSync(configDest));
      assert.equal("muffinista/before-dawn-screensavers", data.sourceRepo);
    });  

    it("shows prefs", async function() {
      await helpers.waitForWindow(app, prefsWindowTitle);
    });
  });
});
