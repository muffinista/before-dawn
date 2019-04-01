"use strict";

const assert = require("assert");
const path = require("path");
const fs = require("fs");
const rimraf = require("rimraf");
const sinon = require("sinon");
const nock = require("nock");

const Package = require("../../src/lib/package.js");

const helpers = require("../helpers.js");

var attrs;

var workingDir;
var dataPath;
var zipPath;

var sandbox;

describe("Package", function() {
  beforeEach(() => {
    sandbox = sinon.createSandbox();

    workingDir = helpers.getTempDir();
    dataPath = path.join(__dirname, "..", "fixtures", "release.json");
    zipPath = path.join(__dirname, "..", "fixtures", "test-savers.zip");

    attrs = {
      repo: "muffinista/before-dawn-screensavers",
      dest:workingDir
    };
  });
  afterEach(function () {
    sandbox.restore();
  });

	describe("initialization", function() {
    it("loads data", function() {
      var p = new Package(attrs);

			assert.equal(false, p.downloaded);
			assert.equal(false, p.attrs().downloaded);      

      assert.equal(workingDir, p.dest);
      assert.equal(workingDir, p.attrs().dest);      
		});
  });

  describe("getReleaseInfo", () => {
    describe("withValidResponse", () => {
      it("does stuff", async () => {
        nock("https://api.github.com").
          get("/repos/muffinista/before-dawn-screensavers/releases/latest").
          replyWithFile(200, dataPath, {
            "Content-Type": "application/json",
        });
  
        var p = new Package(attrs);
        let results = await p.getReleaseInfo();
        assert.equal("muffinista", results.author.login);
      });
    });

    describe("withReject", () => {
      it("survives", async () => {
        nock("https://api.github.com").
          get("/repos/muffinista/before-dawn-screensavers/releases/latest").
          replyWithError({
            message: "something awful happened",
            code: "AWFUL_ERROR",
          });
        var p = new Package(attrs);
        let results = await p.getReleaseInfo();
        assert.deepEqual({}, results);
      });
    });
  });

  describe("checkLatestRelease", () => {
    var p;

    describe("remote package", function() {
      beforeEach(() => {
        p = new Package(attrs);
        sandbox.stub(p, "getReleaseInfo").
                returns(require("../fixtures/release.json"));
      });
      
      it("calls downloadFile", async () => {
        var df = sandbox.stub(p, "downloadFile").resolves(zipPath);

        await p.checkLatestRelease();
        assert(df.calledOnce);
      });

      it("doesnt call if not needed", async () => {
        var cb = sinon.spy();
        var df = sandbox.stub(p, "downloadFile");

        p.updated_at = "2017-06-06T23:55:44Z";
        
        await p.checkLatestRelease(cb);
        assert(!df.calledOnce);
      });
    });

    describe("local package", function() {
      beforeEach(() => {
        attrs.local_zip = zipPath;
        p = new Package(attrs);
      });
      
      it("doesnt call downloadFile", async () => {
        var df = sandbox.stub(p, "downloadFile");

        await p.checkLatestRelease();
        assert(!df.calledOnce);
      });
    });
  });

  describe("downloadFile", () => {
    var testUrl = "http://test.file/savers.zip";
    beforeEach(() => {
      nock("http://test.file").
        get("/savers.zip").
        reply(200, () => {
          return fs.createReadStream(zipPath);
        });
      rimraf.sync(workingDir);
      fs.mkdirSync(workingDir);
    });

    it("works", (done) => {
      let p = new Package(attrs);
      p.downloadFile(testUrl).then((dest) => {
        assert(fs.existsSync(dest));
        done();
      });
    });
  });

  describe("zipToSavers", () => {
    var p;

    beforeEach(() => {
      p = new Package(attrs);
      rimraf.sync(workingDir);
      fs.mkdirSync(workingDir);
    });

    it("unzips files", (done) => {
      p.zipToSavers(zipPath).then(() => {
        var testDest = path.resolve(workingDir, "sparks", "index.html");
        assert(fs.existsSync(testDest));
        done();
      });
    });

    it("recovers from errors", (done) => {
      p.zipToSavers(dataPath).
        then(() => {}).
        catch( () => {
          done();
        });
    });

    it("keeps files on failure", (done) => {
      helpers.addSaver(workingDir, "saver-one", "saver.json");
      
      var testDest = path.resolve(workingDir, "saver-one", "saver.json");
      assert(fs.existsSync(testDest));
      
      p.zipToSavers(dataPath).catch( () => {
        assert(fs.existsSync(testDest));
        done();
      });
    });


    it("removes files that arent needed", (done) => {
      helpers.addSaver(workingDir, "saver-one", "saver.json");
      
      var testDest = path.resolve(workingDir, "saver-one", "saver.json");
      assert(fs.existsSync(testDest));


      p.zipToSavers(zipPath).then(() => {
        assert(!fs.existsSync(testDest));
        done();
      });     
    });
  });
  
});
