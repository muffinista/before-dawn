"use strict";

const assert = require("assert");
const sinon = require("sinon");
const helpers = require("../helpers.js");

const rimraf = require("rimraf");
const fs = require("fs-extra");
const path = require("path");

const SaverPrefs = require("../../src/lib/prefs.js");
const SaverListManager = require("../../src/lib/saver-list.js");

var sandbox;

describe("SaverListManager", function() { 
  var savers;
  var prefs;
  
  var workingDir;
  var saversDir;
  var systemDir;
  var saverJSONFile;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();

    // this will be the working directory of the app
    workingDir = helpers.getTempDir();

    // this will be the separate directory to hold screensavers
    saversDir = helpers.getTempDir();

    saverJSONFile = helpers.addSaver(saversDir, "saver");
    helpers.addSaver(saversDir, "saver2");    

    systemDir = path.join(workingDir, "system-savers");
    fs.mkdirSync(systemDir);

    helpers.addSaver(systemDir, "random-saver");
    helpers.addSaver(systemDir, "__template");    

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

  describe("setup", () => {
    it("works", (done) => {
      savers.setup().then((results) => {
        assert(results.first);
        assert(results.setup);

        done();
      });
    });
  });

  describe("reload", () => {
    it("works", (done) => {
      savers.reload(true).then(() => {
        done();
      });
    });
  });
  
  describe("loadFromFile", function() {
    it("loads data", function(done) {
      savers.loadFromFile(saverJSONFile).then((s) => {
        assert.equal("Screensaver One", s.name);
        done();
      });
    });
    
    it("applies options", function(done) {
      savers.loadFromFile(saverJSONFile, { "New Option I Guess": "25" }).then((s) => {
        assert.equal(s.settings["New Option I Guess"], "25");
        done();
      });
    });

    it("rejects bad json", function(done) {
      var f = path.join(__dirname, "../fixtures/index.html");
      savers.loadFromFile(f, false, { "New Option I Guess": "25" }).
             then(() => {
               done(new Error("Expected method to reject."));               
             }).
             catch((err) => {
               assert(typeof(err) !== "undefined");
               done();
             }).
             catch(done);
    });

    it("rejects invalid savers", (done) => {
      var f = path.join(__dirname, "../fixtures/invalid.json");
      savers.loadFromFile(f, false, {}).
        then(() => {
          done(new Error("Expected method to reject."));               
        }).
        catch(() => {
          done();
        });
    });

    it("adds requirements if missing", (done) => {
      var f = path.join(__dirname, "../fixtures/no-requirements.json");
      savers.loadFromFile(f, false, {}).then((s) => {
        assert.deepEqual(["screen"], s.requirements);
        done();
      });
    });
  });
  
  describe("list", function() {
    it("loads data", async function() {
      const data = await savers.list();
      assert.equal(3, data.length);
    });

    it("handles bad data", async () => {
      helpers.addSaver(saversDir, "invalid", "invalid.json");
      const data = await savers.list();
      assert.equal(3, data.length);
    });

    it("uses cache", async () => {
      let cache = [0, 1, 2, 3, 4, 5];
      savers.loadedScreensavers = cache;
      const data = await savers.list();
      assert.deepEqual(cache, data);
    });

    it("forces reset", async () => {
      let cache = [0, 1, 2, 3, 4, 5];
      savers.loadedScreensavers = cache;
      const data = await savers.list(true);

      assert.notDeepEqual(cache, data);
      assert.equal(3, data.length);
    });
  });

  describe("reset", function() {
    it("resets cache", async function() {
      await savers.list();
      assert.equal(3, savers.loadedScreensavers.length);
      savers.reset();
      assert.equal(0, savers.loadedScreensavers.length);
    });
  });

  describe("random", function() {
    it("returns something", async function() {
      const data = await savers.list();

      assert.equal(3, data.length);
      let foo = savers.random();
      assert(foo.key !== undefined);
    });
  });

  describe("confirmExists", function() {
    it("returns true if present", function(done) {
      let key = path.join(saversDir, "saver2", "saver.json");    
      savers.confirmExists(key).then((result) => {
        assert(result);
        done();
      });
    });

    it("returns false if not present", function(done) {
      let key = "junk";
      savers.confirmExists(key).then((result) => {
        assert(!result);
        done();
      });
    });
  });

  describe("getByKey", function() {
    it("returns saver", async function() {
      const data = await savers.list();
      var key = data[2].key;
      var s = savers.getByKey(key);
      assert.equal("Screensaver One", s.name);
    });
  });

  describe("delete", () => {
    it("can delete if editable", async function() {
      const data = await savers.list();

      let s = data.find(s => s.editable);
      const result = await savers.delete(s);
      assert(result);
    });

    it("doesn't delete if not editable", async function() {
      const data = await savers.list();

      let s = data.find(s => !s.editable);
      try {
        await savers.delete(s);
      }
      catch(e) {
        assert(true);
      }
    });
  });
});
