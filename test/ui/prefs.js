"use strict";

const assert = require("assert");
const helpers = require("../helpers.js");

let app;
var workingDir;
var saversDir;
const SaverPrefs = require("../../src/lib/prefs.js");

describe("Prefs", function() { 
  helpers.setupTest(this);

  let pickPrefsWindow = function() {
    return helpers.getWindowByTitle(app, "Before Dawn: Preferences");
  };

  let currentPrefs = function() {
    return new SaverPrefs(workingDir);
  };

  beforeEach(async function() {
    workingDir = helpers.getTempDir();
    saversDir = helpers.getTempDir();
    
    helpers.setupConfig(workingDir);
    helpers.addLocalSource(workingDir, saversDir);
    helpers.addSaver(saversDir, "saver-one", "saver.json");

    app = helpers.application(workingDir, true);
    await app.start();
    await app.client.waitUntilWindowLoaded();
    await helpers.callIpc(app, "open-window prefs");
    await helpers.waitForWindow(app, "Before Dawn: Preferences");
    await pickPrefsWindow();
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

  it("lists screensavers", async function() {
    await helpers.waitForText(app, "body", "Screensaver One", true);
  });

  it("allows picking a screensaver", async function() {
    await helpers.waitForText(app, "body", "Screensaver One", true);
    await app.webContents.executeJavaScript("document.querySelector(\"[type='radio'][data-name='Screensaver One']\").click()");
    await helpers.waitForText(app, ".saver-description", "A Screensaver", true);
    await helpers.click(app, "button.save");
    await helpers.waitForText(app, "body", "Changes saved!", true);

    assert(currentPrefs().saver.lastIndexOf("saver-one") !== -1);
  });

  it("sets options for screensaver", async function() {
    await helpers.waitForText(app, "body", "Screensaver One", true);
    await app.webContents.executeJavaScript("document.querySelector(\"[type='radio'][data-name='Screensaver One']\").click()");
    await helpers.waitForText(app, "body", "Load the specified URL", true);

    await app.webContents.executeJavaScript("document.querySelector(\"[name='sound']\").scrollIntoView()");
    await helpers.click(app, "[name='sound'][value='false']");

    await helpers.setValue(app, "[name='load_url']", "barfoo");
    await helpers.click(app, "button.save");
    await helpers.waitForText(app, "body", "Changes saved!", true);

    var options = currentPrefs().options;
    var k = Object.keys(options).find((i) => {
      return i.indexOf("saver-one") !== -1;
    });

    assert.equal("barfoo", options[k].load_url);
    assert(!options[k].sound);
  });

  it("sets timing options", async function() {
    await helpers.waitForText(app, "body", "Activate after", true);

    let el = await app.client.$("[name=delay]");
    await el.selectByVisibleText("30 minutes");

    el = await app.client.$("[name=sleep]");
    await el.selectByVisibleText("15 minutes");

    await helpers.click(app, "button.save");
    await helpers.waitForText(app, "body", "Changes saved!", true);

    assert.equal(30, currentPrefs().delay);
    assert.equal(15, currentPrefs().sleep);
  });
});
