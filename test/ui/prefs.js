'use strict';

const assert = require('assert');
var chai = require('chai')
var chaiAsPromised = require('chai-as-promised')
const Application = require('spectron').Application;
const fs = require('fs');
const path = require('path');
const tmp = require('tmp');
const appPath = __dirname + '/../../app/node_modules/electron/dist/Electron.app/Contents/MacOS/Electron';

var getTempDir = function() {
  var tmpObj = tmp.dirSync();
  return tmpObj.name;
};
var workingDir = getTempDir();

var savedConfig = function() {
  var data = path.join(workingDir, "config.json");
  var json = fs.readFileSync(data);

  return JSON.parse(json);
};

const app = new Application({
  path: appPath,
  args: ['app/main.js'],
  env: {
    BEFORE_DAWN_DIR: workingDir,
    TEST_MODE: true
  }
});

chai.should();
chai.use(chaiAsPromised);

chaiAsPromised.transferPromiseness = app.transferPromiseness;


describe('Prefs', function() {
  this.timeout(6000);
  
	beforeEach(() => {
		return app.start().
               then(() => app.client.waitUntilWindowLoaded() ).
			         then(() => app.electron.ipcRenderer.send('open-prefs')).
			         then(() => app.client.windowByIndex(1))
	});

	afterEach(() => {
		if (app && app.isRunning()) {
			return app.stop();
		}
	});

  it('opens window', function() {
    assert(app.browserWindow.isVisible());
  });

  it('sets title', function() {
    app.client.waitUntilWindowLoaded().getTitle().then((res) => {
      assert.equal('Before Dawn -- screensaver fun', res);
      done();
    });
  });

  it('lists screensavers', function(done) {
    app.client.waitUntilTextExists('body', 'Holzer').getText('body').then((text) => {
      assert(text.lastIndexOf('Holzer') !== -1);
      done();
    });
  });

  it('allows picking a screensaver', function(done) {
    app.client.waitUntilTextExists('body', 'Holzer', 10000)
       .getAttribute("[type=radio]","data-name")
       .then(() => {
         app.client.click("[type=radio][data-name='Cylon']").
             getText('body').
             then((text) => {
               assert(text.lastIndexOf('lights on your screen') !== -1);
             });
       }).
        then(() => app.client.click("button.save")).
        getWindowCount().should.eventually.equal(1).
        then(() => {
          //console.log("hey!", savedConfig());
          assert(savedConfig().saver.lastIndexOf("/cylon/") !== -1);
          done();
        });
    
  });
  
  it('allows setting path', function(done) {
    app.client.waitUntilWindowLoaded().click("#prefs-tab").
        then(() => app.client.scroll("[name='localSource']")).
        then(() => app.client.setValue("[name='localSource']", '/tmp')).
        then(() => app.client.click("button.save")).
        getWindowCount().should.eventually.equal(1).
        then(() => {
          assert.equal("/tmp", savedConfig().localSource);
        }).
        then(() => done());
  });
  
  
  /*it('lists screensaver', function(done) {
     app.browserWindow.capturePage().then(function(imageBuffer) {
     console.log("DUMP IT", imageBuffer);
     fs.writeFile('page.png', imageBuffer, function(error) {
     if (error) throw error;
     console.info(`Screenshot saved: ${process.cwd()}/page.png`);
     done();
     });
     }).catch(function (error) {
     // Log any failures
     console.error('Test failed', error.message);
     console.log(error);
     app.stop();
     });
  });*/
});
