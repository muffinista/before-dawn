"use strict";

import assert from 'assert';
import path from "path";
import * as tmp from "tmp";
import fs from "fs";

import * as helpers from "../helpers.js";

import SaverPrefs from "../../src/lib/prefs.js";


describe("SaverPrefs", function() {
  var tmpdir, prefs;

  beforeEach(function() {
    tmpdir = tmp.dirSync().name;
  });

  describe("without config", function() {
    beforeEach(function() {
      prefs = new SaverPrefs(tmpdir);
    });

    it("should load", function() {
      assert.equal(true, prefs.needSetup);
    });
  });

  // reload
  describe("reload", function() {
    beforeEach(function() {
      prefs = new SaverPrefs(tmpdir);
    });
  
    it("works with existing config", function() {
      prefs.saver = "foo/bar/baz.json";
      assert.equal("foo/bar/baz.json", prefs.saver);

      prefs.reload();
      assert.equal("foo/bar/baz.json", prefs.saver);
    });

    it("persists", function() {
      prefs.saver = "foo/bar/baz.json";

      prefs = new SaverPrefs(tmpdir);
      prefs.reload();
      assert.equal("foo/bar/baz.json", prefs.saver);

    });
  });

  describe("needSetup", function() {
    it("is false with config", function() {
      prefs = new SaverPrefs(tmpdir);
      assert.equal(true, prefs.needSetup);

      prefs.localSource = "local/dir";
      prefs.saver = "foo/bar/baz";

      prefs = new SaverPrefs(tmpdir);
      
      assert.equal(false, prefs.needSetup);  
    });

    it("is true if saver is undefined", function() {
      prefs = new SaverPrefs(tmpdir);
      assert.equal(true, prefs.needSetup);

      prefs.localSource = "local/dir";
      prefs.saver = "foo/bar/baz";

      prefs = new SaverPrefs(tmpdir);
      assert.equal(true, !prefs.needSetup);

      prefs.saver = undefined;
      assert.equal(true, prefs.needSetup);
    });

    it("is true if saver is blank", function() {
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
  describe("noSource", function() {
    describe("with config", function() {
      beforeEach(function() {
        prefs = new SaverPrefs(tmpdir);
        helpers.specifyConfig(prefs.configFile, "config");
      });

      it("is false if source repo", function() {
        prefs.sourceRepo = "foo";
        prefs.localSource = "";

        assert.equal(true, !prefs.noSource);
      });

      it("is false if local source", function() {
        prefs.store.delete("sourceRepo");
        prefs.localSource = "foo";

        assert.equal(true, !prefs.noSource);
      });
    });
  });


  // defaultSaversDir
  describe("defaultSaversDir", function() {
    beforeEach(function() {
      prefs = new SaverPrefs(tmpdir);
    });

    it("is the working directory", function() {
      let dest = path.join(tmpdir, "savers");
      assert.equal(dest, prefs.defaultSaversDir);
    });
  });

  // sources
  describe("sources", function() {
    let systemDir;

    beforeEach(function() {
      prefs = new SaverPrefs(tmpdir);
      helpers.specifyConfig(prefs.configFile, "config");
      systemDir = path.join(tmpdir, "system-savers");
    });

    it("includes localSource", function() {
      let saversDir = path.join(tmpdir, "savers");
      let localSourceDir = helpers.getTempDir();
      prefs.localSource = localSourceDir;

      let result = prefs.sources;
      assert.deepStrictEqual(
        [ saversDir, localSourceDir, systemDir ], result);
    });

    it("includes repo", function() {
      prefs.sourceRepo = "foo";
      let result = prefs.sources;
      let dest = path.join(tmpdir, "savers");

      assert.equal(true, result.lastIndexOf(dest) !== -1);
      assert.equal(true, result.lastIndexOf(systemDir) !== -1);
    });

    it("includes both repo and localsource", function() {
      let saversDir = path.join(tmpdir, "savers");
      let localSourceDir = helpers.getTempDir();

      prefs.localSource = localSourceDir;
      prefs.sourceRepo = "foo";


      let result = prefs.sources;
      assert.deepEqual(
        [ saversDir, localSourceDir, systemDir ], result);
    });

    it("includes system", function() {
      fs.mkdirSync(systemDir);
      let result = prefs.sources;
      assert.equal(true, result.lastIndexOf(systemDir) !== -1);
    });
  });

  // systemSource
  describe("systemSource", function() {
    beforeEach(function() {
      prefs = new SaverPrefs(tmpdir);
    });

    it("works", function() {
      let expected = path.join(tmpdir, "system-savers");
      assert.equal(expected, prefs.systemSource);
    });
  });

  // getOptions
  describe("getOptions", function() {
    beforeEach(function() {
      prefs = new SaverPrefs(tmpdir);
      helpers.specifyConfig(prefs.configFile, "config-with-options");
    });

    it("works without key", function() {
      let opts = prefs.getOptions();
      assert.deepEqual({ foo: "bar", level: 100 }, opts);
    });

    it("works with key", function() {
      let opts = prefs.getOptions("/Users/colin/Projects/before-dawn-screensavers/key/saver.json");
      assert.deepEqual({ baz: "boo", level: 10 }, opts);
    });

    it("returns empty hash when key is undefined", function() {
      prefs.store.delete("saver");
      let opts = prefs.getOptions();
      assert.deepEqual({}, opts);
    });
  });
});
