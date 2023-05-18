"use strict";

const assert = require("assert");
const sinon = require("sinon");
const helpers = require("../helpers.js");

const { rimraf } = require("rimraf");
const fs = require("fs-extra");
const path = require("path");

const SaverPrefs = require("../../src/lib/prefs.js");
const SaverFactory = require("../../src/lib/saver-factory.js");
const SaverListManager = require("../../src/lib/saver-list.js");

var sandbox;

describe("SaverFactory", function() { 
  var savers;
  var prefs;
  var factory;
  
  var workingDir;
  var saversDir;
  var systemDir;
  
  beforeEach(function() {
    sandbox = sinon.createSandbox();

    // this will be the working directory of the app
    workingDir = helpers.getTempDir();

    // this will be the separate directory to hold screensavers
    saversDir = helpers.getTempDir();

    systemDir = path.join(workingDir, "system-savers");
    fs.mkdirSync(systemDir);

    helpers.addSaver(systemDir, "random-saver");
    helpers.addSaver(systemDir, "__template");    

    prefs = new SaverPrefs(workingDir);
    prefs.localSource = saversDir;
  });

  afterEach(function() {
    if ( fs.existsSync(workingDir) ) {
      rimraf.sync(workingDir);
    }
    sandbox.restore();
  });

  
  describe("create", function() {
    var templateSrc;
    const attrs = {
      name: "New Screensaver"
    };

    beforeEach(function() {
      savers = new SaverListManager({
        prefs: prefs
      });
      factory = new SaverFactory();
      templateSrc = path.join(systemDir, "__template");
    });

    it("works", async function() {
      let data = await savers.list();
      let oldCount = data.length;

      console.log(saversDir);
      console.log(savers);

      const result = factory.create(templateSrc, saversDir, attrs);

      console.log(result);

      data = await savers.list();
      console.log(data);
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