import { readFile } from 'fs/promises';

export default async function bootstrapApp() {
  const packageJSON = JSON.parse(
    await readFile(
      new URL('../../package.json', import.meta.url)
    )
  );
  

  var version = undefined;

  try {
    version = packageJSON.version;

    if ( ! process.env.BEFORE_DAWN_RELEASE_NAME ) {
      process.env.BEFORE_DAWN_RELEASE_NAME = `${packageJSON.productName} ${packageJSON.version}`;
    }
  }
  catch {
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

  if ( packageJSON.release_server ) {
    global.RELEASE_SERVER = packageJSON.release_server;
    global.RELEASE_CHECK_URL = `${global.RELEASE_SERVER}/update/${process.platform}/${global.APP_VERSION_BASE}`;
    global.PACKAGE_DOWNLOAD_URL = `https://github.com/${global.APP_REPO}/releases/latest`;
  }
}