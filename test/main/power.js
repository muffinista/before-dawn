/* eslint-disable mocha/no-setup-in-describe */
"use strict";


import assert from 'assert';
import path from "path";
import fs from "fs-extra";

import Power from "../../src/main/power.js";


import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("Power", function() {
  describe("charging", function() {
    const loadFixture = (platform, type) => {
      const f = path.join(__dirname, `../fixtures/power/${platform}-${type}.txt`);
      return fs.readFileSync(f).toString();
    };

    let power;

    describe("unhandled platform", function() {
      it("works", async function() {
        const power = new Power({platform: "beos"});
        assert(await power.charging());
      });
    });

    describe("linux", function() {
      let platform;

      beforeEach(function() {
        platform = "linux";
        power = new Power(platform);
      });

      it("is correct when charged", async function() {
        assert(await power.charging(loadFixture(platform, "charged")));
      });

      it("is correct when charging", async function() {
        assert(await power.charging(loadFixture(platform, "charging")));
      });

      it("is correct when discharging", async function() {
        assert.strictEqual(false, await power.charging(loadFixture(platform, "discharging")));
      });
    });

    ["darwin", "win32"].forEach((platform) => {
      describe(platform, function() {
        beforeEach(function() {
          const method = () => {
            return false;
          };

          power = new Power({platform, method});
        });

        it("returns the reverse of the method", async function() {
          assert.strictEqual(true, await power.charging());
        });
 
      });
    });
  });
});

