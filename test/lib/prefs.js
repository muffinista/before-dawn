'use strict';

const assert = require('assert');

const SaverPrefs = require('../../src/lib/prefs.js');

const tmp = require('tmp');
const fs = require('fs-extra');
const path = require('path');

describe('SaverPrefs', () => {
  var tmpdir, prefs;
  let specifyConfig = (name) => {
    fs.copySync(
      path.join(__dirname, '../fixtures/' + name + '.json'),
      path.join(tmpdir, 'config.json')
    );
  };

  beforeEach(() => {
    tmpdir = tmp.dirSync().name;
  });

  describe('without config', () => {
    beforeEach(() => {
      prefs = new SaverPrefs(tmpdir);
    });

    it('should load', () => {
      assert(prefs.needSetup());
    });

    it('should set noSource', () => {
      assert(prefs.noSource);
    });
  });

  describe('with config', () => {
    it('recovers from corrupt config', () => {
      specifyConfig('bad-config');
      prefs = new SaverPrefs(tmpdir);

      assert(prefs.firstLoad);
      let configDest = path.join(tmpdir, "config.json");
      assert(fs.existsSync(configDest));
    });

    it('works with existing config', () => {
      specifyConfig('config');
      prefs = new SaverPrefs(tmpdir);

      assert(!prefs.firstLoad);
      let configDest = path.join(tmpdir, "config.json");
      assert(fs.existsSync(configDest));
    });
  });

  // reload
  describe('reload', () => {
    beforeEach(() => {
      specifyConfig('config');
      prefs = new SaverPrefs(tmpdir);
    });
  
    it('works with existing config', () => {
      specifyConfig('config');
      prefs = new SaverPrefs(tmpdir);

      assert.equal("before-dawn-screensavers/emoji/saver.json", prefs.current);
      let configDest = path.join(tmpdir, "config.json");
      assert(fs.existsSync(configDest));


      specifyConfig('config-2');
      prefs.reload()
      assert.equal("before-dawn-screensavers/blur/saver.json", prefs.current);
      assert(fs.existsSync(configDest));
    });
  });

  // no source
  describe('noSource', () => {
    describe('without config', () => {
      it('is true', () => {
        prefs = new SaverPrefs(tmpdir);
        assert(prefs.noSource)
      });
    })

    describe('with config', () => {
      beforeEach(() => {
        specifyConfig('config');
        prefs = new SaverPrefs(tmpdir);
      });

      it('is true if no source repo and no local source', () => {
        prefs.sourceRepo = undefined;
        prefs.localSource = undefined;
        assert(prefs.noSource);

        prefs.sourceRepo = "";
        prefs.localSource = "";
        assert(prefs.noSource);
      });

      it('is false if source repo', () => {
        prefs.sourceRepo = "foo";
        prefs.localSource = undefined;

        assert(!prefs.noSource);
      });

      it('is false if local source', () => {
        prefs.sourceRepo = undefined;
        prefs.localSource = "foo";

        assert(!prefs.noSource);
      });
    });
  });


  // defaultSaversDir
  describe('defaultSaversDir', () => {
    beforeEach(() => {
      prefs = new SaverPrefs(tmpdir);
    });

    it('is the working directory', () => {
      let dest = path.join(tmpdir, "savers");
      assert.equal(dest, prefs.defaultSaversDir);
    })
  });

  // toHash
  describe('toHash', () => {
    beforeEach(() => {
      specifyConfig('config');
      prefs = new SaverPrefs(tmpdir);
    });

    it('works', () => {
      let data = prefs.toHash();
      assert.equal('before-dawn-screensavers/emoji/saver.json', data.saver);
      assert.equal(10, data.delay);
    })
  });

  // ensureDefaults
  describe('ensureDefaults', () => {
    beforeEach(() => {
      prefs = new SaverPrefs(tmpdir);
    });

    it('works', () => {
      prefs.delay = undefined;
      prefs.sleep = undefined;

      // @todo this doesn't actually do anything because
      // of the way the getters work now

      prefs.ensureDefaults();
      assert.equal(5, prefs.delay);
      assert.equal(10, prefs.sleep);
    })
  });

  // currentData
  // describe('currentData', () => {
  //   beforeEach(() => {
  //     specifyConfig('config');
  //     prefs = new SaverPrefs(tmpdir);
  //   });

  //   it('works', () => {
  //     let result = prefs.currentData;

  //     console.log(result);

  //     assert.equal("bar", result.foo);
  //     assert.equal(100, result.level);
  //   })
  // });

  // sources
  describe('sources', () => {
    beforeEach(() => {
      specifyConfig('config');
      prefs = new SaverPrefs(tmpdir);
    });

    it('works', () => {
      let result = prefs.sources;

      assert.deepEqual(
        [ '/Users/colin/Dropbox/Projects/before-dawn-screensavers' ], result);
    });

    it('includes repo', () => {
      prefs.sourceRepo = "foo";
      let result = prefs.sources;
      let dest = path.join(tmpdir, "savers");

      assert.deepEqual(
        [ dest,
          '/Users/colin/Dropbox/Projects/before-dawn-screensavers' ], result);
    });

    // it('includes system', () => {
    //   let result = prefs.sources;
    //   let dest = path.join(tmpdir, "savers");

    //   assert.deepEqual(
    //     [ dest,
    //       '/Users/colin/Dropbox/Projects/before-dawn-screensavers' ], result);
    // });
  });

  // systemSource
  describe('sources', () => {
    beforeEach(() => {
      prefs = new SaverPrefs(tmpdir);
    });

    it('works', () => {
      let expected = path.join(tmpdir, "system-savers");
      assert.equal(expected, prefs.systemSource);
    });
  });

  // getOptions

  // write

  // writeSync

  // updatePrefs

  // setDefaultRepo

  // getters/setters

});
