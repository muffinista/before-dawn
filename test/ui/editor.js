'use strict';

const assert = require('assert');
const fs = require('fs-extra');
const path = require('path');
const tmp = require('tmp');
const helpers = require('./setup.js');

var workingDir = helpers.getTempDir();
const app = helpers.application(workingDir);

var saverJSON;

describe('Editor', function() {
  helpers.setupTimeout(this);
 
	beforeEach(() => {
    var saversDir = helpers.getTempDir();
    // make a subdir in the savers directory and drop screensaver
    // config there
    var testSaverDir = path.join(saversDir, 'saver');
    fs.mkdirSync(testSaverDir);
    saverJSON = path.join(testSaverDir, 'saver.json');
    var saverHTML = path.join(testSaverDir, 'index.html');    

    fs.copySync(path.join(__dirname, '../fixtures/saver.json'), saverJSON);
    fs.copySync(path.join(__dirname, '../fixtures/index.html'), saverHTML);    

    // @todo update
		return app.start().
               then(() => app.client.waitUntilWindowLoaded() ).
			         then(() => app.client.electron.ipcRenderer.send('open-editor', {
                 screenshot: 'file://' + path.join(__dirname, '../fixtures/screenshot.png'),
                 src: saverJSON
               })).
			         then(() => app.client.windowByIndex(1));
	});

	afterEach(() => {
    return helpers.stopApp(app);
	});

  it('opens window', function() {
    return app.client.waitUntilWindowLoaded().
               getTitle().
               then((res) => {
                 assert.equal('Before Dawn: Editor', res);
               });
  });
  
  it('shows settings form', function(done) {
    app.client.waitUntilWindowLoaded().
        then(() => app.client.click("=Settings")).
        then(() => app.client.getValue("#saver-form [name='name']")).
        then((res) => {
          assert.equal('Screensaver One', res);
        }).
        then(() => app.client.setValue("#saver-form [name='name']", 'A New Name!!!')).
        then(() => app.client.setValue("#saver-form [name='description']", 'A Thing I Made?')).
        then(() => app.client.click("button.save")).
        /* then(() => app.client.getMainProcessLogs()).
           then(function (logs) {
           logs.forEach(function (log) {
           console.log(log);
           })
           }).
           then(() => app.client.getRenderProcessLogs()).
           then(function (logs) {
           logs.forEach(function (log) {
           console.log(log.message)
           })
           }).*/
                   
        then(() => {
          var p = new Promise( (resolve, reject) => {
            setTimeout(() => {
              var x = JSON.parse(fs.readFileSync(saverJSON)).name;
              resolve(x);
            }, 1000);
          });

          return p;
        }).
        then((res) => { assert.equal(res, "A New Name!!!"); }).
        then(() => {
          done();
        });
  });

  it('adds and removes options', function(done) {
    app.client.waitUntilWindowLoaded().
        then(() => app.client.click("=Settings")).
        then(() => app.client.setValue(".entry[data-index='0'] [name='name']", 'My Option')).
        then(() => app.client.setValue(".entry[data-index='0'] [name='description']", 'An Option I Guess?')).
        then(() => app.client.click("button.add-option")).
        then(() => app.client.setValue(".entry[data-index='1'] [name='name']", 'My Second Option')).
        then(() => app.client.setValue(".entry[data-index='1'] [name='description']", 'Another Option I Guess?')).
        then(() => app.client.selectByVisibleText(".entry[data-index='1'] select", 'yes/no')).
        then(() => app.client.click("button.add-option")).
        then(() => app.client.setValue(".entry[data-index='2'] [name='name']", 'My Third Option')).
        then(() => app.client.setValue(".entry[data-index='2'] [name='description']", 'Here We Go Again')).
        then(() => app.client.selectByVisibleText(".entry[data-index='2'] select", 'slider')).
        then(() => app.client.click("button.save")).
        then(() => {
          var p = new Promise( (resolve, reject) => {
            setTimeout(() => {
              var x = JSON.parse(fs.readFileSync(saverJSON));
              resolve(x);
            }, 1000);
          });

          return p;
        }).
        then((data) => {
          var opt = data.options[0];
          assert.equal('My Option', opt.name);
          assert.equal('An Option I Guess?', opt.description);
          assert.equal('text', opt.type);

          opt = data.options[1];
          assert.equal('My Second Option', opt.name);
          assert.equal('Another Option I Guess?', opt.description);
          assert.equal('boolean', opt.type);

          opt = data.options[2];
          assert.equal('My Third Option', opt.name);
          assert.equal('Here We Go Again', opt.description);
          assert.equal('slider', opt.type);
        }).
        then(() => app.client.click(".entry[data-index='1'] button.remove-option")).
        then(() => app.client.click("button.save")).
        then(() => {
          var p = new Promise( (resolve, reject) => {
            setTimeout(() => {
              var x = JSON.parse(fs.readFileSync(saverJSON));
              resolve(x);
            }, 1000);
          });

          return p;
        }).
        then((data) => {
          var opt = data.options[0];
          assert.equal('My Option', opt.name);
          assert.equal('An Option I Guess?', opt.description);
          assert.equal('text', opt.type);
          
          opt = data.options[1];
          assert.equal('My Third Option', opt.name);
          assert.equal('Here We Go Again', opt.description);
          assert.equal('slider', opt.type);
        }).
        then(done);
  });

  it('works with new screensaver');
});
