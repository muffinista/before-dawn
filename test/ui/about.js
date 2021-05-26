"use strict";

const assert = require("assert");
const helpers = require("../helpers.js");
const packageJSON = require("../../package.json");

var workingDir;
let app;

describe("About", function() {
  const windowTitle = "Before Dawn: About!";
  helpers.setupTest(this);

  beforeEach(async () => {
    workingDir = helpers.getTempDir();
    helpers.setupFullConfig(workingDir);

    app = helpers.application(workingDir, true);
    await app.start();
    await helpers.waitUntilBooted(app);
    await helpers.callIpc(app, "open-window about");
    await helpers.waitForWindow(app, windowTitle);
  });

	afterEach(async function () {
    if (this.currentTest.state === "failed") {
      helpers.outputLogs(app);
    }

    await helpers.stopApp(app);
	});

  it("has some text and current version number", async function() {
    const elem = await app.client.$("body");
    const text = await elem.getText();
 
    assert(text.lastIndexOf("// screensaver fun //") !== -1);
    assert(text.lastIndexOf(packageJSON.version) !== -1);
  });
});
