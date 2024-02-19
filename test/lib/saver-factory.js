"use strict";

import assert from 'assert';
import path from "path";
import fs from "fs-extra";
import { rimrafSync } from 'rimraf'
import * as mkdirp from "mkdirp";

import * as helpers from "../helpers.js";

import SaverPrefs from "../../src/lib/prefs.js";
import SaverFactory from "../../src/lib/saver-factory.js";
import SaverListManager from "../../src/lib/saver-list.js";


describe("SaverFactory", function() { 
  var savers;
  var prefs;
  var factory;
  
  var workingDir;
  var saversDir;
  var systemDir;
  
  beforeEach(function() {
    // this will be the working directory of the app
    workingDir = helpers.getTempDir();

    // this will be the separate directory to hold screensavers
    saversDir = helpers.getTempDir();

    mkdirp.sync(workingDir);
    mkdirp.sync(saversDir);

    systemDir = path.join(workingDir, "system-savers");
    fs.mkdirSync(systemDir);

    helpers.addSaver(systemDir, "random-saver");
    helpers.addSaver(systemDir, "__template");    

    prefs = new SaverPrefs(workingDir);
    prefs.localSource = saversDir;
  });

  afterEach(function() {
    if ( fs.existsSync(workingDir) ) {
      rimrafSync(workingDir);
    }
  });

  
  describe("create", function() {
    it("works", async function() {
      var templateSrc;
      const attrs = {
        name: "New Screensaver"
      };
  
      savers = new SaverListManager({
        prefs: prefs
      });
      factory = new SaverFactory();
      templateSrc = path.join(systemDir, "__template");
  
      let data = await savers.list();
      let oldCount = data.length;

      const result = factory.create(templateSrc, saversDir, attrs);

      data = await savers.list();
      assert.equal(oldCount + 1, data.length);

      assert.equal("new-screensaver", result.key);
      assert.equal("New Screensaver", result.name);

      const expectedDest = path.join(saversDir, "new-screensaver", "saver.json");
      assert.equal(expectedDest, result.dest);
    });

    it("throws exception", function(done) {
      assert.throws(
        () => {
          savers.create({
            name:"New Screensaver"
          });
        },
        Error);
      done();
    });
  });
});