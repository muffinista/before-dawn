// eslint-disable-next-line no-unused-vars
const { init } = require("@sentry/electron");

global.IS_DEV = require("electron-is-dev");

var version = undefined;
let packageJSON = {};

try {
  packageJSON = require("../../package.json");
  // console.log("packageJSON", packageJSON);

  version = packageJSON.version;

  if ( ! process.env.BEFORE_DAWN_RELEASE_NAME ) {
    process.env.BEFORE_DAWN_RELEASE_NAME = `${packageJSON.productName} ${packageJSON.version}`;
  }
  
}
catch(e) {
  version = "0.0.0";
}

global.APP_NAME = "Before Dawn";
global.APP_DIR = "Before Dawn";
global.SAVER_REPO = "muffinista/before-dawn-screensavers";
global.APP_REPO = "muffinista/before-dawn";
global.APP_VERSION_BASE = version;
global.APP_VERSION = `v${version}`;
global.NEW_RELEASE_AVAILABLE = false;
global.HELP_URL = "https://muffinista.github.io/before-dawn/";
global.ISSUES_URL = "https://github.com/muffinista/before-dawn/issues";
global.APP_CREDITS = "by Colin Mitchell // muffinlabs.com";

if ( packageJSON.release_server && ! global.IS_DEV ) {
  global.RELEASE_SERVER = packageJSON.release_server;
  global.RELEASE_CHECK_URL = `${global.RELEASE_SERVER}/update/${process.platform}/${global.APP_VERSION_BASE}`;
  global.PACKAGE_DOWNLOAD_URL = `https://github.com/${global.APP_REPO}/releases/latest`;
}


if ( !process.env.LOCAL_PACKAGE && process.env.TEST_MODE === undefined ) {
  try {
    let localSavers = packageJSON.resources.savers;
    process.env.LOCAL_PACKAGE = localSavers;

    let localSaversJSON = packageJSON.resources.data;
    process.env.LOCAL_PACKAGE_DATA = localSaversJSON;
  }
  catch(e) {
    // eslint-disable-next-line no-console
    console.log(e);
  }
}

if ( process.env.LOCAL_PACKAGE ) {
  global.LOCAL_PACKAGE = process.env.LOCAL_PACKAGE;
}
if ( process.env.LOCAL_PACKAGE_DATA ) {
  global.LOCAL_PACKAGE_DATA = process.env.LOCAL_PACKAGE_DATA;
}

global.CONFIG_DEFAULTS = {
  options: {},
  delay: 15,
  sleep: 15,
  auto_start: false,
  sourceRepo: global.SAVER_REPO,
  runOnSingleDisplay: true
};


global.TRACK_ERRORS = false;

// this is a free sentry account and the URL will be in every copy of
// the app that gets distributed, so i'm committing it to the repo for now
if ( process.env.TEST_MODE === undefined && ! global.IS_DEV ) {
  global.TRACK_ERRORS = true;
  require("./assets/sentry.js");
}
