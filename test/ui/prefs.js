'use strict';

const assert = require('assert');
const Application = require('spectron').Application;
const fs = require('fs');
const appPath = __dirname + '/../../app/node_modules/electron/dist/Electron.app/Contents/MacOS/Electron';
const app = new Application({
  path: appPath,
  args: ['app/main.js', '--test-mode=true']
});

describe('Prefs', function() {
  this.timeout(60000);
  
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

  it.only('lists screensavers', function(done) {
    app.client.waitUntilWindowLoaded().
        getText('body').then(function (text) {
          assert(text.lastIndexOf('Holzer') !== -1)
          done();
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
