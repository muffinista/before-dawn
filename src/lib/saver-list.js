"use strict";

const fs = require("fs-extra");
const path = require("path");
const mkdirp = require("mkdirp");
const rimraf = require("rimraf");
const glob = require("glob");

const CONFIG_FILE_NAME = "config.json";


/**
 * skip any folder which contains a '.before-dawn-skip' file
 * this way we can have templates and documentation and things like
 * that which won't get loaded into the app by mistake.
 */
var skipFolder = function(p) {
  return fs.existsSync(path.join(p, ".before-dawn-skip"));
};


module.exports = class SaverListManager {
  constructor(opts, logger) {
    this.prefs = opts.prefs;
    this.loadedScreensavers = [];

    if ( logger !== undefined ) {
      this.logger = logger;
    }
    else {
      this.logger = function() {};
    }

    if ( typeof(opts) === "string" ) {
      opts = {
        base: opts
      };
    }
  
    this.baseDir = this.prefs.baseDir;
  }
  
  get defaultSaversDir() {
    return path.join(this.baseDir, "savers");
  }
  
  setup() {
    let _self = this;
    return new Promise(function (resolve, reject) {
      var configPath = path.join(_self.baseDir, CONFIG_FILE_NAME);
      var saversDir = _self.defaultSaversDir;
      var results = {
        first: false,
        setup: false
      };
  
      _self.logger("saversDir: " + saversDir, fs.existsSync(saversDir));
      _self.logger("configPath: " + configPath);
      
      // check for/create our main directory
      // and our savers directory (which is a subdir
      // of the main dir)
      mkdirp(saversDir).then((made) => {
 
        // check if we just created the folder,
        // if there's no config yet,
        // or if the savers folder was empty
        if ( made === true || ! fs.existsSync(configPath) || fs.readdirSync(saversDir).length === 0 ) {
          results.first = true;
        }
  
        results.setup = true;
  
        resolve(results);
      }, (err) => {
          _self.logger("err!", err);
          return reject(err);
      });
    });
  }
  
  /**
   * reload all our data/config/etc
   */
  reload(load_savers) {
    this.logger("savers.reload");
    return this.setup(load_savers).then(this.handlePackageChecks);  
  }

  reset() {
    this.loadedScreensavers = [];
  }

  /**
   * search for all screensavers we can find on the filesystem. if cb is specified,
   * call it with data when done. if reload == true, don't use cached data.
   */
  async list(force) {
    let _self = this;
    var folders = this.prefs.sources;
    var pattern, savers;
    
    var promises = [];
    
    // exclude system screensavers from the cache check
    // @todo get rid of this
    var systemScreensaverCount = 1;

    // use cached data if available
    if ( this.loadedScreensavers.length > systemScreensaverCount &&
        ( typeof(force) === "undefined" || force === false ) ) {
      return this.loadedScreensavers;
    }

    // note: using /**/ here instead of /*/ would
    // also match all subdirectories, which might be desirable
    // or even required, but is a lot slower, so not doing it
    // for now
    folders = folders.filter((el) => { 
      return el !== undefined && el !== "" && fs.existsSync(el);
    });

    folders.forEach((sourceFolder) => {
      pattern = `${sourceFolder}/*/saver.json`;
      savers = glob.sync(pattern);

      for ( var i = 0; i < savers.length; i++ ) {
        var f = savers[i];
        var folder = path.dirname(f);

        // exclude skippable folders
        var doLoad = ! folder.split(/[/|\\]/).reverse()[0].match(/^__/) &&
                    ! skipFolder(folder);
        
        if ( doLoad ) {
          promises.push(this.loadFromFile(f));
        }
      }  
    });

    // filter out failed promises here
    // @see https://davidwalsh.name/promises-results
    promises = promises.map(p => p.catch(() => undefined));

    const data = await Promise.all(promises);

    // remove any undefined screensavers
    _self.loadedScreensavers = data.
      filter(s => s !== undefined).
      sort((a, b) => { 
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase()); 
      });

    return _self.loadedScreensavers;
  }


  /**
   * pick a random screensaver
   */
  random() {
    var tmp = this.loadedScreensavers.filter((s) => {
      return ( typeof(s.preload) === "undefined" );
    });
    var idx = Math.floor(Math.random() * tmp.length);

    return tmp[idx];
  }

  async confirmExists(key) {
    await this.list();
    return this.getByKey(key) !== undefined;
  }

  /**
   * look up a screensaver by key, and return it
   */
  getByKey(key) {
    var result = this.loadedScreensavers.find((obj) => {
      return obj.key === key;
    });
    return result;
  }


  /**
   * load screensaver data from filesystem
   */
  loadFromFile(src, settings) {
    let _self = this;

    return new Promise(function (resolve, reject) {
      fs.readFile(src, {encoding: "utf8"}, (err, content) => {
        if ( err ) {
          _self.logger("loadFromFile err", src, err);
          reject(err);
        }
        else {
          try {
            var contents = JSON.parse(content);           
            var stub = path.dirname(src);
            var s = _self.loadFromData(contents, stub, settings);

            // add the source path as an attribute to make it easier
            // to load/save/update this saver later if needed
            s.src = src;

            if ( s.valid ) {
              resolve(s);
            }
            else {
              _self.logger("loadFromFile not valid! " + src);
              reject();
            }
          }
          catch(e) {
            _self.logger("loadFromFile exception", e);
            reject(e);
          }
        }
      });
    });
  }

  loadFromData(contents, stub, settings) {
    var src = this.prefs.localSource;

    if ( typeof(stub) !== "undefined" ) {
      contents.path = stub;
      contents.key = path.join(stub, "saver.json");
    }

    contents.editable = false;
    if ( typeof(src) !== "undefined" && src !== "" ) {
      contents.editable = (contents.key.indexOf(src) === 0);
    }

    if ( typeof(contents.settings) === "undefined" ) {
      if ( settings === undefined ) {
        if ( ! this.prefs.options ) {
          this.prefs.options = {};
        }

        // ensure that all screensavers have options set
        if ( this.prefs.options[contents.key] === undefined ) {
          this.prefs.options[contents.key] = {};
        }

        settings = this.prefs.options[contents.key];
      }
      contents.settings = settings;
    }

    // set a URL
    if ( typeof(contents.url) === "undefined" && 
      contents.path !== undefined  && 
      contents.source !== undefined) {
      contents.url = `file://${[contents.path, contents.source].join("/")}`;
    }

    if ( typeof(contents.published) === "undefined" ) {
      contents.published = true;
    }

    if ( typeof(contents.requirements) === "undefined" ) {
      contents.requirements = ["screen"];
    }

    contents.valid = typeof(contents.name) !== "undefined" &&
      typeof(contents.description) !== "undefined" &&
      contents.published === true;

    return contents;
  }

  /**
   * delete a screensaver -- this removes the directory that contains all files
   * for the screensaver.
   */
  delete(s) {
    var k = s.key;
    var p = path.dirname(k);
    let _self = this;

    return new Promise(function (resolve, reject) {
      if ( typeof(s) !== "undefined" && s.editable === true ) {
        rimraf(p, () => { 
          _self.reload();
          resolve(true);
        });
      }
      else {
        reject(false);
      }
    });

    // var cbWrapped = function(result) {
    //   _self.reload().then(() => cb(result));
    // };
    
    // // make sure we're deleting a screensaver that exists and is
    // // actually editable
    // if ( typeof(s) !== "undefined" && s.editable === true ) {
    //   rimraf(p, () => { cbWrapped(true); });
    // }
    // else {
    //   cb(false);
    // }
  }
};
