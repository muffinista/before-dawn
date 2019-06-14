"use strict";

const assert = require("assert");
const helpers = require("../helpers.js");

const SaverPrefs = require("../../src/lib/prefs.js");
const PackageDownloader = require("../../src/lib/package-downloader.js");
const Package = require("../../src/lib/package.js");

const fs = require("fs-extra");
const rimraf = require("rimraf");

const sinon = require("sinon");

var sandbox;

describe("PackageDownloader", function() {
  helpers.setupTest(this);


  var pd;
  var fakePackage;
  var workingDir;
  var prefs;

  var attrs = {
    repo: "muffinista/before-dawn-screensavers",
    dest: workingDir
  };
  
  beforeEach(() => {
    sandbox = sinon.createSandbox();
    workingDir = helpers.getTempDir();

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

  describe("getPackage", function() {
    it("gets package details from prefs", () => {
      let tmp = new Date(0);
      prefs.sourceRepo = "foo/bar";
      prefs.sourceUpdatedAt = tmp;

      let result = pd.getPackage();
      assert.equal("foo/bar", result.repo);
      assert.deepEqual(tmp, result.updated_at);
    });
  });

  describe("updatePackage", function() {
    it("handles undefined package", (done) => {
      prefs.sourceRepo = "";
      pd.updatePackage(undefined).then((result) => {
        assert(!result.downloaded);
        done();
      });
    });

    it("gets package if stale", (done) => {
      var oldCheckTime = new Date(2010, 1, 1);
      prefs.updateCheckTimestamp = oldCheckTime;
  
      sandbox.stub(fakePackage, "checkLatestRelease").resolves({downloaded:true});

      pd.updatePackage(fakePackage).then((result) => {
        assert(result.downloaded);
        assert(prefs.updateCheckTimestamp > oldCheckTime);
        done();
      });
    });

    it("skips download if fresh", (done) => {
      var now = new Date().getTime();
      sandbox.stub(fakePackage, "checkLatestRelease").resolves();

      prefs.updateCheckTimestamp = now;
      pd.updatePackage(fakePackage).then((result) => {
        assert(!result.downloaded);
        done();
      });
    });

    it("handles package failure", (done) => {
      var oldCheckTime = new Date(2010, 1, 1);
      prefs.updateCheckTimestamp = oldCheckTime;

      sandbox.stub(fakePackage, "getReleaseInfo").resolves({
        published_at: new Date(2011, 1, 1)
      });

      sandbox.stub(fakePackage, "downloadFile").rejects();
      pd.updatePackage(fakePackage).
        catch(() => { done(); });
    });
  });
});

