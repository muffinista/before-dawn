"use strict";

const assert = require("assert");
const helpers = require("../helpers.js")

let app;
var workingDir;
var saversDir;


describe("Prefs", function() { 
  const fakeDialogOpts = [ { method: "showOpenDialog", value: ["/not/a/real/path"] } ];
  helpers.setupTimeout(this);

  let pickPrefsWindow = () => {
    return helpers.getWindowByTitle(app, "Before Dawn: Preferences");
  }

  let windowCount = 0;

  beforeEach(() => {
    workingDir = helpers.getTempDir();
    saversDir = helpers.getTempDir();
    
    helpers.setupConfig(workingDir);
    helpers.addLocalSource(workingDir, saversDir);
    helpers.addSaver(saversDir, "saver-one", "saver.json");

    app = helpers.application(workingDir);
    return app.start().
              then(() => app.fakeDialog.mock(fakeDialogOpts)).
               then(() => app.client.waitUntilWindowLoaded() ).
               then(() => app.client.getWindowCount() ).
               then((res) => { windowCount = res; }). 
               then(() => app.electron.ipcRenderer.send("open-prefs")).
               then(() => {
                app.client.getWindowCount().should.eventually.equal(windowCount+1)
              });
	});

	afterEach(() => {
    return helpers.stopApp(app);
	});

  it("sets title", function() {
    return pickPrefsWindow().
      then(() => app.client.getTitle()).
      then((res) => {
        assert.equal("Before Dawn: Preferences", res);
      });
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
      then(() => app.client.getAttribute("[type=radio]","data-name")).
      then(() => {
         app.client.click("[type=radio][data-name='Screensaver One']").
             getText("body").
             then((text) => {
               assert(text.lastIndexOf("A Screensaver") !== -1);
             });
       }).
        then(() => app.client.click("button.save")).
        then(() => {
          app.client.getWindowCount().should.eventually.equal(1)
        }).
        then(() => {
          assert(helpers.savedConfig(workingDir).saver.lastIndexOf("/saver-one/") !== -1);
        });
  });

  it("set general preferences", () => {
    return pickPrefsWindow().
      then(() => app.client.waitUntilTextExists("body", "Screensaver One")).
      then(() => app.client.click("=Preferences")).
      then(() => app.client.waitUntilTextExists("body", "Activate after")).
      then(() => 
        app.client.selectByVisibleText("[name=delay]", "30 minutes")
      ).
      then(() => 
        app.client.selectByVisibleText("[name=\"sleep\"]", "15 minutes")
      ).
      then(() => app.client.click("button.save")).
      then(() => {
        app.client.getWindowCount().should.eventually.equal(1)
      }).
      then(() => {
        assert.equal(30, helpers.savedConfig(workingDir).delay);
        assert.equal(15, helpers.savedConfig(workingDir).sleep);  
      });
  });

  it("toggles checkboxes", () => {
    let oldConfig = helpers.savedConfig(workingDir);

    return pickPrefsWindow().
      then(() => app.client.waitUntilTextExists("body", "Screensaver One")).
      then(() => app.client.click("=Preferences")).
      then(() => app.client.waitUntilTextExists("body", "Activate after")).
      then(() => app.client.click("label*=Lock screen after running")).
      then(() => app.client.click("label*=Disable when on battery?")).
      then(() => app.client.click("label*=Auto start on login?")).
      then(() => app.client.click("label*=Only run on the primary display?")).
      then(() => app.client.click("button.save")).
      then(() => {
        app.client.getWindowCount().should.eventually.equal(1)
      }).
      then(() => {
        assert.equal(!oldConfig.lock, helpers.savedConfig(workingDir).lock);
        assert.equal(!oldConfig.disable_on_battery, helpers.savedConfig(workingDir).disable_on_battery);
        assert.equal(!oldConfig.auto_start, helpers.savedConfig(workingDir).auto_start);
        assert.equal(!oldConfig.run_on_single_display, helpers.savedConfig(workingDir).run_on_single_display);
      });
  });

  it("leaves checkboxes", () => {
    let oldConfig = helpers.savedConfig(workingDir);

    return pickPrefsWindow().
      then(() => app.client.waitUntilTextExists("body", "Screensaver One")).
      then(() => app.client.click("=Preferences")).
      then(() => app.client.waitUntilTextExists("body", "Activate after")).
      then(() => app.client.click("button.save")).
      then(() => {
        app.client.getWindowCount().should.eventually.equal(1)
      }).
      then(() => {
        assert.equal(oldConfig.lock, helpers.savedConfig(workingDir).lock);
        assert.equal(oldConfig.disable_on_battery, helpers.savedConfig(workingDir).disable_on_battery);
        assert.equal(oldConfig.auto_start, helpers.savedConfig(workingDir).auto_start);
        assert.equal(oldConfig.run_on_single_display, helpers.savedConfig(workingDir).run_on_single_display);
      });
  });

  it("sets options for screensaver", function() {
    return pickPrefsWindow().
      then(() => app.client.waitUntilTextExists("body", "Screensaver One")).
      then(() => app.client.getAttribute("[type=radio]","data-name")).
        then(() => app.client.click("[type=radio][data-name='Screensaver One']")).
        then(() => app.client.getText("body")).
        then((text) => {
          assert(text.lastIndexOf("Load the specified URL") !== -1);
        }).
        then(() => app.client.click("[name='sound'][value='false']")).
        then(() => app.client.setValue("[name='load_url']", "barfoo")).
        then(() => app.client.click("button.save")).
        then(() => {
          app.client.getWindowCount().should.eventually.equal(1)
        }).
        then(() => {
          var options = helpers.savedConfig(workingDir).options;
          var k = Object.keys(options).find((i) => {
            return i.indexOf("saver-one") !== -1;
          });

          assert.equal("barfoo", options[k].load_url);
          assert(!options[k].sound);
        });
  });
  

  it("allows setting path via dialog", function() {
    return pickPrefsWindow().
      then(() => app.client.waitUntilTextExists("body", "Screensaver One")).
      then(() => app.client.click("=Advanced")).
      then(() => app.client.click("button.pick")).
      then(() => app.client.click("button.save")).
      then(() => {
        app.client.getWindowCount().should.eventually.equal(1)
      }).
      then(() => {
        assert.equal("/not/a/real/path", helpers.savedConfig(workingDir).localSource);
      });
  });

  it("clears localSource", function() {
    return pickPrefsWindow().
      then(() => app.client.waitUntilTextExists("body", "Screensaver One")).
      then(() => app.client.click("=Advanced")).
      then(() => {
        let ls = helpers.savedConfig(workingDir).localSource;
        assert( ls != "" && ls !== undefined);
      }).
      then(() => app.client.click("button.clear")).
      then(() => app.client.click("button.save")).
      then(() => {
        app.client.getWindowCount().should.eventually.equal(windowCount)
      }).
      then(() => {
        assert.equal("", helpers.savedConfig(workingDir).localSource);
      });
  });
});
