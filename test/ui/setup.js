const tmp = require("tmp");
const path = require("path");
const fs = require("fs-extra");
const Application = require("spectron").Application;
const fakeDialog = require("spectron-fake-dialog");

const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");

const appPath = require("electron");

global.before(() => {
  chai.should();
  chai.use(chaiAsPromised);
});

exports.getTempDir = function() {
  var tmpObj = tmp.dirSync();
  return tmpObj.name;
};

exports.savedConfig = function(p) {
  var data = path.join(p, "config.json");
  var json = fs.readFileSync(data);
  return JSON.parse(json);
};

exports.application = function(workingDir) {
  var a = new Application({
    path: appPath,
    args: [path.join(__dirname, "..", "..", "output/main.js")],
    env: {
      BEFORE_DAWN_DIR: workingDir,
      TEST_MODE: true
    }
  });

  fakeDialog.apply(a);
  a.fakeDialog = fakeDialog;
  
  chaiAsPromised.transferPromiseness = a.transferPromiseness;

  return a;
};


exports.stopApp = function(app) {
	if (app && app.isRunning()) {
		return app.stop();
	}
};


exports.setupConfig = function(workingDir) {
  var src = path.join(__dirname, "../fixtures/config.json");
  var dest = path.join(workingDir, "config.json");
  fs.copySync(src, dest);
};

exports.addLocalSource = function(workingDir, saversDir) {
  var src = path.join(workingDir, "config.json");
  var data = exports.savedConfig(workingDir);
  data.localSource = saversDir;
  fs.writeFileSync(src, JSON.stringify(data));
};

exports.removeLocalSource = function(workingDir) {
  var src = path.join(workingDir, "config.json");
  var data = exports.savedConfig(workingDir);
  data.localSource = "";
  fs.writeFileSync(src, JSON.stringify(data));
};

exports.addSaver = function(dir, key, fname) {
  var src = path.join(__dirname, "../fixtures/" + fname);
  var dest = path.join(dir, key);

  fs.mkdirSync(dest);
  fs.copySync(src, path.join(dest, "saver.json"));
  
};

exports.setupTimeout = function (test) {
  if (process.env.CI) {
    test.timeout(30000);
  }
  else {
    test.timeout(60000);
  }
};
