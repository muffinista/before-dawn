"use strict";

const assert = require("assert");
const fs = require("fs-extra");
const path = require("path");

const helpers = require("../helpers.js")
var workingDir;
let app;

describe("bootstrap", function() {
  let configDest;


  helpers.setupTimeout(this);

  describe("without config", () => {
    before(() => {
      workingDir = helpers.getTempDir();
      configDest = path.join(workingDir, "config.json");  
      assert(!fs.existsSync(configDest));

      app = helpers.application(workingDir);
  
      return app.start().
        then(() => app.client.waitUntilWindowLoaded() );
    });
  
    after(() => {
      return helpers.stopApp(app);
    });
  
    it("creates config file", function(done) {
      assert(fs.existsSync(configDest));
      done();
    });  
  });

  describe("with invalid config", () => {
    before(() => {
      workingDir = helpers.getTempDir();
      configDest = path.join(workingDir, "config.json");  
      fs.copySync(
        path.join(__dirname, "../fixtures/bad-config.json"),
        configDest
      );
  
      app = helpers.application(workingDir);

      return app.start().
        then(() => app.client.waitUntilWindowLoaded() );
    });
  
    after(() => {
      return helpers.stopApp(app);
    });
  
    it("re-creates config file", function(done) {
      assert(fs.existsSync(configDest));
      let data = JSON.parse(fs.readFileSync(configDest));
      assert.equal('muffinista/before-dawn-screensavers', data.sourceRepo);
      done();
    });  
  });
});
