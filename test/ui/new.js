'use strict';

const assert = require('assert');
const Application = require('spectron').Application;
const fs = require('fs-extra');
const path = require('path');
const tmp = require('tmp');
const appPath = __dirname + '/../../app/node_modules/electron/dist/Electron.app/Contents/MacOS/Electron';

var getTempDir = function() {
  var tmpObj = tmp.dirSync();
  return tmpObj.name;
};
var workingDir = getTempDir();
var saversDir = getTempDir();

var savedConfig = function() {
  var data = path.join(workingDir, "config.json");
  var json = fs.readFileSync(data);

  return JSON.parse(json);
};

var addLocalSource = function() {
  var src = path.join(workingDir, "config.json");
  var data = savedConfig();
  data.localSource = saversDir;
  fs.writeFileSync(src, JSON.stringify(data));
}

var removeLocalSource = function() {
  var src = path.join(workingDir, "config.json");
  var data = savedConfig();
  data.localSource = "";
  fs.writeFileSync(src, JSON.stringify(data));
}

const app = new Application({
  path: appPath,
  args: ['app/main.js'],
  env: {
    BEFORE_DAWN_DIR: workingDir,
    TEST_MODE: true
  }
});

describe('Add New', function() {
  this.timeout(60000);

  describe('when not setup', function() {
	  beforeEach(() => {
		  return app.start().
                 then(() => {
                   removeLocalSource();
                 }).
                 then(() => app.client.waitUntilWindowLoaded() ).
			           then(() => app.electron.ipcRenderer.send('open-add-screensaver',
                                                          'file://' + path.join(__dirname, '../fixtures/screenshot.png'))
                 ).
			           then(() => app.client.windowByIndex(1));
	  });

	  afterEach(() => {
		  if (app && app.isRunning()) {
			  return app.stop();
		  }
	  });

    it('shows alert if not setup', function() {
      app.client.waitUntilWindowLoaded().
          getText('body').
          then((res) => {
            assert(res.lastIndexOf('before you can create a new screensaver') !== -1);
            done();
          });
    });
  });

  describe('when setup', function() {
	  beforeEach(() => {
      var saversDir = getTempDir();
      
		  return app.start().
                 then(() => app.client.waitUntilWindowLoaded() ).
                 then(() => {
                   addLocalSource();
                 }).
			           then(() => {
                   app.electron.ipcRenderer.
                       send('open-add-screensaver', 'file://' + path.join(__dirname, '../fixtures/screenshot.png'));
                 }).
			           then(() => app.client.windowByIndex(1));
	  });

	  afterEach(() => {
		  if (app && app.isRunning()) {
			  return app.stop();
		  }
	  });

    it('works', function(done) {
      app.client.waitUntilWindowLoaded().
          then(() => app.client.setValue("[name='name']", 'A New Name')).
          then(() => app.client.setValue("[name='description']", 'A Thing I Made?')).
          then(() => app.client.click(".save")).
          then(() => {
            //            setTimeout(function() {
            var src = path.join(saversDir, "a-new-name", "saver.json");
            var contents = fs.readFileSync(src);
            var data = JSON.parse(contents);
            assert.equal('A New Name', data.name);
            done();
            //          }, 1000);
          });
    });
  });
});
