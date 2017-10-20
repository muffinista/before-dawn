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
var saverJSON;

const app = new Application({
  path: appPath,
  args: ['app/main.js'],
  env: {
    BEFORE_DAWN_DIR: workingDir,
    TEST_MODE: true
  }
});

var savedConfig = function() {
  var data = path.join(workingDir, "config.json");
  var json = fs.readFileSync(data);

  return JSON.parse(json);
};

describe('Editor', function() {
  this.timeout(6000);
  
	beforeEach(() => {
    var saversDir = getTempDir();
    // make a subdir in the savers directory and drop screensaver
    // config there
    var testSaverDir = path.join(saversDir, 'saver');
    fs.mkdirSync(testSaverDir);
    saverJSON = path.join(testSaverDir, 'saver.json');
    var saverHTML = path.join(testSaverDir, 'index.html');    

    fs.copySync(path.join(__dirname, '../fixtures/saver.json'), saverJSON);
    fs.copySync(path.join(__dirname, '../fixtures/index.html'), saverHTML);    

		return app.start().
               then(() => app.client.waitUntilWindowLoaded() ).
			         then(() => app.electron.ipcRenderer.send('open-editor', {
                 screenshot: 'file://' + path.join(__dirname, '../fixtures/screenshot.png'),
                 src: saverJSON
               })).
			         then(() => app.client.windowByIndex(1));
	});

	afterEach(() => {
		if (app && app.isRunning()) {
			return app.stop();
		}
	});

  it('opens window', function() {
    return app.client.waitUntilWindowLoaded().getTitle().
        then((res) => {
          assert.equal('Before Dawn -- Editor!', res);
        });
  });
  
  it('shows settings form', function(done) {
    app.client.waitUntilWindowLoaded().
        then(() => app.client.click("a.settings")).
        then(() => app.client.getText('body')).
        then((text) => {
          assert(text.lastIndexOf('You can enter the basics about this screensaver here') !== -1);
        }).
        then(() => app.client.getValue(".basic-attributes [name='name']")).
        then((res) => {
          assert.equal('Screensaver One', res);
        }).
        then(() => app.client.setValue(".basic-attributes [name='name']", 'A New Name!!!')).
        then(() => app.client.setValue(".basic-attributes [name='description']", 'A Thing I Made?')).
        then(() => app.client.click("button.save")).
        then(() => {
          var data = JSON.parse(fs.readFileSync(saverJSON));
          assert.equal('A New Name!!!', data.name);
        }).
        then(() => {
          done();
        });
  });

  it('adds and removes options', function(done) {
    app.client.waitUntilWindowLoaded().
        then(() => app.client.click("a.settings")).
        then(() => app.client.setValue(".entry[data-key='0'] [name='name']", 'My Option')).
        then(() => app.client.setValue(".entry [name='description']", 'An Option I Guess?')).
        then(() => app.client.click("button.add-option")).
        then(() => app.client.setValue(".entry[data-key='1'] [name='name']", 'My Second Option')).
        then(() => app.client.setValue(".entry[data-key='1'] [name='description']", 'Another Option I Guess?')).        
        then(() => app.client.click("button.add-option")).
        then(() => app.client.setValue(".entry[data-key='2'] [name='name']", 'My Third Option')).
        then(() => app.client.setValue(".entry[data-key='2'] [name='description']", 'Here We Go Again')).
        then(() => app.client.click("button.save")).
        then(() => {
          var data = JSON.parse(fs.readFileSync(saverJSON));

          var opt = data.options[0];
          assert.equal('My Option', opt.name);
          assert.equal('An Option I Guess?', opt.description);

          opt = data.options[1];
          assert.equal('My Second Option', opt.name);
          assert.equal('Another Option I Guess?', opt.description);
        }).
        then(() => app.client.click(".entry[data-key='1'] button.remove-option")).
        then(() => app.client.click("button.save")).
        then(() => {
          var data = JSON.parse(fs.readFileSync(saverJSON));

          var opt = data.options[0];
          assert.equal('My Option', opt.name);
          assert.equal('An Option I Guess?', opt.description);

          opt = data.options[1];
          assert.equal('My Third Option', opt.name);
          assert.equal('Here We Go Again', opt.description);
        }).

        then(done);
  });

  it('works with new screensaver');
});
