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
      prefs = new SaverPrefs(tmpdir);
    });

    it("should load", () => {
      assert.equal(true, prefs.needSetup);
    });

    it("should set noSource", () => {
      assert.equal(true, prefs.noSource);
    });
  });

  describe("with config", () => {
    // it("recovers from corrupt config", () => {
    //   helpers.specifyConfig(prefs.configFile, "bad-config");
    //   prefs = new SaverPrefs(tmpdir);

    //   assert.equal(true, prefs.firstLoad);
    //   let configDest = path.join(tmpdir, "config.json");
    //   assert.equal(true, fs.existsSync(configDest));
    // });

    // it("works with existing config", () => {
    //   helpers.specifyConfig(prefs.configFile, "config");
    //   prefs = new SaverPrefs(tmpdir);

    //   assert.equal(true, !prefs.firstLoad);
    //   let configDest = path.join(tmpdir, "config.json");
    //   assert.equal(true, fs.existsSync(configDest));
    // });
  });

  // reload
  describe("reload", () => {
    beforeEach(() => {
      prefs = new SaverPrefs(tmpdir);
    });
  
    it("works with existing config", () => {
      prefs.saver = "foo/bar/baz.json";
      assert.equal("foo/bar/baz.json", prefs.saver);

      prefs.reload();
      assert.equal("foo/bar/baz.json", prefs.saver);
    });

    it("persists", () => {
      prefs.saver = "foo/bar/baz.json";

      prefs = new SaverPrefs(tmpdir);
      prefs.reload();
      assert.equal("foo/bar/baz.json", prefs.saver);

    });
  });

  describe("needSetup", function() {
    it("is false with config", () => {
      prefs = new SaverPrefs(tmpdir);
      assert.equal(true, prefs.needSetup);

      prefs.localSource = "local/dir";
      prefs.saver = "foo/bar/baz";

      prefs = new SaverPrefs(tmpdir);
      
      assert.equal(false, prefs.needSetup);  
    });

    it("is true with noSource", () => {
      prefs = new SaverPrefs(tmpdir);
      prefs.sourceRepo = "";
      prefs.localSource = "";
      assert.equal(true, prefs.noSource);
      assert.equal(true, prefs.needSetup);
    });

    it("is true if saver is undefined", () => {
      prefs = new SaverPrefs(tmpdir);
      assert.equal(true, prefs.needSetup);

      prefs.localSource = "local/dir";
      prefs.saver = "foo/bar/baz";

      prefs = new SaverPrefs(tmpdir);
      assert.equal(true, !prefs.needSetup);

      prefs.saver = undefined;
      assert.equal(true, prefs.needSetup);
    });

    it("is true if saver is blank", () => {
      prefs = new SaverPrefs(tmpdir);
      assert.equal(true, prefs.needSetup);

      prefs.localSource = "local/dir";
      prefs.saver = "foo/bar/baz";

      prefs = new SaverPrefs(tmpdir);
      assert.equal(true, !prefs.needSetup);

      prefs.saver = "";
      assert.equal(true, prefs.needSetup);
    });
  });

  // no source
  describe("noSource", () => {
    // describe("without config", () => {
    //   it("is true", () => {
    //     prefs = new SaverPrefs(tmpdir);
    //     assert.equal(true, prefs.noSource);
    //   });
    // });

    describe("with config", () => {
      beforeEach(() => {
        prefs = new SaverPrefs(tmpdir);
        helpers.specifyConfig(prefs.configFile, "config");
      });

      it("is true if no source repo and no local source", () => {
        prefs.store.delete("sourceRepo");
        prefs.store.delete("localSource");
        assert.equal(true, prefs.noSource);

        prefs.sourceRepo = "";
        prefs.localSource = "";
        assert.equal(true, prefs.noSource);
      });

      it("is false if source repo", () => {
        prefs.sourceRepo = "foo";
        prefs.localSource = "";

        assert.equal(true, !prefs.noSource);
      });

      it("is false if local source", () => {
        prefs.store.delete("sourceRepo");
        prefs.localSource = "foo";

        assert.equal(true, !prefs.noSource);
      });
    });
  });


  // defaultSaversDir
  describe("defaultSaversDir", () => {
    beforeEach(() => {
      prefs = new SaverPrefs(tmpdir);
    });

    it("is the working directory", () => {
      let dest = path.join(tmpdir, "savers");
      assert.equal(dest, prefs.defaultSaversDir);
    });
  });

  // // toHash
  // describe("toHash", () => {
  //   beforeEach(() => {
  //     prefs = new SaverPrefs(tmpdir);
  //     helpers.specifyConfig(prefs.configFile, "config");
  //   });

  //   it("works", () => {
  //     let data = prefs.toHash();
  //     assert.equal("before-dawn-screensavers/emoji/saver.json", data.saver);
  //     assert.equal(10, data.delay);
  //   });
  // });

  // // ensureDefaults
  // describe("ensureDefaults", () => {
  //   beforeEach(() => {
  //     prefs = new SaverPrefs(tmpdir);
  //   });

  //   it("works", () => {
  //     prefs.delay = undefined;
  //     prefs.sleep = undefined;

  //     // @todo this doesn't actually do anything because
  //     // of the way the getters work now

  //     prefs.ensureDefaults();
  //     assert.equal(5, prefs.delay);
  //     assert.equal(10, prefs.sleep);
  //   });
  // });

  // sources
  describe("sources", () => {
    let systemDir;
    beforeEach(() => {
      prefs = new SaverPrefs(tmpdir);
      helpers.specifyConfig(prefs.configFile, "config");
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

      assert.equal(true, result.lastIndexOf(dest) !== -1);
      assert.equal(true, result.lastIndexOf(systemDir) !== -1);
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
      assert.equal(true, result.lastIndexOf(systemDir) !== -1);
    });
  });

  // systemSource
  describe("sources", () => {
    beforeEach(() => {
      prefs = new SaverPrefs(tmpdir);
    });

    it("works", () => {
      let expected = path.join(tmpdir, "system-savers");
      assert.equal(expected, prefs.systemSource);
    });
  });

  // getOptions
  describe("getOptions", () => {
    beforeEach(() => {
      prefs = new SaverPrefs(tmpdir);
      helpers.specifyConfig(prefs.configFile, "config-with-options");
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
      prefs.store.delete("saver");
      let opts = prefs.getOptions();
      assert.deepEqual({}, opts);
    });
  });

  // // write
  // describe("write", () => {
  //   beforeEach(() => {
  //     prefs = new SaverPrefs(tmpdir);
  //   });

  //   it("works", async () => {
  //     let data = helpers.prefsToJSON(tmpdir);
  //     assert.notEqual(data.delay, 123);

  //     prefs.delay = 123;

  //     await prefs.write();

  //     data = helpers.prefsToJSON(tmpdir);
  //     assert.equal(data.delay, 123);
  //   });
  // });

  // // writeSync
  // describe("writeSync", () => {
  //   beforeEach(() => {
  //     prefs = new SaverPrefs(tmpdir);
  //   });

  //   it("works", () => {
  //     let data = helpers.prefsToJSON(tmpdir);
  //     assert.notEqual(data.delay, 123);

  //     prefs.delay = 123;
  //     prefs.writeSync();
      
  //     data = helpers.prefsToJSON(tmpdir);
  //     assert.equal(data.delay, 123);
  //   });
  // });

  // updatePrefs
  describe("updatePrefs", () => {
    beforeEach(() => {
      prefs = new SaverPrefs(tmpdir);
    });

    // it("works", async () => {
    //   let data = helpers.prefsToJSON(tmpdir);
    //   assert.notEqual(data.delay, 123);

    //   //let results = 
    //   await prefs.updatePrefs({
    //     delay: 123
    //   });
      
    //   data = helpers.prefsToJSON(tmpdir);
    //   assert.equal(data.delay, 123);
    // });
  });

  // setDefaultRepo
  describe("setDefaultRepo", () => {
    beforeEach(() => {
      prefs = new SaverPrefs(tmpdir);
      helpers.specifyConfig(prefs.configFile, "default-repo");
    });

    it("works", () => {
      assert.equal(true, prefs.sourceUpdatedAt !== undefined);
      prefs.setDefaultRepo("foo/bar");


      assert.equal(true, prefs.sourceUpdatedAt === undefined);
      assert.equal(prefs.sourceRepo, "foo/bar");
    });
  });

  // getters/setters

});
