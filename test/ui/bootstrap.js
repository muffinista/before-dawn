"use strict";

const assert = require("assert");
const fs = require("fs-extra");
const path = require("path");

const helpers = require("../helpers.js");

describe("bootstrap", function() {
  const saverZip = path.join(__dirname, "..", "fixtures", "test-savers.zip");
  const saverData = path.join(__dirname, "..", "fixtures", "test-savers.json");

  let configDest;
  var workingDir;
  let app;

  helpers.setupTest(this);
 

  beforeEach(() => {
    workingDir = helpers.getTempDir();
    configDest = path.join(workingDir, "config.json");  
  });


  describe("without config", () => {
    beforeEach(async () => {
      assert(!fs.existsSync(configDest));
      app = await helpers.application(workingDir, false, saverZip, saverData);
    });

    it("creates config file and shows prefs", async function() {
      await helpers.waitFor(app, "prefs");
      assert(fs.existsSync(configDest));

      // the test was crashing without waiting here a bit
      await helpers.sleep(1000);
    });
  });

  describe("with invalid config", () => {
    beforeEach(async () => {
      const dest = path.join(workingDir, "config.json");
      fs.copySync(
        path.join(__dirname, "..", "fixtures", "bad-config.json"),
        dest
      );

      app = await helpers.application(workingDir, true);
    });

    it("creates config file and shows prefs", async function() {
      await helpers.waitFor(app, "prefs");
      assert(fs.existsSync(configDest));

      const data = JSON.parse(fs.readFileSync(configDest));
      assert.deepStrictEqual(5, data.delay);
    });
  });
});
