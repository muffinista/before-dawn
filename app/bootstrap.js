var fs = require('fs');
var path = require('path');
var filePath = path.join(__dirname, "package.json");
var version = JSON.parse(fs.readFileSync( filePath )).version;


global.APP_NAME = "Before Dawn";
global.APP_DIR = "BeforeDawn";
global.SAVER_REPO = "muffinista/before-dawn-screensavers";
global.APP_REPO = "muffinista/before-dawn";
global.APP_VERSION = "v" + version;
global.NEW_RELEASE_AVAILABLE = false;

