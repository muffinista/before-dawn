'use strict';

const assert = require('assert');
const Package = require('../../app/lib/package.js');
//const _ = require('lodash');
//const tmp = require('tmp');
//const path = require('path');
//const fs = require('fs');

const helpers = require('./setup.js');
var workingDir = helpers.getTempDir();

describe('Package', function() {
	describe('initialization', function() {
    it('loads data', function() {
      var p = new Package({
        repo:"foo",
        dest:workingDir
      });

			assert.equal(false, p.downloaded);
			assert.equal(false, p.attrs().downloaded);      

      assert.equal(workingDir, p.dest);
      assert.equal(workingDir, p.attrs().dest);      
		});
  });

  // url
  
  //   this.checkLatestRelease = function(cb) {

  //   this.downloadFile = function(url, cb) {

  // this.downloadifstale
  
});
