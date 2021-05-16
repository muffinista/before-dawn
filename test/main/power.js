"use strict";

const assert = require("assert");
const path = require("path");
const fs = require("fs");

const Power = require("../../src/main/power.js");

describe("Power", function() {
  describe("charging", () => {
    const loadFixture = (platform, type) => {
      const f = path.join(__dirname, `../fixtures/power/${platform}-${type}.txt`);
      return fs.readFileSync(f).toString();
    };

    let power;

    describe("unhandled platform", () => {
      it("works", async () => {
        const power = new Power("beos");
        assert(await power.charging());
      });
    });

    describe("linux", () => {
      let platform;
      beforeEach(() => {
        platform = "linux";
        power = new Power(platform);
      });

      it("is correct when charged", async () => {
        assert(await power.charging(loadFixture(platform, "charged")));
      });

      it("is correct when charging", async () => {
        assert(await power.charging(loadFixture(platform, "charging")));
      });

      it("is correct when discharging", async () => {
        assert.strictEqual(false, await power.charging(loadFixture(platform, "discharging")));
      });
    });

    ["darwin", "win32"].forEach((platform) => {
      describe(platform, () => {
        beforeEach(() => {
          const method = () => {
            return false;
          };

          power = new Power(platform, method);
        });

        it("returns the reverse of the method", async () => {
          assert.strictEqual(true, await power.charging());
        });
 
      });
    });
  });
});

