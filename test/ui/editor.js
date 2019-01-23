"use strict";

const assert = require("assert");
const fs = require("fs-extra");
const path = require("path");
const helpers = require("../helpers.js");

var workingDir;
let app;


describe("Editor", function() {
  var saverJSON;
  helpers.setupTimeout(this);

  let pickEditorWindow = () => {
    return helpers.getWindowByTitle(app, "Before Dawn: Editor");
  };
 
	beforeEach(() => {
    let windowCount = 0;

    workingDir = helpers.getTempDir();
    app = helpers.application(workingDir);
    
    var saversDir = helpers.getTempDir();

    saverJSON = helpers.addSaver(saversDir, "saver-one", "saver.json");

		return app.start().
      then(() => app.client.waitUntilWindowLoaded() ).
      then(() => app.client.getWindowCount() ).
      then((res) => { windowCount = res; }). 
      then(() => app.client.electron.ipcRenderer.send("open-editor", {
        screenshot: "file://" + path.join(__dirname, "../fixtures/screenshot.png"),
        src: saverJSON
      })).
      then(() => {
        app.client.getWindowCount().should.eventually.equal(windowCount+1);
      }); 
	});

	afterEach(() => {
    return helpers.stopApp(app);
	});

  it("opens window", function() {
    return pickEditorWindow().
      then(() => app.client.getTitle()).
      then((res) => {
        assert.equal("Before Dawn: Editor", res);
      });
  });
  
  it("shows settings form", function() {
    return pickEditorWindow().
      then(() => app.client.click("=Settings")).
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
      then(() => app.client.waitUntilTextExists("body", "Settings", 60000)).
      then(() => app.client.click("=Settings")).
      then(() => app.client.setValue(".entry[data-index='0'] [name='name']", "My Option")).
      then(() => app.client.setValue(".entry[data-index='0'] [name='description']", "An Option I Guess?")).
      then(() => app.client.click("button.add-option")).
      then(() => app.client.setValue(".entry[data-index='1'] [name='name']", "My Second Option")).
      then(() => app.client.setValue(".entry[data-index='1'] [name='description']", "Another Option I Guess?")).
      then(() => app.client.selectByVisibleText(".entry[data-index='1'] select", "yes/no")).
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
