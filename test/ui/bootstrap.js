'use strict';

const assert = require('assert');
const fs = require('fs');
const tmp = require('tmp');

const helpers = require('./setup.js');
var workingDir = helpers.getTempDir();
const app = helpers.application(workingDir);

describe('bootstrap', function() {
  this.timeout(6000);
	before(() => {
		return app.start().
               then(() => app.client.waitUntilWindowLoaded() );
	});

	after(() => {
    return helpers.stopApp(app);
	});

  it('creates config file', function(done) {
    assert.equal("muffinista/before-dawn-screensavers", helpers.savedConfig(workingDir).source.repo);
    done();
  });

  it('populates screensavers', function(done) {
    var source = helpers.savedConfig(workingDir).saver;
    assert(fs.existsSync(source));
    done();
  });
});


