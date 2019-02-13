// eslint-disable-next-line no-unused-vars
const { init } = require("@sentry/electron");

var version = undefined;
var packageJSON;

try {
  packageJSON = require("../../package.json");
  version = packageJSON.version;

  if ( ! process.env.BEFORE_DAWN_RELEASE_NAME ) {
    process.env.BEFORE_DAWN_RELEASE_NAME = `${packageJSON.productName} ${packageJSON.version}`;
  }
  
}
catch(e) {
  version = "0.0.0";
//  console.log("Unable to set version!", e);
}

global.APP_NAME = "Before Dawn";
global.APP_DIR = "Before Dawn";
global.SAVER_REPO = "muffinista/before-dawn-screensavers";
global.APP_REPO = "muffinista/before-dawn";
global.APP_VERSION_BASE = version;
global.APP_VERSION = "v" + version;
global.NEW_RELEASE_AVAILABLE = false;
global.HELP_URL = "https://muffinista.github.io/before-dawn/";
global.ISSUES_URL = "https://github.com/muffinista/before-dawn/issues";

global.RELEASE_SERVER = "https://before-dawn.now.sh";

if ( process.env.LOCAL_PACKAGE ) {
  global.LOCAL_PACKAGE = process.env.LOCAL_PACKAGE;
}


// note -- this is hardcoded to win32 for now because we actually
// don't care what platform is running
global.RELEASE_CHECK_URL = `${global.RELEASE_SERVER}/update/win32/${global.APP_VERSION_BASE}`;
global.IS_DEV = require("electron-is-dev");

global.CHECK_FOR_RELEASE = !global.IS_DEV;

global.CONFIG_DEFAULTS = {
  options: {},
  delay: 15,
  sleep: 15,
  auto_start: false,
  sourceRepo: global.SAVER_REPO,
  run_on_single_display: true
};


global.TRACK_ERRORS = false;

// this is a free sentry account and the URL will be in every copy of
// the app that gets distributed, so i'm committing it to the repo for now
if ( process.env.TEST_MODE === undefined && ! global.IS_DEV ) {
  global.TRACK_ERRORS = true;
  require("./assets/sentry.js");
}
