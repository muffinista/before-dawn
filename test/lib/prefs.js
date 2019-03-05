"use strict";

const tmp = require("tmp");
const fs = require("fs-extra");
const path = require("path");
const assert = require("assert");

const helpers = require("../helpers.js");

const SaverPrefs = require("../../src/lib/prefs.js");


describe("SaverPrefs", () => {
  var tmpdir, prefs;

  beforeEach(() => {
    tmpdir = tmp.dirSync().name;
  });

  describe("without config", () => {
    beforeEach(() => {
      prefs = new SaverPrefs({baseDir: tmpdir});
    });

    it("should load", () => {
      assert(prefs.needSetup);
    });

    it("should set noSource", () => {
      assert(prefs.noSource);
    });
  });

  describe("with config", () => {
    it("recovers from corrupt config", () => {
      helpers.specifyConfig(tmpdir, "bad-config");
      prefs = new SaverPrefs({baseDir: tmpdir});

      assert(prefs.firstLoad);
      let configDest = path.join(tmpdir, "config.json");
      assert(fs.existsSync(configDest));
    });

    it("works with existing config", () => {
      helpers.specifyConfig(tmpdir, "config");
      prefs = new SaverPrefs({baseDir: tmpdir});

      assert(!prefs.firstLoad);
      let configDest = path.join(tmpdir, "config.json");
      assert(fs.existsSync(configDest));
    });
  });

  // reload
  describe("reload", () => {
    beforeEach(() => {
      helpers.specifyConfig(tmpdir, "config");
      prefs = new SaverPrefs({baseDir: tmpdir});
    });
  
    it("works with existing config", () => {
      helpers.specifyConfig(tmpdir, "config");
      prefs = new SaverPrefs({baseDir: tmpdir});

      assert.equal("before-dawn-screensavers/emoji/saver.json", prefs.current);
      let configDest = path.join(tmpdir, "config.json");
      assert(fs.existsSync(configDest));


      helpers.specifyConfig(tmpdir, "config-2");
      prefs.reload();
      assert.equal("before-dawn-screensavers/blur/saver.json", prefs.current);
      assert(fs.existsSync(configDest));
    });
  });

  describe("needSetup", function() {
    it("is false with config", () => {
      helpers.specifyConfig(tmpdir, "config");
      prefs = new SaverPrefs({baseDir: tmpdir});
  
      assert(!prefs.needSetup);
    });

    it("is true with noSource", () => {
      prefs = new SaverPrefs({baseDir: tmpdir});
      assert(prefs.noSource);
      assert(prefs.needSetup);
    });

    it("is true if current is undefined", () => {
      helpers.specifyConfig(tmpdir, "config");
      prefs = new SaverPrefs({baseDir: tmpdir});

      assert(!prefs.needSetup);

      prefs.current = undefined;
      assert(prefs.needSetup);
    });

    it("is true if current is blank", () => {
      helpers.specifyConfig(tmpdir, "config");
      prefs = new SaverPrefs({baseDir: tmpdir});
  
      assert(!prefs.needSetup);
      prefs.current = "";
      assert(prefs.needSetup);
    });
  });

  // no source
  describe("noSource", () => {
    describe("without config", () => {
      it("is true", () => {
        prefs = new SaverPrefs({baseDir: tmpdir});
        assert(prefs.noSource);
      });
    });

    describe("with config", () => {
      beforeEach(() => {
        helpers.specifyConfig(tmpdir, "config");
        prefs = new SaverPrefs({baseDir: tmpdir});
      });

      it("is true if no source repo and no local source", () => {
        prefs.sourceRepo = undefined;
        prefs.localSource = undefined;
        assert(prefs.noSource);

        prefs.sourceRepo = "";
        prefs.localSource = "";
        assert(prefs.noSource);
      });

      it("is false if source repo", () => {
        prefs.sourceRepo = "foo";
        prefs.localSource = undefined;

        assert(!prefs.noSource);
      });

      it("is false if local source", () => {
        prefs.sourceRepo = undefined;
        prefs.localSource = "foo";

        assert(!prefs.noSource);
      });
    });
  });


  // defaultSaversDir
  describe("defaultSaversDir", () => {
    beforeEach(() => {
      prefs = new SaverPrefs({baseDir: tmpdir});
    });

    it("is the working directory", () => {
      let dest = path.join(tmpdir, "savers");
      assert.equal(dest, prefs.defaultSaversDir);
    });
  });

  // toHash
  describe("toHash", () => {
    beforeEach(() => {
      helpers.specifyConfig(tmpdir, "config");
      prefs = new SaverPrefs({baseDir: tmpdir});
    });

    it("works", () => {
      let data = prefs.toHash();
      assert.equal("before-dawn-screensavers/emoji/saver.json", data.saver);
      assert.equal(10, data.delay);
    });
  });

  // ensureDefaults
  describe("ensureDefaults", () => {
    beforeEach(() => {
      prefs = new SaverPrefs({baseDir: tmpdir});
    });

    it("works", () => {
      prefs.delay = undefined;
      prefs.sleep = undefined;

      // @todo this doesn't actually do anything because
      // of the way the getters work now

      prefs.ensureDefaults();
      assert.equal(5, prefs.delay);
      assert.equal(10, prefs.sleep);
    });
  });

  // sources
  describe("sources", () => {
    let systemDir;
    beforeEach(() => {
      helpers.specifyConfig(tmpdir, "config");
      prefs = new SaverPrefs({baseDir: tmpdir});
      systemDir = path.join(tmpdir, "system-savers");
    });

    it("includes localSource", () => {
      let localSourceDir = helpers.getTempDir();
      prefs.localSource = localSourceDir;

      let result = prefs.sources;
      assert.deepEqual(
        [ localSourceDir, systemDir ], result);
    });

    it("includes repo", () => {
      prefs.sourceRepo = "foo";
      let result = prefs.sources;
      let dest = path.join(tmpdir, "savers");

      assert.deepEqual(
        [ dest, systemDir ], result);
    });

    it("includes both repo and localsource", () => {
      let saversDir = path.join(tmpdir, "savers");
      let localSourceDir = helpers.getTempDir();

      prefs.localSource = localSourceDir;
      prefs.sourceRepo = "foo";


      let result = prefs.sources;
      assert.deepEqual(
        [ saversDir, localSourceDir, systemDir ], result);
    });

    it("includes system", () => {
      fs.mkdirSync(systemDir);
      let result = prefs.sources;

      assert.deepEqual(
        [ systemDir ], result);
    });
  });

  // systemSource
  describe("sources", () => {
    beforeEach(() => {
      prefs = new SaverPrefs({baseDir: tmpdir});
    });

    it("works", () => {
      let expected = path.join(tmpdir, "system-savers");
      assert.equal(expected, prefs.systemSource);
    });
  });

  // getOptions
  describe("getOptions", () => {
    beforeEach(() => {
      helpers.specifyConfig(tmpdir, "config-with-options");
      prefs = new SaverPrefs({baseDir: tmpdir});
    });

    it("works without key", () => {
      let opts = prefs.getOptions();
      assert.deepEqual({ foo: "bar", level: 100 }, opts);
    });

    it("works with key", () => {
      let opts = prefs.getOptions("/Users/colin/Projects/before-dawn-screensavers/key/saver.json");
      assert.deepEqual({ baz: "boo", level: 10 }, opts);
    });

    it("returns empty hash when key is undefined", () => {
      prefs.current = undefined;
      let opts = prefs.getOptions();
      assert.deepEqual({}, opts);
    });
  });

  // write
  describe("write", () => {
    beforeEach(() => {
      prefs = new SaverPrefs({baseDir: tmpdir});
    });

    it("works", (done) => {
      let data = helpers.prefsToJSON(tmpdir);
      assert.notEqual(data.delay, 123);

      prefs.delay = 123;
      prefs.write(() => {
        data = helpers.prefsToJSON(tmpdir);
        assert.equal(data.delay, 123);

        done();
      });
    });
  });

  // writeSync
  describe("writeSync", () => {
    beforeEach(() => {
      prefs = new SaverPrefs({baseDir: tmpdir});
    });

    it("works", () => {
      let data = helpers.prefsToJSON(tmpdir);
      assert.notEqual(data.delay, 123);

      prefs.delay = 123;
      prefs.writeSync();
      
      data = helpers.prefsToJSON(tmpdir);
      assert.equal(data.delay, 123);
    });
  });

  // updatePrefs
  describe("updatePrefs", () => {
    beforeEach(() => {
      prefs = new SaverPrefs({baseDir: tmpdir});
    });

    it("works", (done) => {
      let data = helpers.prefsToJSON(tmpdir);
      assert.notEqual(data.delay, 123);

      prefs.updatePrefs({
        delay: 123
      }, () => {
        data = helpers.prefsToJSON(tmpdir);
        assert.equal(data.delay, 123);

        done();
      });
    });
  });

  // setDefaultRepo
  describe("setDefaultRepo", () => {
    beforeEach(() => {
      helpers.specifyConfig(tmpdir, "default-repo");
      prefs = new SaverPrefs({baseDir: tmpdir});
    });

    it("works", () => {
      assert(prefs.sourceUpdatedAt !== undefined);
      prefs.setDefaultRepo("foo/bar");


      assert(prefs.sourceUpdatedAt === undefined);
      assert.equal(prefs.sourceRepo, "foo/bar");
    });
  });

  // getters/setters

});
