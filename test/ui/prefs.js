"use strict";

const assert = require("assert");
const helpers = require("../helpers.js");

let app;
var workingDir;
var saversDir;
const SaverPrefs = require("../../src/lib/prefs.js");

describe("Prefs", function() { 

  helpers.setupTimeout(this);

  // retry all tests in this suite up to 3 times
  helpers.setupRetries(this);


  let pickPrefsWindow = function() {
    return helpers.getWindowByTitle(app, "Before Dawn: Preferences");
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
              then(() => app.client.waitUntilWindowLoaded() ).
              then(() => app.electron.ipcRenderer.send("open-prefs")).
              then(() => helpers.waitForWindow(app, "Before Dawn: Preferences") );
	});

	afterEach(function() {
    return helpers.stopApp(app);
	});

  it("lists screensavers", function() {
    return pickPrefsWindow().
      then(() => app.client.waitUntilTextExists("body", "Screensaver One")).
      then(() => app.client.getText("body")).
      then((text) => {
        assert(text.lastIndexOf("Screensaver One") !== -1);
      });
  });

  it("allows picking a screensaver", function() {
    return pickPrefsWindow().
      then(() => app.client.waitUntilTextExists("body", "Screensaver One")).
      then(() => app.webContents.executeJavaScript("document.querySelector(\"[type='radio'][data-name='Screensaver One']\").click()")).
      then(() => app.client.getText(".saver-description")).
      then((text) => {
        assert(text.lastIndexOf("A Screensaver") !== -1);
      }).
      then(() => app.client.click("button.save")).
      then(() => app.client.waitUntilTextExists("body", "Changes saved!")).
      then(function() {
        assert(currentPrefs().current.lastIndexOf("/saver-one/") !== -1);
      });
  });

  it("sets options for screensaver", function() {
    return pickPrefsWindow().
      then(() => app.client.waitUntilTextExists("body", "Screensaver One")).
        then(() => app.webContents.executeJavaScript("document.querySelector(\"[type='radio'][data-name='Screensaver One']\").click()")).
        then(() => app.client.getText("body")).
        then((text) => {
          assert(text.lastIndexOf("Load the specified URL") !== -1);
        }).
        then(() => app.webContents
          .executeJavaScript("document.querySelector(\"[name='sound']\").scrollIntoView()")).
        then(() => app.client.click("[name='sound'][value='false']")).
        then(() => app.client.setValue("[name='load_url']", "barfoo")).
        then(() => app.client.click("button.save")).
        then(() => app.client.waitUntilTextExists("body", "Changes saved!")).
        then(function() {
          var options = currentPrefs().options;
          var k = Object.keys(options).find((i) => {
            return i.indexOf("saver-one") !== -1;
          });

          assert.equal("barfoo", options[k].load_url);
          assert(!options[k].sound);
        });
  });

  it("sets timing options", function() {
    return pickPrefsWindow().
      then(() => app.client.waitUntilTextExists("body", "Activate after")).
      then(() => 
        app.client.selectByVisibleText("[name=delay]", "30 minutes")
      ).
      then(() => 
        app.client.selectByVisibleText("[name=\"sleep\"]", "15 minutes")
      ).
      then(() => app.client.click("button.save")).
      then(() => helpers.sleep(100)).
      then(function() {
        assert.equal(30, currentPrefs().delay);
        assert.equal(15, currentPrefs().sleep);
      });
  });
});
