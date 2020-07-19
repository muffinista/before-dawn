"use strict";

const assert = require("assert");
const fs = require("fs-extra");
const path = require("path");
const helpers = require("../helpers.js");

var workingDir;
let app;


describe("Editor", function() {
  const windowTitle = "Before Dawn: Editor";

  var saverJSON;
  helpers.setupTest(this);

  let pickEditorWindow = () => {
    return helpers.waitForWindow(app, windowTitle);
  };

  before(function() {
    if ( process.env.CI && process.env.TRAVIS_OS_NAME == "linux") {
      // eslint-disable-next-line no-console
      console.log("Cowardly skipping test in Linux CI");
      this.skip();
      return;
    }
  });

	beforeEach(async () => {
    workingDir = helpers.getTempDir();
    
    var saversDir = helpers.getTempDir();

    saverJSON = helpers.addSaver(saversDir, "saver-one", "saver.json");

    app = helpers.application(workingDir, true);
    await app.start();
    await app.client.waitUntilWindowLoaded();
    await app.electron.ipcRenderer.send("open-window", "editor", {
      screenshot: "file://" + path.join(__dirname, "../fixtures/screenshot.png"),
      src: saverJSON
    });
    await helpers.waitForWindow(app, windowTitle);
    await pickEditorWindow();
  });

  afterEach(function() {
    if (this.currentTest.state === "failed") {
      helpers.outputLogs(app);
    }

    return helpers.stopApp(app);
  });
    
  it("edits basic settings", async function() {
    const val = await helpers.getValue(app, "#saver-form [name='name']");
    assert.equal("Screensaver One", val);

    await helpers.setValue(app, "#saver-form [name='name']", "A New Name!!!");
    await helpers.setValue(app, "#saver-form [name='description']", "A Thing I Made?");
    await helpers.click(app, "button.save");

    await helpers.sleep(100);

    var x = JSON.parse(fs.readFileSync(saverJSON)).name;
    assert.equal(x, "A New Name!!!");
  });

  it("adds and removes options", async function() {
    await helpers.waitForText(app, "body", "Options", true);

    await helpers.setValue(app, ".entry[data-index='0'] [name='name']", "My Option");
    await helpers.setValue(app, ".entry[data-index='0'] [name='description']", "An Option I Guess?");
    await app.webContents.executeJavaScript("document.querySelector('button.add-option').scrollIntoView()");
    await helpers.click(app, "button.add-option");
    await helpers.setValue(app, ".entry[data-index='1'] [name='name']", "My Second Option");
    await helpers.setValue(app, ".entry[data-index='1'] [name='description']", "Another Option I Guess?");

    let el = await app.client.$(".entry[data-index='1'] select");
    await el.selectByVisibleText("yes/no");

    await app.webContents.executeJavaScript("document.querySelector('button.add-option').scrollIntoView()");
    await helpers.click(app, "button.add-option");
    await helpers.setValue(app, ".entry[data-index='2'] [name='name']", "My Third Option");
    await helpers.setValue(app, ".entry[data-index='2'] [name='description']", "Here We Go Again");

    el = await app.client.$(".entry[data-index='2'] select");
    await el.selectByVisibleText("slider");

    await helpers.click(app, "button.save");

    await helpers.sleep(100);

    var data = JSON.parse(fs.readFileSync(saverJSON));

    var opt = data.options[0];
    assert.equal("My Option", opt.name);
    assert.equal("An Option I Guess?", opt.description);
    assert.equal("text", opt.type);

    opt = data.options[1];
    assert.equal("My Second Option", opt.name);
    assert.equal("Another Option I Guess?", opt.description);
    assert.equal("boolean", opt.type);

    opt = data.options[2];
    assert.equal("My Third Option", opt.name);
    assert.equal("Here We Go Again", opt.description);
    assert.equal("slider", opt.type);

    await helpers.click(app, ".entry[data-index='1'] button.remove-option");
    await helpers.click(app, "button.save");

    await helpers.sleep(100);

    data = JSON.parse(fs.readFileSync(saverJSON));

    opt = data.options[0];
    assert.equal("My Option", opt.name);
    assert.equal("An Option I Guess?", opt.description);
    assert.equal("text", opt.type);
    
    opt = data.options[1];
    assert.equal("My Third Option", opt.name);
    assert.equal("Here We Go Again", opt.description);
    assert.equal("slider", opt.type);
  });
});
