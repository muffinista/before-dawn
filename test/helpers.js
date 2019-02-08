const tmp = require("tmp");
const path = require("path");
const fs = require("fs-extra");
const Application = require("spectron").Application;
const fakeDialog = require("spectron-fake-dialog");

const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");

const appPath = require("electron");
const assert = require("assert");

let windowCheckDelay = 5000;

if (process.env.CI) {
  windowCheckDelay = 15000;
}

const delayStep = 10;


global.before(() => {
  chai.should();
  chai.use(chaiAsPromised);
});

exports.specifyConfig = (tmpdir, name) => {
  fs.copySync(
    path.join(__dirname, "fixtures/" + name + ".json"),
    path.join(tmpdir, "config.json")
  );
};

exports.setConfigValue = (workingDir, name, value) => {
  let f = path.join(workingDir, "config.json");
  let currentVals = JSON.parse(fs.readFileSync(f));
  currentVals[name] = value;

  fs.writeFileSync(f, JSON.stringify(currentVals));
};

exports.getTempDir = function() {
  return tmp.dirSync().name;
};

exports.addSaver = function(dest, name, source) {
  // make a subdir in the savers directory and drop screensaver
  // config there
  if ( source === undefined ) {
    source = "saver.json";
  }
  var src = path.join(__dirname, "fixtures", source);
  var htmlSrc = path.join(__dirname, "fixtures", "index.html");
  var testSaverDir = path.join(dest, name);

  var saverJSONFile = path.join(testSaverDir, "saver.json");
  var saverHTMLFile = path.join(testSaverDir, "index.html");

  if ( ! fs.existsSync(dest) ) {
    fs.mkdirSync(dest);
  }

  fs.mkdirSync(testSaverDir);
  fs.copySync(src, saverJSONFile);
  fs.copySync(htmlSrc, saverHTMLFile);    

  return saverJSONFile;
};

exports.prefsToJSON = (tmpdir) => {
  let testFile = path.join(tmpdir, "config.json");
  let data = {};

  try {
    data = JSON.parse(fs.readFileSync(testFile));
  }
  catch(e) {
    data = {};
  }

  return data;
};

exports.getTempDir = function() {
  var tmpObj = tmp.dirSync();
  return tmpObj.name;
};

exports.savedConfig = function(p) {
  var data = path.join(p, "config.json");
  var json = fs.readFileSync(data);
//  console.log("savedConfig", json.toString());
  return JSON.parse(json);
};

exports.application = function(workingDir, quietMode=false, localZip) {
  let env = {
    BEFORE_DAWN_DIR: workingDir,
    TEST_MODE: true,
    QUIET_MODE: quietMode
  };

  if ( localZip !== undefined ) {
    env.LOCAL_PACKAGE = localZip;
  }
 
  var a = new Application({
    path: appPath,
    args: [path.join(__dirname, "..", "output/main.js")],
    env: env
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
  var src = path.join(__dirname, "fixtures", "config.json");
  var dest = path.join(workingDir, "config.json");
  fs.copySync(src, dest);
};

exports.setupFullConfig = function(workingDir) {
  exports.setupConfig(workingDir);

  exports.setConfigValue(workingDir, "sourceRepo", "foo/bar");
  exports.setConfigValue(workingDir, "sourceUpdatedAt", new Date(0));
  let saversDir = path.join(workingDir, "savers");
  let saverJSONFile = exports.addSaver(saversDir, "saver");
  exports.setConfigValue(workingDir, "saver", saverJSONFile);
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

exports.getWindowByTitle = async (app, title) => {
  let result = -1;
  return await app.client.getWindowCount().then(async (count) => {
    for ( var i = 0; i < count; i++ ) {
      if ( result === -1 ) {
        await app.client.windowByIndex(i).getTitle().then((res) => {
          //console.log(i, res, title, res === title);
          if ( res === title ) {
            result = i;
            return i;
          }
        });    
      }
    }

    return result;
  });

};

exports.sleep = function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
};


exports.waitForWindow = async (app, title, skipAssert) => {
  //let maxAttempts = 20;
  let result = -1;
  for ( var totalTime = 0; totalTime < windowCheckDelay; totalTime += delayStep ) {
    result = await exports.getWindowByTitle(app, title);
    //console.log("****", i, result);
    if ( result !== -1 ) {
      break;
    }
    else {
      await exports.sleep(delayStep);
    }
  }

  if ( skipAssert !== true ) {
    assert.notEqual(-1, result, `window ${title} not opened`);
  }

  return result;
};


exports.waitForWindowToClose = async (app, title) => {
  let result = 0;
  for ( var totalTime = 0; totalTime < windowCheckDelay; totalTime += delayStep ) {
    try {
      result = await exports.getWindowByTitle(app, title);
      if ( result === -1 ) {
        break;
      }
      else {
        await exports.sleep(delayStep);
      }
    }
    catch(e) {
      //    'no such window: target window already closed\nfrom unknown error: web view not found',
      result = -1;
      break;
    }
  }
  return assert.equal(-1, result);
};

exports.waitUntilBooted = async(app) => {
  return exports.waitForWindow(app, "test shim");
};


exports.outputLogs = function(app) {
  return app.client.getMainProcessLogs().
  then(function (logs) {
    logs.forEach(function (log) {
      console.log(log);
    });
  }).
  then(() => app.client.getRenderProcessLogs()).
  then(function (logs) {
    logs.forEach(function (log) {
      console.log(log.message);
    });
  });
};

exports.setupTimeout = function (test) {
  if (process.env.CI) {
    test.timeout(60000);
  }
  else {
    test.timeout(60000);
  }
};
