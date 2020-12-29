"use strict";

const assert = require("assert");
const helpers = require("../helpers.js");

let app;
var workingDir;
var saversDir;
const SaverPrefs = require("../../src/lib/prefs.js");

describe("Settings", function() { 
  const fakeDialogOpts = [ { method: "showOpenDialog", value: { filePaths: ["/not/a/real/path"] } } ];
  const closeWindowDelay = 750;
  const TEXT_ON_SCREEN = "Be careful with these!";

  before(function() {
    if ( process.env.CI && process.env.TRAVIS_OS_NAME == "osx") {
      // eslint-disable-next-line no-console
      console.log("Cowardly skipping test in OSX CI");
      this.skip();
      return;
    }
  });

  helpers.setupTest(this);

  let pickSettingsWindow = function() {
    return helpers.getWindowByTitle(app, "Before Dawn: Settings");
  };

  let currentPrefs = function() {
    return new SaverPrefs(workingDir).data;
  };

  beforeEach(async () => {
    workingDir = helpers.getTempDir();
    saversDir = helpers.getTempDir();
    
    helpers.setupConfig(workingDir);
    helpers.addLocalSource(workingDir, saversDir);
    helpers.addSaver(saversDir, "saver-one", "saver.json");

    app = helpers.application(workingDir, true);
    await app.start();
    await app.fakeDialog.mock(fakeDialogOpts);
    await app.client.waitUntilWindowLoaded();
    await helpers.callIpc(app, "open-window prefs");
    await helpers.waitForWindow(app, "Before Dawn: Preferences");
    await helpers.click(app, "button.settings");
    await helpers.waitForWindow(app, "Before Dawn: Settings");
  });

	afterEach(async function() {
    if (this.currentTest.state === "failed") {
      helpers.outputLogs(app);
    }

    await helpers.stopApp(app);
	});

  before(function() {
    if ( process.platform === "linux" ) {
      // eslint-disable-next-line no-console
      console.log("skipping on linux");
      this.skip();
    }
  });

  it("toggles checkboxes", async function() {
    let oldConfig = currentPrefs();

    await pickSettingsWindow();
    await helpers.waitForText(app, "body", TEXT_ON_SCREEN, true);
    await helpers.click(app, "label*=Lock screen after running");
    await helpers.click(app, "label*=Disable when on battery?");
    await helpers.click(app, "label*=Auto start on login?");
    await helpers.click(app, "label*=Only run on the primary display?");
    await helpers.click(app, "button.save");

    await helpers.sleep(closeWindowDelay);

    let updatedPrefs = currentPrefs();
    assert.equal(!oldConfig.lock, updatedPrefs.lock);
    assert.equal(!oldConfig.disableOnBattery, updatedPrefs.disableOnBattery);
    assert.equal(!oldConfig.auto_start, updatedPrefs.auto_start);
    assert.equal(!oldConfig.runOnSingleDisplay, updatedPrefs.runOnSingleDisplay);

    await helpers.waitForWindow(app, "Before Dawn: Preferences");
  });

  it("leaves checkboxes", async function() {
    let oldConfig = currentPrefs();

    await pickSettingsWindow();
    await helpers.waitForText(app, "body", TEXT_ON_SCREEN, true);
    await helpers.click(app, "button.save");
    await helpers.sleep(closeWindowDelay);

    let updatedPrefs = currentPrefs();
    assert.equal(oldConfig.lock, updatedPrefs.lock);
    assert.equal(oldConfig.disableOnBattery, updatedPrefs.disableOnBattery);
    assert.equal(oldConfig.auto_start, updatedPrefs.auto_start);
    assert.equal(oldConfig.runOnSingleDisplay, updatedPrefs.runOnSingleDisplay);

    await helpers.waitForWindow(app, "Before Dawn: Preferences");
  });
  
  it.skip("allows setting path via dialog", async function() {
    await pickSettingsWindow();
    await helpers.waitForText(app, "body", TEXT_ON_SCREEN, true);
    await app.webContents.executeJavaScript("document.querySelector(\"button.pick\").scrollIntoView()");
    await helpers.click(app, "button.pick");
    await helpers.sleep(50);
    await helpers.click(app, "button.save");
    await helpers.sleep(closeWindowDelay);

    assert.equal("/not/a/real/path", currentPrefs().localSource);

    await helpers.waitForWindow(app, "Before Dawn: Preferences");
  });

  it("clears localSource", async function() {
    await pickSettingsWindow();
    await helpers.waitForText(app, "body", TEXT_ON_SCREEN, true);

    let ls = currentPrefs().localSource;
    assert( ls != "" && ls !== undefined);

    await app.webContents.executeJavaScript("document.querySelector(\"button.clear\").scrollIntoView()");

    await helpers.click(app, "button.clear");
    await helpers.sleep(50);
    await helpers.click(app, "button.save");

    await helpers.sleep(closeWindowDelay);

    assert.equal("", currentPrefs().localSource);

    await helpers.waitForWindow(app, "Before Dawn: Preferences");
  });


  it.skip("resets defaults", async function() {
    const resetDialogOpts = [ { method: "showMessageBox", value: { response: 1 } } ];

    await pickSettingsWindow();
    app.fakeDialog.mock(resetDialogOpts);
    await helpers.waitForText(app, "body", TEXT_ON_SCREEN, true);
    await app.webContents.executeJavaScript("document.querySelector(\"button.reset-to-defaults\").scrollIntoView()");

    await helpers.click(app, "button.reset-to-defaults");
    await helpers.waitForText(app, "body", "Settings reset", true);
    await helpers.sleep(closeWindowDelay);

    assert.equal("", currentPrefs().localSource);

    await helpers.waitForWindow(app, "Before Dawn: Preferences");
  });
});
