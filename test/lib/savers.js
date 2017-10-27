'use strict';

const assert = require('assert');
const Saver = require('../../app/lib/savers.js');
const _ = require('lodash');
const tmp = require('tmp');
const rimraf = require('rimraf');
const fs = require('fs-extra');
const path = require('path');

describe('Savers', function() {
  var savers = require('../../app/lib/savers.js');
  var saverData;
  var configData;

  var getTempDir = function() {
    var tmpObj = tmp.dirSync();
    return tmpObj.name;
  };

  var workingDir;
  var saversDir;
  var saverJSONFile;
  
  beforeEach(function() {
    var testSaverDir;

    workingDir = getTempDir();
    saversDir = getTempDir();

    // make a subdir in the savers directory and drop screensaver
    // config there
    testSaverDir = path.join(saversDir, 'saver');
    fs.mkdirSync(testSaverDir);
    saverJSONFile = path.join(testSaverDir, 'saver.json');
    fs.copySync(path.join(__dirname, '../fixtures/saver.json'), saverJSONFile);

    testSaverDir = path.join(saversDir, 'saver2');
    fs.mkdirSync(testSaverDir);
    fs.copySync(path.join(__dirname, '../fixtures/saver2.json'), path.join(testSaverDir, 'saver.json'));

    saverData = require('../fixtures/saver.json');
  });

  afterEach(function() {
    if ( fs.existsSync(workingDir) ) {
      rimraf.sync(workingDir);
    }
  });
  
	describe('initialization', function() {
    it('sets firstLoad', function(done) {
      savers.init(workingDir, function() {
        assert(savers.firstLoad());
        done();
      });
    });

    /* it('does not set firstLoad', function(done) {
       savers.init(workingDir, function() {
       savers.init(workingDir, function() {
       assert(!savers.firstLoad());
       done();
       });
       });
       });
     */
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
      savers.init(workingDir, function() {
        savers.setLocalSource(saversDir);
        savers.listAll(function(data) {
          assert.equal(3, data.length);
          done();
        });
      });
    });
  });

  describe('applyPreload/getRandomScreensaver', function() {
    it('works for random', function(done) {
      savers.init(workingDir, function() {
        savers.listAll(function(data) {
          var s = {
            preload:"random"
          };
          var s2 = savers.applyPreload(s);
          assert.notDeepEqual(s, s2);
          done();
        });
      });
    });

    it('works for non-random', function(done) {
      savers.init(workingDir, function() {
        savers.listAll(function(data) {
          var s = {
            name:"hello"
          };
          var s2 = savers.applyPreload(s);
          assert.deepEqual(s, s2);
          done();
        });
      });
    });
  });

  describe('getConfig', function() {
    it('returns object', function(done) {
      savers.init(workingDir, function() {
        savers.setLocalSource(saversDir);
        savers.write(function() {
          savers.getConfig(function(data) {
            assert.equal(saversDir, data.localSource);
            done();
          });
        });
      });
    });
  });
  
  describe('generateScreensaver', function() {
    it('works', function(done) {
      savers.init(workingDir, function() {
        savers.setLocalSource(saversDir);
        savers.generateScreensaver({
          name:"New Screensaver"
        });

        savers.listAll(function(data) {
          assert.equal(4, data.length);
          done();
        });
      });
    });

    it('throws exception', function(done) {
      savers.init(workingDir, function() {
        assert.throws(
          () => {
            savers.generateScreensaver({
              name:"New Screensaver"
            })
          },
          Error);
        done();
      });

    });
  });

  describe('getByKey', function() {
    it("returns saver", function(done) {
      savers.init(workingDir, function() {
        savers.setLocalSource(saversDir);
        savers.listAll(function(data) {
          var key = data[2].key;
          var s = savers.getByKey(key);
          assert.equal("Screensaver One", s.name);
          done();
        });
      });
    });
  });

  describe('setCurrent', function() {
    it("sets a key", function(done) {
      savers.init(workingDir, function() {
        savers.setLocalSource(saversDir);
        savers.listAll(function(data) {
          var key = data[2].key;
          savers.setCurrent(key);
          assert.equal(key, savers.getCurrent());
          savers.write(function() {
            savers.reload(function() {
              assert.equal(key, savers.getCurrent());
              done();
            });
          });
        });
      });
    });
  });

  describe('initFromList', function() {
    it("loads data", function(done) {
      var list = [
        saverData,
        saverData,
        saverData,
        saverData,
        saverData
      ];

      savers.initFromList(workingDir, list, function() {
        savers.listAll(function(data) {
          var s = data[0];
          assert.equal("Screensaver One", s.name);
          assert.equal(5, data.length);
          done();
        });
      });
    });
  });

  describe('toList', function() {
    it("outputs data", function(done) {
      var list = [
        saverData,
        saverData,
        saverData,
        saverData,        
        saverData,
        saverData
      ];

      savers.initFromList(workingDir, list, function() {
        savers.toList(function(output) {
          assert.deepEqual(output, list);
          assert.equal(6, output.length);
          done();
        });
      });
    });
  });

  describe('getSource/setSource', function() {
    it("works", function(done) {
      savers.init(workingDir, function() {
        savers.setSource("foo");
        assert.deepEqual({repo: "foo"}, savers.getSource());
        done();
      });
    });
  });
  
  describe('getCurrent/setCurrent', function() {
    it("works", function(done) {
      savers.init(workingDir, function() {
        savers.setCurrent("foo");
        assert.equal("foo", savers.getCurrent());
        done();
      });
    });

    it("also applies options", function(done) {
      savers.init(workingDir, function() {
        savers.setCurrent("foo", {bar: "baz"});
        assert.equal("foo", savers.getCurrent());
        assert.deepEqual({bar:"baz"}, savers.getOptions("foo"));
        done();
      });
    });
  });

  describe('getOptions/setOptions', function() {
    it("works", function(done) {
      savers.init(workingDir, function() {
        savers.setOptions({bar: "baz"}, "foo");
        assert.deepEqual({bar:"baz"}, savers.getOptions("foo"));
        done();
      });
    });

    it("updates default", function(done) {
      savers.init(workingDir, function() {
        savers.setOptions({bar: "baz"});
        assert.deepEqual({bar:"baz"}, savers.getOptions());
        done();
      });
    });
  });
  
  describe('getDelay/setDelay', function() {
    it("works", function(done) {
      savers.init(workingDir, function() {
        savers.setDelay(420);
        assert.equal(420, savers.getDelay());
        done();
      });
    });

    it("defaults", function(done) {
      savers.init(workingDir, function() {
        assert.equal(15, savers.getDelay());
        done();
      });
    });
  });
  
  describe('getSleep/setSleep', function() {
    it("works", function(done) {
      savers.init(workingDir, function() {
        savers.setSleep(420);
        assert.equal(420, savers.getSleep());
        done();
      });
    });

    it("defaults", function(done) {
      savers.init(workingDir, function() {
        assert.equal(15, savers.getSleep());
        done();
      });
    });
  });
  
  describe('getLock/setLock', function() {
    it("works", function(done) {
      savers.init(workingDir, function() {
        savers.setLock(true);
        assert.equal(true, savers.getLock());
        done();
      });
    });

    it("defaults", function(done) {
      savers.init(workingDir, function() {
        assert.equal(false, savers.getLock());
        done();
      });
    });
  });
  
  describe('getDisableOnBattery/setDisableOnBattery', function() {
    it("works", function(done) {
      savers.init(workingDir, function() {
        savers.setDisableOnBattery(true);
        assert.equal(true, savers.getDisableOnBattery());
        done();
      });
    });

    it("defaults", function(done) {
      savers.init(workingDir, function() {
        assert.equal(false, savers.getDisableOnBattery());
        done();
      });
    });
  });

  describe('getCurrent/setCurrent', function() {
    it("works", function(done) {
      savers.init(workingDir, function() {
        done();
      });
    });
  });

  describe('getCurrent/setCurrent', function() {
    it("works", function(done) {
      savers.init(workingDir, function() {
        done();
      });
    });
  });
  
  // reset
  // load
  // default source
  // sources
  // write
});