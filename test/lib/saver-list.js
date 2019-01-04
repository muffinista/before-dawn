'use strict';

const assert = require('assert');
const sinon = require('sinon');

const SaverPrefs = require('../../src/lib/prefs.js');
const SaverListManager = require('../../src/lib/saver-list.js');

const tmp = require('tmp');
const rimraf = require('rimraf');
const fs = require('fs-extra');
const path = require('path');

var sandbox;

describe('SaverListManager', function() { 
  var savers;
  var prefs;

  var getTempDir = function() {
    return tmp.dirSync().name;
  };

  var addSaver = function(dest, name) {
    // make a subdir in the savers directory and drop screensaver
    // config there
    var src = path.join(__dirname, '../fixtures/saver.json');
    var testSaverDir = path.join(dest, name);
    fs.mkdirSync(testSaverDir);

    saverJSONFile = path.join(testSaverDir, 'saver.json');
    fs.copySync(src, saverJSONFile);
  };
  
  var workingDir;
  var saversDir;
  var systemDir;
  var saverJSONFile;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();

    // this will be the working directory of the app
    workingDir = getTempDir();

    // this will be the separate directory to hold screensavers
    saversDir = getTempDir();

    addSaver(saversDir, 'saver');
    addSaver(saversDir, 'saver2');    

    systemDir = path.join(workingDir, 'system-savers');
    fs.mkdirSync(systemDir);

    addSaver(systemDir, 'random-saver');
    addSaver(systemDir, '__template');    

    prefs = new SaverPrefs(workingDir);
    prefs.localSource = saversDir;
    savers = new SaverListManager({
      prefs: prefs
    });
  });

  afterEach(function() {
    if ( fs.existsSync(workingDir) ) {
      rimraf.sync(workingDir);
    }
    sandbox.restore();
  });

  
  describe('loadFromFile', function() {
    it('loads data', function(done) {
      savers.loadFromFile(saverJSONFile).then((s) => {
        assert.equal("Screensaver One", s.name);
        done();
      });
    });
    
    it('applies options', function(done) {
      savers.loadFromFile(saverJSONFile, { 'New Option I Guess': '25' }).then((s) => {
        assert.equal(s.settings['New Option I Guess'], '25');
        done();
      });
    });

    it('rejects bad json', function(done) {
      var f = path.join(__dirname, '../fixtures/index.html');
      savers.loadFromFile(f, false, { 'New Option I Guess': '25' }).
             then(() => {
               done(new Error('Expected method to reject.'));               
             }).
             catch((err) => {
               assert(typeof(err) !== "undefined");
               done();
             }).
             catch(done);
    });
  });
  
  describe('listAll', function() {
    it('loads data', function(done) {
      savers.list(function(data) {
        assert.equal(3, data.length);
        done();
      });
    });
  });

  // describe('applyPreload/getRandomScreensaver', function() {
  //   it('works for random', function(done) {
  //     savers.init(workingDir).then(() => {
  //       savers.listAll(function(data) {
  //         var s = {
  //           preload:"random"
  //         };
  //         var s2 = savers.applyPreload(s);
  //         assert.notDeepEqual(s, s2);
  //         done();
  //       });
  //     });
  //   });

  //   it('works for non-random', function(done) {
  //     savers.init(workingDir).then(() => {
  //       savers.listAll(function(data) {
  //         var s = {
  //           name:"hello"
  //         };
  //         var s2 = savers.applyPreload(s);
  //         assert.deepEqual(s, s2);
  //         done();
  //       });
  //     });
  //   });
  // });


  describe('create', function() {
    it('works', function(done) {

      // this should be the path to our __template in the main app
      var src = path.join(__dirname, "..", "..", "src", "main", "__template");
      savers.create(src,
                                  {
                                    name:"New Screensaver"
                                  });
      
      savers.list(function(data) {
        assert.equal(4, data.length);
        done();
      });
    });

    it('throws exception', function(done) {
      assert.throws(
        () => {
          savers.create({
            name:"New Screensaver"
          })
        },
        Error);
      done();
    });
  });

  describe('getByKey', function() {
    it("returns saver", function(done) {
      savers.list(function(data) {
        var key = data[2].key;
        var s = savers.getByKey(key);
        assert.equal("Screensaver One", s.name);
        done();
      });
    });
  });  
});
