"use strict";

const assert = require("assert");
const helpers = require("./setup.js");
const packageJSON = require("../../package.json");

var workingDir;
let app;

describe("About", function() {
	beforeEach(() => {
    workingDir = helpers.getTempDir();
    helpers.setupConfig(workingDir);

    app = helpers.application(workingDir);
    helpers.setupTimeout(this);
    return app.start().
               then(() => app.client.waitUntilWindowLoaded() ).
			         then(() => app.electron.ipcRenderer.send("open-about")).
               then(() => {
                app.client.getWindowCount().should.eventually.equal(2)
                }).
                then(() => app.client.windowByIndex(2));
	});

	afterEach(() => {
    return helpers.stopApp(app);
	});

  it("has some text and current version number", function() {
    return app.client.waitUntilWindowLoaded().
        getText("body").
        then((res) => {
          assert(res.lastIndexOf("// screensaver fun //") !== -1);
          assert(res.lastIndexOf(packageJSON.version) !== -1);
        });
  });
});
