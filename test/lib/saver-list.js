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

  describe('setup', () => {
    it('works', (done) => {
      savers.setup().then((results) => {
        assert(results.first);
        assert(results.setup);

        done();
      })
    });
  });

  describe('reload', () => {
    it('works', (done) => {
      savers.reload(true).then((results) => {
        done();
      })
    });
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
  
  describe('list', function() {
    it('loads data', function(done) {
      savers.list(function(data) {
        assert.equal(3, data.length);
        done();
      });
    });

    it('uses cache', (done) => {
      let cache = [0, 1, 2, 3, 4, 5];
      savers.loadedScreensavers = cache;
      savers.list((data) => {
        assert.deepEqual(cache, data);
        done();
      })
    });

    it('forces reset', (done) => {
      let cache = [0, 1, 2, 3, 4, 5];
      savers.loadedScreensavers = cache;
      savers.list((data) => {
        assert.notDeepEqual(cache, data);
        assert.equal(3, data.length);
        done();
      }, true)
    });
  });

  describe('reset', function() {
    it('resets cache', function(done) {
      savers.list(function(data) {
        assert.equal(3, savers.loadedScreensavers.length);
        savers.reset();
        assert.equal(0, savers.loadedScreensavers.length);

        done();
      });
    });
  });

  describe('random', function() {
    it('returns something', function(done) {
      savers.list(function(data) {
        assert.equal(3, data.length);
        let foo = savers.random();
        assert(foo.key !== undefined)
        done();
      });
    });
  });

  describe('confirmExists', function() {
    it('returns true if present', function(done) {
      let key = path.join(saversDir, 'saver2', 'saver.json');    
      savers.confirmExists(key).then((result) => {
        assert(result);
        done();
      });
    });

    it('returns false if not present', function(done) {
      let key = "junk";
      savers.confirmExists(key).then((result) => {
        assert(!result);
        done();
      });
    });
  });

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

  describe('delete', () => {
    it("can delete if editable", function(done) {
      savers.list(function(data) {
        let s = data.find(s => s.editable);
        savers.delete(s, (result) => {
          assert(result);
          done();
        });
      });
    });

    it("doesn't delete if not editable", function(done) {
      savers.list(function(data) {
        let s = data.find(s => !s.editable);
        savers.delete(s, (result) => {
          assert(!result);
          done();
        });
      });
    });
  });
});
