'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const tmp = require('tmp');

const helpers = require('./setup.js');
var workingDir = helpers.getTempDir();
const app = helpers.application(workingDir);

describe('Prefs', function() {
  this.timeout(6000);
  
	beforeEach(() => {
		return app.start().
               then(() => app.client.waitUntilWindowLoaded() ).
			         then(() => app.electron.ipcRenderer.send('open-prefs')).
			         then(() => app.client.windowByIndex(1));
	});

	afterEach(() => {
    return helpers.stopApp(app);
	});

  it('opens window', function() {
    assert(app.browserWindow.isVisible());
  });

  it('sets title', function(done) {
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
          assert(helpers.savedConfig(workingDir).saver.lastIndexOf("/cylon/") !== -1);
          done();
        });
    
  });
  
  it('allows setting path', function(done) {
    app.client.waitUntilWindowLoaded().click("#prefs-tab").
        then(() => app.client.scroll("[name='localSource']")).
        then(() => app.client.setValue("[name='localSource']", '/tmp')).
        then(() => app.client.click("button.save")).
        then(() => {
          app.client.getWindowCount().should.eventually.equal(1)
        }).
        then(() => {
          assert.equal("/tmp", helpers.savedConfig(workingDir).localSource);
        }).
        then(() => done());
  });
});
