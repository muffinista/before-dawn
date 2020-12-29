"use strict";

const assert = require("assert");
const fs = require("fs-extra");
const path = require("path");

const helpers = require("../helpers.js");

var saversDir;
var workingDir;
let app;

describe("Add New", function() {
  const fakeDialogOpts = [ { method: "showOpenDialog", value: { filePaths: ["/not/a/real/path"] } } ];
  const windowTitle = "Before Dawn: Create Screensaver!";
  let screensaverUrl = "file://" + path.join(__dirname, "../fixtures/screenshot.png");

  let currentPrefs = function() {
    return JSON.parse(fs.readFileSync(`${workingDir}/config.json`));
  };

  helpers.setupTest(this);

  beforeEach(async () => {
    saversDir = helpers.getTempDir();
    workingDir = helpers.getTempDir();
    app = helpers.application(workingDir, true);
    await app.start();
  });

  afterEach(async function() {
    if (this.currentTest.state === "failed") {
      helpers.outputLogs(app);
    }

    await helpers.stopApp(app);
  });

  // before(function() {
  //   if ( process.platform === "linux" ) {
  //     // eslint-disable-next-line no-console
  //     console.log("skipping on linux");
  //     this.skip();
  //   }
  // });


  describe("when not setup", function() {
    beforeEach(async () => {
      //await helpers.waitUntilBooted(app);
  
      await app.fakeDialog.mock(fakeDialogOpts);
      await app.client.waitUntilWindowLoaded();
      await helpers.callIpc(app, `open-window add-new ${screensaverUrl}`);
      // await app.electron.ipcRenderer.send("open-window", "add-new", screensaverUrl);
      await helpers.waitForWindow(app, windowTitle);
    });

    it("shows alert if not setup", async function() {
      await helpers.waitForWindow(app, windowTitle);
      await helpers.waitForText(app, "body", "set a local directory", true);
    });

    it("can set local source", async function() {
      this.skip();

      await helpers.waitForWindow(app, windowTitle);
      await helpers.waitForText(app, "body", "set a local directory", true);

      await helpers.click(app, "button.pick");
      await helpers.click(app, "button.save");

      await helpers.sleep(100);

      assert.equal("/not/a/real/path", currentPrefs().localSource);
      const res = await helpers.getElementText(app, "body");
      assert(res.lastIndexOf("Use this form") !== -1);
    });
  });

  describe("when setup", function() {
    beforeEach(async () => {
      helpers.addLocalSource(workingDir, saversDir);

      await helpers.waitUntilBooted(app);
      await helpers.callIpc(app, `open-window add-new ${screensaverUrl}`);
      // await app.electron.ipcRenderer.send("open-window", "add-new", screensaverUrl);
      await helpers.waitForWindow(app, windowTitle);
    });

    it("creates screensaver and shows editor", async function() {
      var src = path.join(saversDir, "a-new-name", "saver.json");
      await helpers.waitForWindow(app, windowTitle);
      await helpers.waitForText(app, "body", "Use this form");

      let elem = await app.client.$("[name='name']");
      await elem.setValue("A New Name");

      elem = await app.client.$("[name='description']");
      await elem.setValue("A Thing I Made?");

      await helpers.click(app, "button.save");

      await helpers.waitForWindow(app, "Before Dawn: Editor");
      assert(fs.existsSync(src));

      elem = await app.client.$("#saver-form [name='name']");
      const res = await elem.getValue();

      assert.equal("A New Name", res);
    });
  });
});
