'use strict';

const assert = require('assert');

const SaverPrefs = require('../../src/lib/prefs.js');
const PackageDownloader = require('../../src/lib/package-downloader.js');
const Package = require('../../src/lib/package.js');

const tmp = require('tmp');
const fs = require('fs-extra');
const rimraf = require('rimraf');

const sinon = require('sinon');

var sandbox;

describe('PackageDownloader', () => {
  var getTempDir = function() {
    return tmp.dirSync().name;
  };

  var pd;
  var fakePackage;
  var workingDir;
  var prefs;

  var attrs = {
    repo: "muffinista/before-dawn-screensavers",
    dest: workingDir
  }
  
  beforeEach(() => {
    sandbox = sinon.createSandbox();
    workingDir = getTempDir();

    prefs = new SaverPrefs(workingDir);
    fakePackage = new Package(attrs);
    pd = new PackageDownloader(prefs);
  });

  afterEach(function() {
    if ( fs.existsSync(workingDir) ) {
      rimraf.sync(workingDir);
    }
    sandbox.restore();
  });


  describe('updatePackage', function() {
    it('gets package if stale', (done) => {
      var oldCheckTime = prefs.updateCheckTimestamp;
      var df = sandbox.stub(fakePackage, 'downloadFile').resolves();
      var zts = sandbox.stub(fakePackage, 'zipToSavers').resolves({});

      pd.updatePackage(fakePackage).then((result) => {
        assert(result.downloaded);
        assert(prefs.updateCheckTimestamp > oldCheckTime);
        done();
      }).catch((err) => {
        console.log("BOOO", err);
      });
    });

    it('skips download if fresh', (done) => {
      var now = new Date().getTime();
      prefs.updateCheckTimestamp = now;
      pd.updatePackage(fakePackage).then((result) => {
        assert(!result.downloaded);
        done();
      });
    });

    it('handles package failure', (done) => {
      var df = sandbox.stub(fakePackage, 'downloadFile').rejects();
      pd.updatePackage(fakePackage).catch((err) => {
        done();
      });
    });
  });
});

