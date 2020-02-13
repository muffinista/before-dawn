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
 
	beforeEach(() => {
    workingDir = helpers.getTempDir();
    app = helpers.application(workingDir, true);
    
    var saversDir = helpers.getTempDir();

    saverJSON = helpers.addSaver(saversDir, "saver-one", "saver.json");

		return app.start().
      then(() => helpers.waitUntilBooted(app) ).
      then(() => app.client.electron.ipcRenderer.send("open-window", "editor", {
        screenshot: "file://" + path.join(__dirname, "../fixtures/screenshot.png"),
        src: saverJSON
      })).
      then(() => helpers.waitForWindow(app, windowTitle) );
    });

  afterEach(function() {
    if (this.currentTest.state === "failed") {
      helpers.outputLogs(app);
    }

    return helpers.stopApp(app);
  });
    
  it("edits basic settings", function() {
    return pickEditorWindow().
      then(() => app.client.getValue("#saver-form [name='name']")).
      then((res) => {
        assert.equal("Screensaver One", res);
      }).
      then(() => app.client.setValue("#saver-form [name='name']", "A New Name!!!")).
      then(() => app.client.setValue("#saver-form [name='description']", "A Thing I Made?")).
      then(() => app.client.click("button.save")).
      then(() => {
        var p = new Promise( (resolve) => {
          setTimeout(() => {
            var x = JSON.parse(fs.readFileSync(saverJSON)).name;
            resolve(x);
          }, 1000);
        });

        return p;
      }).
      then((res) => { assert.equal(res, "A New Name!!!"); });
  });

  it("adds and removes options", function() {
    return pickEditorWindow().
      then(() => app.client.waitUntilTextExists("body", "Options", 60000)).
      then(() => app.client.setValue(".entry[data-index='0'] [name='name']", "My Option")).
      then(() => app.client.setValue(".entry[data-index='0'] [name='description']", "An Option I Guess?")).
      then(() => app.webContents.executeJavaScript("document.querySelector('button.add-option').scrollIntoView()")).
      then(() => app.client.click("button.add-option")).
      then(() => app.client.setValue(".entry[data-index='1'] [name='name']", "My Second Option")).
      then(() => app.client.setValue(".entry[data-index='1'] [name='description']", "Another Option I Guess?")).
      then(() => app.client.selectByVisibleText(".entry[data-index='1'] select", "yes/no")).
      then(() => app.webContents.executeJavaScript("document.querySelector('button.add-option').scrollIntoView()")).
      then(() => app.client.click("button.add-option")).
      then(() => app.client.setValue(".entry[data-index='2'] [name='name']", "My Third Option")).
      then(() => app.client.setValue(".entry[data-index='2'] [name='description']", "Here We Go Again")).
      then(() => app.client.selectByVisibleText(".entry[data-index='2'] select", "slider")).
      then(() => app.client.click("button.save")).
      then(() => {
        var p = new Promise( (resolve) => {
          setTimeout(() => {
            var x = JSON.parse(fs.readFileSync(saverJSON));
            resolve(x);
          }, 1000);
        });

        return p;
      }).
      then((data) => {
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
      }).
      then(() => app.client.click(".entry[data-index='1'] button.remove-option")).
      then(() => app.client.click("button.save")).
      then(() => {
        var p = new Promise( (resolve) => {
          setTimeout(() => {
            var x = JSON.parse(fs.readFileSync(saverJSON));
            resolve(x);
          }, 1000);
        });

        return p;
      }).
      then((data) => {
        var opt = data.options[0];
        assert.equal("My Option", opt.name);
        assert.equal("An Option I Guess?", opt.description);
        assert.equal("text", opt.type);
        
        opt = data.options[1];
        assert.equal("My Third Option", opt.name);
        assert.equal("Here We Go Again", opt.description);
        assert.equal("slider", opt.type);
      });
    });
});
