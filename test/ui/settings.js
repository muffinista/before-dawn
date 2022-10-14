"use strict";

const assert = require("assert");
const helpers = require("../helpers.js");

let app;
var workingDir;
var saversDir;
const SaverPrefs = require("../../src/lib/prefs.js");

describe("Settings", function() { 
  const closeWindowDelay = 750;
  let window;

  helpers.setupTest(this);

  let currentPrefs = function() {
    return new SaverPrefs(workingDir).data;
  };

  beforeEach(async () => {
    workingDir = helpers.getTempDir();
    saversDir = helpers.getTempDir();
    
    helpers.setupConfig(workingDir);
    helpers.addLocalSource(workingDir, saversDir);
    helpers.addSaver(saversDir, "saver-one", "saver.json");

    app = await helpers.application(workingDir, true);
    await helpers.callIpc(app, "open-window prefs");
    await helpers.waitForWindow(app, "Before Dawn: Preferences");

    window = await helpers.waitFor(app, "prefs");
    await window.click("button.settings");

    window = await helpers.waitFor(app, "settings");
  });

  it("toggles checkboxes", async function() {
    let oldConfig = currentPrefs();

    await window.check("text=Lock screen after running");
    await window.check("text=Disable when on battery?");
    await window.uncheck("text=Auto start on login?");
    await window.uncheck("text=Only run on the primary display?");
    await window.click("button.save");

    await helpers.sleep(closeWindowDelay);

    let updatedPrefs = currentPrefs();
    assert.strictEqual(!oldConfig.lock, updatedPrefs.lock);
    assert.strictEqual(!oldConfig.disableOnBattery, updatedPrefs.disableOnBattery);
    assert.strictEqual(!oldConfig.auto_start, updatedPrefs.auto_start);
    assert.strictEqual(!oldConfig.runOnSingleDisplay, updatedPrefs.runOnSingleDisplay);

    await helpers.waitFor(app, "prefs");
  });

  it("leaves checkboxes", async function() {
    let oldConfig = currentPrefs();

    await window.click("button.save");
    await helpers.sleep(closeWindowDelay);

    let updatedPrefs = currentPrefs();
    assert.strictEqual(oldConfig.lock, updatedPrefs.lock);
    assert.strictEqual(oldConfig.disableOnBattery, updatedPrefs.disableOnBattery);
    assert.strictEqual(oldConfig.auto_start, updatedPrefs.auto_start);
    assert.strictEqual(oldConfig.runOnSingleDisplay, updatedPrefs.runOnSingleDisplay);

    await helpers.waitFor(app, "prefs");
  });
  
  it.skip("allows setting path via dialog", async function() {
    const [fileChooser] = await Promise.all([
      window.waitForEvent("filechooser"),
      window.click("button.pick")
    ]);
    await fileChooser.setFiles("/not/a/real/path");

    await window.click("button.save");
    await helpers.sleep(closeWindowDelay);

    assert.strictEqual("/not/a/real/path", currentPrefs().localSource);

    await helpers.waitFor(app, "prefs");
  });

  it("clears localSource", async function() {
    let ls = currentPrefs().localSource;
    assert( ls != "" && ls !== undefined);

    await window.click("button.clear");
    await helpers.sleep(50);
    await window.click("button.save");

    await helpers.sleep(closeWindowDelay);

    assert.strictEqual("", currentPrefs().localSource);

    await helpers.waitFor(app, "prefs");
  });


  // dialogs don't work yet
  // @see https://github.com/microsoft/playwright/issues/8278
  it.skip("resets defaults", async function() {
    window = await helpers.waitFor(app, "settings");

    window.on("dialog", async dialog => {
      console.log(dialog.message());
      await dialog.accept();
    });

    await window.click("button.reset-to-defaults");
    await helpers.waitForText(window, "body", "Settings reset", true);
    await helpers.sleep(closeWindowDelay);

    assert.strictEqual("", currentPrefs().localSource);

    await helpers.waitFor(app, "prefs");
  });
});
