'use strict';

const assert = require('assert');
const Saver = require('../../app/lib/savers.js');
const _ = require('lodash');
const tmp = require('tmp');
const rimraf = require('rimraf');
const fs = require('fs');

describe('Savers', function() {
  var savers = require('../../app/lib/savers.js');
  var saverData;
  var configData;

  var getTempDir = function() {
    var tmpObj = tmp.dirSync();
    return tmpObj.name;
  };

  var workingDir;

  beforeEach(function() {
    saverData = require('../fixtures/saver.json');
    workingDir = getTempDir();
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
      });

      done();
    });

    it('does not set firstLoad', function(done) {
      savers.init(workingDir, function() {
        savers.init(workingDir, function() {
          assert(!savers.firstLoad());
        });
      });

      done();
    });

    it('loads data');
  });
});
