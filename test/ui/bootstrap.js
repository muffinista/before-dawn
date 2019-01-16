"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const helpers = require("./setup.js");
var workingDir = helpers.getTempDir();
const app = helpers.application(workingDir);

describe("bootstrap", function() {
  helpers.setupTimeout(this);

	before(() => {
		return app.start().
      then(() => app.client.waitUntilWindowLoaded() );
	});

	after(() => {
    return helpers.stopApp(app);
	});

  it("creates config file", function(done) {
    let configDest = path.join(workingDir, "config.json");
    assert(fs.existsSync(configDest));
    done();
  });
});
