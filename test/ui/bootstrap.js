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
});
