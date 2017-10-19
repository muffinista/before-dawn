'use strict';

const assert = require('assert');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const Application = require('spectron').Application;
const fs = require('fs');
const path = require('path');
const tmp = require('tmp');
const appPath = __dirname + '/../../app/node_modules/electron/dist/Electron.app/Contents/MacOS/Electron';

var getTempDir = function() {
  var tmpObj = tmp.dirSync();
  return tmpObj.name;
};
var workingDir = getTempDir();

var savedConfig = function() {
  var data = path.join(workingDir, "config.json");
  var json = fs.readFileSync(data);

  return JSON.parse(json);
};

const app = new Application({
  path: appPath,
  args: ['app/main.js'],
  env: {
    BEFORE_DAWN_DIR: workingDir,
    TEST_MODE: true
  }
});

chai.should();
chai.use(chaiAsPromised);
chaiAsPromised.transferPromiseness = app.transferPromiseness;

describe('bootstrap', function() {
  this.timeout(6000);
	before(() => {
		return app.start().
               then(() => app.client.waitUntilWindowLoaded() );
	});

	after(() => {
		if (app && app.isRunning()) {
			return app.stop();
		}
	});

  it('creates config file', function(done) {
    assert.equal("muffinista/before-dawn-screensavers", savedConfig().source.repo);
    done();
  });

  it('populates screensavers', function(done) {
    var source = savedConfig().saver;
    assert(fs.existsSync(source));
    done();
  });
});


