/* eslint-disable mocha/no-setup-in-describe */
"use strict";

import assert from 'assert';
import path from "path";
import fs from "fs-extra";
import * as tmp from "tmp";
import * as helpers from "../helpers.js";

import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("bootstrap", function() {
  const saverZipSource = path.join(__dirname, "..", "fixtures", "test-savers.zip");
  const saverData = path.join(__dirname, "..", "fixtures", "test-savers.json");

  let configDest;
  var workingDir;
  let app;
  let saverZip;

  helpers.setupTest(this);

  beforeEach(function() {
    saverZip =  path.join(tmp.dirSync().name, "test-savers.zip");
    fs.copyFileSync(saverZipSource, saverZip);
  
    workingDir = helpers.getTempDir();
    configDest = path.join(workingDir, "config.json");  
  });


  describe("without config", function() {
    beforeEach(async function() {
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

  describe("with invalid config", function() {
    beforeEach(async function() {
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
