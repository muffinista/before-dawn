
import * as path from "path";
import fs from 'fs-extra';
import * as tmp from "tmp";

import Conf from "conf";

import { _electron as playwright } from "playwright";
import electron from "electron";

import assert from "assert";


import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let windowCheckDelay = 5000;
let testTimeout = 25000;
let testRetryCount = 0;

let app;

if (process.env.CI) {
  windowCheckDelay = 10000;
  testTimeout = 60000;
  testRetryCount = 3;
}

const delayStep = 10;

/**
 * keep a list of window titles here so we can have
 * a really clean system to open/load/wait for windows
 */
 const windowTitles = {
  new: "Before Dawn: Create Screensaver!",
  about: "Before Dawn: About!",
  editor: "Before Dawn: Editor",
  prefs: "Before Dawn: Preferences",
  settings: "Before Dawn: Settings"
};


export function specifyConfig(dest, name) {
  fs.copySync(
    path.join(__dirname, "fixtures", name + ".json"),
    dest
  );
}

export function setupConfig(workingDir, name="config", attrs={}) {
  const dest = path.join(workingDir, "config.json");
  fs.copySync(
    path.join(__dirname, "fixtures", name + ".json"),
    dest
  );

  if ( attrs !== {} ) {
    let store = new Conf({cwd: workingDir});
    store.set(attrs);
  }
}

export function setConfigValue(workingDir, name, value) {
  let f = path.join(workingDir, "config.json");
  let currentVals = JSON.parse(fs.readFileSync(f));
  currentVals[name] = value;

  fs.writeFileSync(f, JSON.stringify(currentVals));
}

export function addSaver(dest, name, source) {
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
}

export function prefsToJSON(tmpdir) {
  let testFile = path.join(tmpdir, "config.json");
  let data = {};

  try {
    data = JSON.parse(fs.readFileSync(testFile));
  }
  catch(e) {
    data = {};
  }

  return data;
}

export function getTempDir() {
  const base = tmp.dirSync().name;
  if ( process.platform === "win32" && base.lastIndexOf("~") !== -1) {
    return base.replace("RUNNER~1", "runneradmin");
  }
  return base;
}

export function savedConfig(p) {
  var data = path.join(p, "config.json");
  var json = fs.readFileSync(data);
  return JSON.parse(json);
}


export function setupFullConfig(workingDir) {
  let saversDir = exports.getTempDir();
  let saverJSONFile = exports.addSaver(saversDir, "saver");

  exports.setupConfig(workingDir, "config", {
    "saver": saverJSONFile 
  });
}

export function addLocalSource(workingDir, saversDir) {
  var src = path.join(workingDir, "config.json");
  var data = exports.savedConfig(workingDir);
  data.localSource = saversDir;
  fs.writeFileSync(src, JSON.stringify(data));
}

export function removeLocalSource(workingDir) {
  var src = path.join(workingDir, "config.json");
  var data = exports.savedConfig(workingDir);
  data.localSource = "";
  fs.writeFileSync(src, JSON.stringify(data));
}


/**
 * Launch the application via playwright
 * 
 * @param {string} workingDir 
 * @param {boolean} quietMode 
 * @returns application
 */
export async function application(workingDir, quietMode=false) {
  let env = {
    BEFORE_DAWN_DIR: workingDir,
    CONFIG_DIR: workingDir,
    SAVERS_DIR: workingDir,
    TEST_MODE: true,
    QUIET_MODE: quietMode,
    ELECTRON_ENABLE_LOGGING: true
  };

  let a = await playwright.launch({
    path: electron,
    args: [path.join(__dirname, "..", "output", "main.js")],
    env: env
  });

  a.logData = [];

  a.on("window", (w) => {
    w.on("console", (payload) => {
      a.logData.push(payload);
    });
  });

  // wait for the first window (our test shim) to open, and
  // hang onto it for later use
  exports.shim = await a.firstWindow();

  app = a;
  return a;
}

export async function dumpOutput(app) {
  console.log(app.logData);
  app.logData = [];
}

/**
 * 
 * @param {app} app electron application
 * @param {string} windowName the name of the window to wait for
 * @returns Page
 */
 export async function waitFor(app, windowName) {
  const title = windowTitles[windowName];
  await exports.waitForWindow(app, title);
  return exports.getWindowByTitle(app, title);
}


/**
 * Kill the app
 * 
 * @param {application} app 
 */
export async function stopApp(app) {
  try {
    if (app ) {
      await app.close();
    }
  }
  catch(e) {
    console.log(e);
  }
}


/**
 * Generate a lookup table of currently open windows
 * 
 * @param {*} app 
 * @returns hash of window objects keyed by title
 */
export async function getWindowLookup(app) {
  const windows = await app.windows();
  const promises = windows.map(async (window) => {
    try {
      const title = await window.title();
      return [title, window];
    } catch(e) {
      // sometimes a window will be closing and trying to get the title
      // will throw an error, but it's probably fine
      return ["Missing window", window];
    }
  });

  const results = await Promise.all(promises);
  return results.reduce((map, obj) => {
    map[obj[0]] = obj[1];
    return map;
  }, {});
}

/**
 * Get window with the given title
 * 
 * @param {*} app 
 * @param {*} title 
 * @returns 
 */
export async function getWindowByTitle(app, title) {
  // make sure the app is open
  await app.firstWindow();

  const lookup = await exports.getWindowLookup(app);
  return lookup[title];
}

/**
 * wait for text on the given window
 * @param {Page} window 
 * @param {string} lookup lookup to pull a specific DOM section
 * @param {string} text text to look for
 * @param {boolean} doAssert 
 */
export async function waitForText(window, lookup, text, doAssert) {
  const content = await window.textContent(lookup);
  if ( doAssert === true ) {
    assert(content.lastIndexOf(text) !== -1);
  }
}

/**
 * wait for ms milliseconds
 * @param {*} ms 
 * @returns 
 */
export function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


/**
 * wait for window with the specified name to be available
 * @param {*} app 
 * @param {*} title 
 * @param {*} skipAssert 
 * @returns 
 */
export async function waitForWindow(app, title, skipAssert) {
  let result = -1;
  for ( var totalTime = 0; totalTime < windowCheckDelay; totalTime += delayStep ) {
    result = await exports.getWindowByTitle(app, title);
    if ( result ) {
      return true;
    }
    else {
      await exports.sleep(delayStep);
    }
  }

  if ( skipAssert !== true ) {
    assert.notStrictEqual(-1, result, `window ${title} not opened`);
  }

  return result;
}


/**
 * Use the shim window to send an IPC command to the app
 * @param {*} app 
 * @param {*} method 
 * @param {*} opts 
 */
export async function callIpc(_app, method, opts={}) {
  const window = exports.shim;

  await window.fill("#ipc", method);
  await window.fill("#ipcopts", JSON.stringify(opts));
  await window.click("text=go");
}

export function setupTest(test) {
  test.timeout(testTimeout);
  test.retries(testRetryCount);

	afterEach(async function () {
    if (this.currentTest.state !== "passed") {
      await exports.dumpOutput(app);
    }

    await exports.stopApp(app);
	});
}
