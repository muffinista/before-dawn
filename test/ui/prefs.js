'use strict';

const assert = require('assert');
const Application = require('spectron').Application;
const fs = require('fs');
const tmp = require('tmp');
const appPath = __dirname + '/../../app/node_modules/electron/dist/Electron.app/Contents/MacOS/Electron';

var getTempDir = function() {
  var tmpObj = tmp.dirSync();
  return tmpObj.name;
};
var workingDir = getTempDir();


const app = new Application({
  path: appPath,
  args: ['app/main.js', '--test-mode=true'],
  env: {
    BEFORE_DAWN_DIR: workingDir
  }
});

describe('Prefs', function() {
  this.timeout(6000);
  
	beforeEach(() => {
		return app.start();
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
    app.client.waitUntilTextExists('body', 'Holzer', 10000).getText('body').then((text) => {
      assert(text.lastIndexOf('Holzer') !== -1);
      done();
    });
  });

  it.only('allows picking a screensaver', function(done) {
    app.client.waitUntilTextExists('body', 'Holzer', 10000)
       .getAttribute("[type=radio]","data-name")
       .then(console.log.bind(console))
       .then(() => {
         app.client.click("[type=radio][data-name='Cylon']").
             getText('body').
             then((text) => {
               assert(text.lastIndexOf('lights on your screen') !== -1);
               done();
             });
       });
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
