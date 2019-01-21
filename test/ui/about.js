"use strict";

const assert = require("assert");
const helpers = require("../helpers.js")
const packageJSON = require("../../package.json");

var workingDir;
let app;

describe("About", function() {
  helpers.setupTimeout(this);
	beforeEach(() => {
    let windowCount = 0;
    workingDir = helpers.getTempDir();
    helpers.setupConfig(workingDir);

    app = helpers.application(workingDir);
    return app.start().
              then(() => app.client.waitUntilWindowLoaded() ).
              then(() => app.client.getWindowCount() ).
              then((res) => { windowCount = res; }).
              then(() => app.electron.ipcRenderer.send("open-about")).
              then(() => {
                app.client.getWindowCount().should.eventually.equal(windowCount+1)
              });
            });

	afterEach(() => {
    return helpers.stopApp(app);
	});

  it("has some text and current version number", function() {
    return helpers.getWindowByTitle(app, "Before Dawn: About!").
        then(() => app.client.getText("body")).
        then((res) => {
          assert(res.lastIndexOf("// screensaver fun //") !== -1);
          assert(res.lastIndexOf(packageJSON.version) !== -1);
        });
});
});
