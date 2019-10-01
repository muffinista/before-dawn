"use strict";

const assert = require("assert");
const fs = require("fs-extra");
const path = require("path");

const helpers = require("../helpers.js");

const SaverPrefs = require("../../src/lib/prefs.js");

var saversDir;
var workingDir;
let app;

describe("Add New", function() {
  let windowTitle = "Before Dawn: Create Screensaver!";
  let screensaverUrl = "file://" + path.join(__dirname, "../fixtures/screenshot.png");

  let currentPrefs = function() {
    return new SaverPrefs(workingDir);
  };

  helpers.setupTest(this);

  beforeEach(() => {
    saversDir = helpers.getTempDir();
    workingDir = helpers.getTempDir();

    app = helpers.application(workingDir, true);
  });

  afterEach(function() {
    if (this.currentTest.state === "failed") {
      helpers.outputLogs(app);
    }

    return helpers.stopApp(app);
  });


  const fakeDialogOpts = [ { method: "showOpenDialog", value: ["/not/a/real/path"] } ];
  describe("when not setup", function() {
    beforeEach(() => {
      return app.start().
        then(() => app.fakeDialog.mock(fakeDialogOpts)).
        then(() => {
          helpers.removeLocalSource(workingDir);
        }).
        then(() => app.client.waitUntilWindowLoaded() ).
        then(() => app.electron.ipcRenderer.send("open-add-screensaver", screensaverUrl)).
        then(() => helpers.waitForWindow(app, windowTitle) );
    });

    it("shows alert if not setup", function() {
      return helpers.getWindowByTitle(app, windowTitle).
        then(() => app.client.waitUntil(() => {
            return app.client.getText("body").then((res) => {
              return res.indexOf("set a local directory") !== -1;
            });
          })).
        then(() => app.client.getText("body")).
        then((res) => {
          assert(res.lastIndexOf("set a local directory!") !== -1);
        });
    });

    it("can set local source", function() {
      return helpers.getWindowByTitle(app, windowTitle).
        then(() => app.client.waitUntil(() => {
            return app.client.getText("body").then((res) => {
              return res.indexOf("set a local directory") !== -1;
            });
        })).
        then(() => app.client.click("button.pick")).
        then(() => app.client.click("button.save")).
        then(() => helpers.sleep(100)).
        then(function() {
          assert.equal("/not/a/real/path", currentPrefs().localSource);
        }).
        then(() => app.client.getText("body")).
        then((res) => {
          assert(res.lastIndexOf("Use this form") !== -1);
        });
    
    });
  });

  describe("when setup", function() {
    beforeEach(() => {
      return app.start().
        then(() => {
          helpers.addLocalSource(workingDir, saversDir);
          // tell app to reload config
          app.client.electron.ipcRenderer.send("prefs-updated");
        }).
        then(() => app.client.waitUntilWindowLoaded() ).
        then(() => app.electron.ipcRenderer.send("open-add-screensaver", screensaverUrl)).
        then(() => helpers.waitForWindow(app, windowTitle) );
      });     

    it("creates screensaver and shows editor", function() {
      var src = path.join(saversDir, "a-new-name", "saver.json");
      return helpers.getWindowByTitle(app, windowTitle).
        then(() => app.client.waitUntil(() => {
          return app.client.getText("body").then((res) => {
            return res.indexOf("Use this form") !== -1;
          });
        })).
        then(() => app.client.setValue("[name='name']", "A New Name")).
        then(() => app.client.setValue("[name='description']", "A Thing I Made?")).
        then(() => app.client.click(".save")).
        then(() => helpers.waitForWindow(app, "Before Dawn: Editor") ).
        then(() => {
          assert(fs.existsSync(src));
        }).
        then(() => app.client.getValue("#saver-form [name='name']")).
        then((res) => {
          assert.equal("A New Name", res);
        });
    });
  });
});
