"use strict";

const assert = require("assert");
const helpers = require("../helpers.js");

let app;
var workingDir;
var saversDir;
const SaverPrefs = require("../../src/lib/prefs.js");

describe("Settings", function() { 
  const fakeDialogOpts = [ { method: "showOpenDialog", value: ["/not/a/real/path"] } ];
  const closeWindowDelay = 750;

  // before(function() {
  //   if ( process.env.CI ) {
  //     // eslint-disable-next-line no-console
  //     console.log("Cowardly skipping test in CI");
  //     this.skip();
  //     return;
  //   }
  // });

  helpers.setupTimeout(this);
  helpers.setupRetries(this);

  let pickSettingsWindow = function() {
    return helpers.getWindowByTitle(app, "Before Dawn: Settings");
  };

  let currentPrefs = function() {
    return new SaverPrefs(workingDir);
  };

  beforeEach(function() {
    workingDir = helpers.getTempDir();
    saversDir = helpers.getTempDir();
    
    helpers.setupConfig(workingDir);
    helpers.addLocalSource(workingDir, saversDir);
    helpers.addSaver(saversDir, "saver-one", "saver.json");

    app = helpers.application(workingDir, true);
    return app.start().
              then(() => app.fakeDialog.mock(fakeDialogOpts)).
              then(() => app.client.waitUntilWindowLoaded() ).
              then(() => app.electron.ipcRenderer.send("open-prefs")).
              then(() => helpers.waitForWindow(app, "Before Dawn: Preferences") ).
              then(() => app.client.click("button.settings")).
              then(() => helpers.waitForWindow(app, "Before Dawn: Settings") );
    });

	afterEach(function() {
    return helpers.stopApp(app);
	});

  it("set general preferences", function() {
    return pickSettingsWindow().
      then(() => app.client.waitUntilTextExists("body", "Activate after")).
      then(() => 
        app.client.selectByVisibleText("[name=delay]", "30 minutes")
      ).
      then(() => 
        app.client.selectByVisibleText("[name=\"sleep\"]", "15 minutes")
      ).
      then(() => app.client.click("button.save")).
      then(() => helpers.sleep(closeWindowDelay)).
      then(function() {
        let updatedPrefs = currentPrefs();
        assert.equal(30, updatedPrefs.delay);
        assert.equal(15, updatedPrefs.sleep);
      });
      // .
      // // make sure prefs updated on the main window
      // then(() => helpers.waitForWindow(app, "Before Dawn: Preferences") ).
      // then(() => app.client.getValue("[name='delay']")).
      // then((res) => {
      //   assert.equal("30", res);
      // });
  });

  it("toggles checkboxes", function() {
    let oldConfig = currentPrefs();

    return pickSettingsWindow().
      then(() => app.client.waitUntilTextExists("body", "Activate after")).
      then(() => app.client.click("label*=Lock screen after running")).
      then(() => app.client.click("label*=Disable when on battery?")).
      then(() => app.client.click("label*=Auto start on login?")).
      then(() => app.client.click("label*=Only run on the primary display?")).
      then(() => app.client.click("button.save")).
      then(() => helpers.sleep(closeWindowDelay)).
      then(() => {
        let updatedPrefs = currentPrefs();
        assert.equal(!oldConfig.lock, updatedPrefs.lock);
        assert.equal(!oldConfig.disableOnBattery, updatedPrefs.disableOnBattery);
        assert.equal(!oldConfig.auto_start, updatedPrefs.auto_start);
        assert.equal(!oldConfig.runOnSingleDisplay, updatedPrefs.runOnSingleDisplay);
      });
  });

  it("leaves checkboxes", function() {
    let oldConfig = currentPrefs();

    return pickSettingsWindow().
      then(() => app.client.waitUntilTextExists("body", "Activate after")).
      then(() => app.client.click("button.save")).
      then(() => helpers.sleep(closeWindowDelay)).
      then(() => {
        let updatedPrefs = currentPrefs();
        assert.equal(oldConfig.lock, updatedPrefs.lock);
        assert.equal(oldConfig.disableOnBattery, updatedPrefs.disableOnBattery);
        assert.equal(oldConfig.auto_start, updatedPrefs.auto_start);
        assert.equal(oldConfig.runOnSingleDisplay, updatedPrefs.runOnSingleDisplay);
      });
  });
  
  it("allows setting path via dialog", function() {
    return pickSettingsWindow().
      then(() => app.webContents
        .executeJavaScript("document.querySelector(\"button.pick\").scrollIntoView()")).
      then(() => app.client.click("button.pick")).
      then(() => helpers.sleep(50)).
      then(() => app.client.click("button.save")).
      then(() => helpers.sleep(closeWindowDelay)).
      then(function() {
        assert.equal("/not/a/real/path", currentPrefs().localSource);
      });
  });

  it("clears localSource", function() {
    return pickSettingsWindow().
      then(() => app.client.waitUntilTextExists("body", "Activate after")).
      then(function() {
        let ls = currentPrefs().localSource;
        assert( ls != "" && ls !== undefined);
      }).
      then(() => app.webContents
        .executeJavaScript("document.querySelector(\"button.clear\").scrollIntoView()")).
      then(() => app.client.click("button.clear")).
      then(() => helpers.sleep(50)).
      then(() => app.client.click("button.save")).
      then(() => helpers.sleep(closeWindowDelay)).
      then(function() {
        assert.equal("", currentPrefs().localSource);
      });
  });


  it("resets defaults", function() {
    const resetDialogOpts = [ { method: "showMessageBox", value: 1 } ];

    return pickSettingsWindow().
      then(() => app.fakeDialog.mock(resetDialogOpts)).
      then(() => app.webContents
        .executeJavaScript("document.querySelector(\"button.reset-to-defaults\").scrollIntoView()")).
      then(() => app.client.click("button.reset-to-defaults")).
      then(() => app.client.waitUntilTextExists("body", "Settings reset")).
      then(() => helpers.sleep(closeWindowDelay)).
      then(function() {
        assert.equal("", currentPrefs().localSource);
      });
  });
});
