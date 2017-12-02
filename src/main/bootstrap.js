//var fs = require("fs");
//var path = require("path");
//var filePath = path.join(__dirname, "..", "..", "package.json");
//var version = JSON.parse(fs.readFileSync( filePath )).version;

var version = process.env.PACKAGE_VERSION;

global.APP_NAME = "Before Dawn";
global.APP_DIR = "Before Dawn";
global.SAVER_REPO = "muffinista/before-dawn-screensavers";
global.APP_REPO = "muffinista/before-dawn";
global.APP_VERSION_BASE = version;
global.APP_VERSION = "v" + version;
global.NEW_RELEASE_AVAILABLE = false;
global.HELP_URL = "https://muffinista.github.io/before-dawn/";
global.ISSUES_URL = "https://github.com/muffinista/before-dawn/issues";

global.RELEASE_SERVER = "https://hazel-nwmfhsakin.now.sh";

// note -- this is hardcoded to win32 for now because we actually
// don't care what platform is running
global.RELEASE_CHECK_URL = `${global.RELEASE_SERVER}/update/win32/${global.APP_VERSION_BASE}`;
global.IS_DEV = require('electron-is-dev');

global.CHECK_FOR_RELEASE = !global.IS_DEV;

// this is a free sentry account and the URL will be in every copy of
// the app that gets distributed, so i'm committing it to the repo for now
if ( process.env.TEST_MODE === undefined && ! global.IS_DEV ) {
  global.RAVEN_PRIVATE_URL = "https://b86f7b0ac5604b55b4fd03adedc5d205:9cc446fadc234baab6d825e88fe4215d@sentry.io/172824";
  global.RAVEN_URL = "https://b86f7b0ac5604b55b4fd03adedc5d205@sentry.io/172824";
}

global.CRASH_REPORTER = {
  productName: "Before Dawn",
  companyName: "Before Dawn",
  submitURL: "http://beforedawn.muffinlabs.com:1127/post",
  uploadToServer: true
};
