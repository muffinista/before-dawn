"use strict";

const assert = require("assert");
const helpers = require("../helpers.js");

let app;
var workingDir;
var saversDir;
const SaverPrefs = require("../../src/lib/prefs.js");

describe("Prefs", function() { 
  helpers.setupTest(this);

  let currentPrefs = function() {
    return new SaverPrefs(workingDir);
  };

  let window;

  beforeEach(async function() {
    workingDir = helpers.getTempDir();
    saversDir = helpers.getTempDir();
    
    helpers.setupConfig(workingDir);
    helpers.addLocalSource(workingDir, saversDir);
    helpers.addSaver(saversDir, "saver-one", "saver.json");

    app = await helpers.application(workingDir, true);
    await helpers.callIpc(app, "open-window prefs");
    window = await helpers.waitFor(app, "prefs");
	});

  it("lists screensavers", async function() {
    await helpers.waitForText(window, "body", "Screensaver One", true);
  });

  it("allows picking a screensaver", async function() {
    await helpers.waitForText(window, "body", "Screensaver One", true);
    await window.click("text=Screensaver One");
    await helpers.waitForText(window, ".saver-description", "A Screensaver", true);
    await window.click("button.save");

    await helpers.waitForText(window, "body", "Changes saved!", true);
    console.log(currentPrefs().saver);
    assert(currentPrefs().saver.lastIndexOf("saver-one") !== -1);
  });

  it("sets options for screensaver", async function() {
    await helpers.waitForText(window, "body", "Screensaver One", true);
    await window.click("text=Screensaver One");

    await helpers.waitForText(window, "body", "Load the specified URL", true);
    await window.click("[name='sound'][value='false']");

    await window.fill("[name='load_url']", "barfoo");
    await window.click("button.save");

    await helpers.waitForText(window, "body", "Changes saved!", true);

    var options = currentPrefs().options;
    var k = Object.keys(options).find((i) => {
      return i.indexOf("saver-one") !== -1;
    });

    assert.strictEqual("barfoo", options[k].load_url);
    assert(!options[k].sound);
  });

  it("sets timing options", async function() {
    await helpers.waitForText(window, "body", "Activate after", true);

    await window.selectOption("[name=delay]", {label: "30 minutes"});
    await window.selectOption("[name=sleep]", {label: "15 minutes"});

    await window.click("button.save");
    await helpers.waitForText(window, "body", "Changes saved!", true);

    assert.strictEqual(30, currentPrefs().delay);
    assert.strictEqual(15, currentPrefs().sleep);
  });
});
