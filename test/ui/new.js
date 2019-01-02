'use strict';

const assert = require('assert');
const fs = require('fs-extra');
const path = require('path');
const tmp = require('tmp');

const helpers = require('./setup.js');

var saversDir = helpers.getTempDir();
var workingDir = helpers.getTempDir();
const app = helpers.application(workingDir);


describe('Add New', function() {
  helpers.setupTimeout(this);

  describe('when not setup', function() {
	  beforeEach(() => {
      console.log(app);
		  return app.start().
                 then(() => {
                   console.log("A");
                   helpers.removeLocalSource(workingDir);
                 }).
                 then(() => app.client.waitUntilWindowLoaded() ).
			           then(() => app.client.electron.ipcRenderer.
                                send('open-add-screensaver',
                                     'file://' + path.join(__dirname, '../fixtures/screenshot.png'))
                 ).
			           then(() => app.client.windowByIndex(1));
	  });

	  afterEach(() => {
      return helpers.stopApp(app);
	  });

    it('shows alert if not setup', function() {
      app.client.waitUntilWindowLoaded().
          getText('body').
          then((res) => {
            console.log(res);
            assert(res.lastIndexOf('before you can create a new screensaver') !== -1);
            done();
          });
    });

    it('prevents save', function() {
      app.client.waitUntilWindowLoaded().
          then(() => {
            assert(!app.browserWindow.isEnabled('.save'));
            done();
          })
    });
  });

  describe('when setup', function() {
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
                       send('open-add-screensaver',
                            'file://' + path.join(__dirname, '../fixtures/screenshot.png'));
                 }).
        //  then(() => app.client.getMainProcessLogs()).
        //    then(function (logs) {
        //     logs.forEach(function (log) {
        //       console.log(log);
        //     });
        //     console.log("!!!!!!!!!!!!!!!!!!!!");
        //    }).
        //    then(() => app.client.getRenderProcessLogs()).
        //    then(function (logs) {
        //       logs.forEach(function (log) {
        //       console.log("XXX", log.message);
        //     })
        //    }).

                 then(() => app.client.windowByIndex(1));
	  });

	  afterEach(() => {
      return helpers.stopApp(app);
	  });

    it('works', function(done) {
      var src = path.join(saversDir, "a-new-name", "saver.json");
      app.client.waitUntilWindowLoaded().
			    then(() => app.client.windowByIndex(1)).
          waitUntil(() => {
            return app.client.getText('body').then((res) => {
              return res.indexOf('Use this form') !== -1
            });
          }).
          then(() => app.client.setValue("[name='name']", 'A New Name')).
          then(() => app.client.setValue("[name='description']", 'A Thing I Made?')).
          then(() => app.client.click(".save")).
          then(() => app.client.waitUntilWindowLoaded()).
          then(() => app.client.windowByIndex(1)).
          getTitle().
          then((res) => {
            assert.equal('Before Dawn: Editor', res);
          }).
          then(() => {
            assert(fs.existsSync(src));
          }).
          then(() => {
            done();
          });
      
    });
  });
});
