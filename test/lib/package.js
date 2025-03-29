"use strict";

import assert from 'assert';
import path from "path";
import fs from "fs";
import * as tmp from "tmp";
import { rimrafSync } from 'rimraf'
import sinon from "sinon";
import nock from "nock";

import Package from "../../src/lib/package.js";

import * as helpers from "../helpers.js";


import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

var attrs;

var workingDir;
var dataPath;
var zipPath;

var sandbox;

describe("Package", function() {
  beforeEach(function() {
    sandbox = sinon.createSandbox();

    workingDir = helpers.getTempDir();
    dataPath = path.join(__dirname, "..", "fixtures", "release.json");
    const saverZipSource = path.join(__dirname, "..", "fixtures", "test-savers.zip");

    zipPath =  path.join(tmp.dirSync().name, "test-savers.zip");
    fs.copyFileSync(saverZipSource, zipPath);


    attrs = {
      repo: "muffinista/before-dawn-screensavers",
      dest: workingDir
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

  describe("getReleaseInfo", function() {
    describe("withValidResponse", function() {
      it("does stuff", async function() {
        nock("https://api.github.com").
          get("/repos/muffinista/before-dawn-screensavers/releases/latest").
          replyWithFile(200, dataPath, {
            "Content-Type": "application/json",
        });
  
        var p = new Package(attrs);
        let results = await p.getReleaseInfo();
        console.log(results);
        assert.equal("muffinista", results.author.login);
      });
    });

    describe("withReject", function() {
      it("survives", async function() {
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

  describe("checkLatestRelease", function() {
    var p;

    describe("remote package", function() {
      beforeEach(function() {
        p = new Package(attrs);
      });
      
      it("calls downloadFile", async function() {
        const data = JSON.parse(fs.readFileSync("./test/fixtures/release.json"));
        sandbox.stub(p, "getReleaseInfo").
          returns(data);

        var df = sandbox.stub(p, "downloadFile").resolves(zipPath);
        sandbox.stub(p, "zipToSavers").resolves({});

        await p.checkLatestRelease();
        assert(df.calledOnce);
      });

      it("doesnt call if not needed", async function() {
        const data = JSON.parse(fs.readFileSync("./test/fixtures/release-no-update.json"));
        sandbox.stub(p, "getReleaseInfo").
          returns(data);

        var cb = sinon.spy();
        var df = sandbox.stub(p, "downloadFile");
        
        await p.checkLatestRelease(cb);
        assert(!df.calledOnce);
      });
    });
  });

  describe("downloadFile", function() {
    var testUrl = "https://test.file/savers.zip";

    beforeEach(function() {
      nock("https://test.file").
                        get("/savers.zip").
       reply(200, () => {
         return fs.createReadStream(zipPath);
       });
      rimrafSync(workingDir);
      fs.mkdirSync(workingDir);
    });

    it("works", async function() {
      let p = new Package(attrs);
      const dest = await p.downloadFile(testUrl);
      assert(fs.existsSync(dest));
    });
  });

  describe("zipToSavers", function() {
    var p;

    beforeEach(function() {
      p = new Package(attrs);
      rimrafSync(workingDir);
      fs.mkdirSync(workingDir);
    });

    it("unzips files", async function() {
      if (process.platform == "darwin") {
        this.skip();
      }
      
      await p.zipToSavers(zipPath);

      var testDest = path.resolve(workingDir, "sparks", "index.html");
      assert(fs.existsSync(testDest));
    });

    it("recovers from errors", function(done) {
      if (process.platform == "darwin") {
        this.skip();
      }

      p.zipToSavers(dataPath).
        then(() => {}).
        catch( () => {
          done();
        });
    });

    it("keeps files on failure", function(done) {
      if (process.platform == "darwin") {
        this.skip();
      }

      helpers.addSaver(workingDir, "saver-one", "saver.json");
      
      var testDest = path.resolve(workingDir, "saver-one", "saver.json");
      assert(fs.existsSync(testDest));
      
      p.zipToSavers(dataPath).catch( () => {
        assert(fs.existsSync(testDest));
        done();
      });
    });


    it("removes files that arent needed", function(done) {
      if (process.platform == "darwin") {
        this.skip();
      }

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
