"use strict";

const assert = require("assert");
const fs = require("fs-extra");
const path = require("path");

const helpers = require("./setup.js");

var saversDir;
var workingDir;
let app;

describe("Add New", function() {
  beforeEach(() => {
    saversDir = helpers.getTempDir();
    workingDir = helpers.getTempDir();
    app = helpers.application(workingDir);
    
    helpers.setupTimeout(this);
  });

  describe("when not setup", function() {
    beforeEach(() => {
		  return app.start().
        then(() => {
          helpers.removeLocalSource(workingDir);
        }).
        then(() => app.client.waitUntilWindowLoaded() ).
        then(() => app.client.electron.ipcRenderer.
                      send("open-add-screensaver",
                            "file://" + path.join(__dirname, "../fixtures/screenshot.png"))
        ).
        then(() => {
          app.client.getWindowCount().should.eventually.equal(2)
        }).
        then(() => app.client.windowByIndex(2));
	  });

	  afterEach(() => {
      return helpers.stopApp(app);
	  });

    it("shows alert if not setup", function() {
      return app.client.waitUntilWindowLoaded().
          getText("body").
          then((res) => {
            assert(res.lastIndexOf("set a local directory in the preferences window") !== -1);
            // done();
          });
    });

    xit("prevents save", function() {
      return app.client.waitUntilWindowLoaded().
          then(() => {
            assert(!app.browserWindow.isEnabled(".save"));
          })
    });
  });

  describe("when setup", function() {
	  beforeEach(() => {
		  return app.start().
        then(() => app.client.waitUntilWindowLoaded() ).
        then(() => {
          helpers.addLocalSource(workingDir, saversDir);
          
          // tell app to reload config
          app.client.electron.ipcRenderer.send("prefs-updated");
        }).
        then(() => {
          app.client.electron.ipcRenderer.
              send("open-add-screensaver",
                  "file://" + path.join(__dirname, "../fixtures/screenshot.png"));
        }).
        then(() => {
          app.client.getWindowCount().should.eventually.equal(2)
        }).
        then(() => app.client.windowByIndex(2));
	  });

	  afterEach(() => {
      return helpers.stopApp(app);
	  });

    it("works", function() {
      var src = path.join(saversDir, "a-new-name", "saver.json");
      return app.client.waitUntilWindowLoaded().
        waitUntil(() => {
          return app.client.getText("body").then((res) => {
            return res.indexOf("Use this form") !== -1
          });
        }).
        then(() => app.client.setValue("[name='name']", "A New Name")).
        then(() => app.client.setValue("[name='description']", "A Thing I Made?")).
        then(() => app.client.click(".save")).
        then(() => app.client.windowByIndex(2).getTitle().should.eventually.equal("Before Dawn: Editor")).
        then(() => {
          assert(fs.existsSync(src));
        });
      
    });
  });
});
