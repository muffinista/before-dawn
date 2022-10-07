
global.IS_DEV = require("electron-is-dev");

var version = undefined;
let packageJSON = {};

try {
  packageJSON = require("../../package.json");
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

if ( process.env.TEST_MODE === undefined && !global.IS_DEV &&  process.env.SENTRY_DSN !== undefined ) {
  console.log(`setting up sentry with ${process.env.SENTRY_DSN}`);
  try {
    const { init } = require("@sentry/electron"); 
    init({
      dsn: process.env.SENTRY_DSN,
      // eslint-disable-next-line no-console
      onFatalError: console.log
    });  
  }
  catch(e) {
    console.log(e);
  }
}
