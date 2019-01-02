"use strict";

const fs = require("fs-extra");
const path = require("path");
const mkdirp = require("mkdirp");
const rimraf = require("rimraf");

const Saver = require("./saver.js");

const config_file = "config.json";


/**
 * skip any folder which contains a '.before-dawn-skip' file
 * this way we can have templates and documentation and things like
 * that which won't get loaded into the app by mistake.
 */
var skipFolder = function(p) {
  return fs.existsSync(path.join(p, ".before-dawn-skip"));
};


module.exports = class SaverListManager {
  constructor(opts) {
    this.prefs = opts.prefs;
    this.loadedScreensavers = [];
    this._firstLoad = false;

    if ( this.prefs.logger !== undefined ) {
      this.logger = this.prefs.logger;
    }
    else {
      this.logger = function() {};
    }

    if ( typeof(opts) === "string" ) {
      opts = {
        base: opts
      }
    }
  
    this.baseDir = this.prefs.baseDir;
  }

  get firstLoad() {
    return this._firstLoad;
  };
  
  get defaultSaversDir() {
    return path.join(this.baseDir, "savers");
  };
  
  setup(load_savers) {
    let _self = this;
    return new Promise(function (resolve, reject) {
      var configPath = path.join(_self.baseDir, config_file);
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
      mkdirp(saversDir, function(err, made) {
        if ( err ) {
          _self.logger("err!", err);
          return reject(err);
        }
  
        // check if we just created the folder,
        // if there's no config yet,
        // or if the savers folder was empty
        if ( made === true || ! fs.existsSync(configPath) || fs.readdirSync(saversDir).length === 0 ) {
          //_firstLoad = true;
          results.first = true;
        }
  
        results.setup = true;
  
        resolve(results);
      });
    });
  };
  
  /**
   * reload all our data/config/etc
   */
  reload(load_savers) {
    this.logger("savers.reload");
    return setup(load_savers).then(handlePackageChecks);  
  };

  reset() {
    this.loadedScreensavers = [];
  };

  /**
   * search for all screensavers we can find on the filesystem. if cb is specified,
   * call it with data when done. if reload == true, don't use cached data.
   */
  list(cb, force) {
    let _self = this;
    var folders = this.prefs.sources;
    var glob, pattern, savers;
    
    var promises = [];

    // exclude system screensavers from the cache check
    // @todo get rid of this
    var systemScreensaverCount = 1;

    // use cached data if available
    if ( this.loadedScreensavers.length > systemScreensaverCount &&
        ( typeof(force) === "undefined" || force === false ) ) {
      cb(this.loadedScreensavers);
      return;
    }

    glob = require("glob");

    // note: using /**/ here instead of /*/ would
    // also match all subdirectories, which might be desirable
    // or even required, but is a lot slower, so not doing it
    // for now
    pattern = "{" + folders.join(",") + ",}/*/saver.json";
    savers = glob.sync(pattern);

    for ( var i = 0; i < savers.length; i++ ) {
      var f = savers[i];
      var folder = path.dirname(f);
      var doLoad = ! folder.split(path.sep).reverse()[0].match(/^__/) &&
                  ! skipFolder(folder);
      
      if ( doLoad ) {
        promises.push(this.loadFromFile(f));
      }
    }

    // filter out failed promises here
    // @see https://davidwalsh.name/promises-results
    promises = promises.map(p => p.catch(() => undefined))

    Promise.all(promises).then(function(data) {
      // remove any undefined screensavers
      _self.loadedScreensavers = data.
        filter(s => s !== undefined).
        sort((a, b) => { 
          return a.name.toLowerCase().localeCompare(b.name.toLowerCase()) 
        });
      cb(_self.loadedScreensavers);
    });
  };

  
  /**
   * look up a screensaver by key, and return it
   */
  getByKey(key) {
    var result = this.loadedScreensavers.find((obj) => {
      return obj.key === key;
    });
    return result;
  };


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
  };

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
        // ensure that all screensavers have options set
        if ( this.prefs.options[contents.key] === undefined ) {
          this.prefs.options[contents.key] = {};
        }

        settings = this.prefs.options[contents.key];
      }
      contents.settings = settings;
    }

    
    return new Saver(contents);
  };


  /**
   * generate a screensaver template
   */
  create(src, opts) {
    var destDir = this.prefs.localSource;

    var contents = fs.readdirSync(src);
    var defaults = {
      "source": "index.html",
      "options": []
    };

    if ( destDir === "" ) {
      throw new Error("No local directory specified!");
    }

    opts = Object.assign({}, defaults, opts);
    opts.key = opts.name.toLowerCase().
                    replace(/[^a-z0-9]+/gi, "-").
                    replace(/-$/, "").
                    replace(/^-/, "");

    var dest = path.join(destDir, opts.key);
    fs.mkdirpSync(dest);

    contents.forEach(function(content) {
      fs.copySync(path.join(src, content), path.join(dest, content));
    });

    //
    // generate JSON file
    //
    var configDest = path.join(dest, "saver.json");
    var content = fs.readFileSync( configDest );
    contents = Object.assign({}, JSON.parse(content), opts);

    fs.writeFileSync(configDest, JSON.stringify(contents, null, 2));

    // add dest in case someone needs it
    // but don't persist that data because that would be icky
    opts.dest = path.join(dest, "saver.json");
    
    return opts;
  };


  /**
   * delete a screensaver -- this removes the directory that contains all files
   * for the screensaver.
   */
  delete(s, cb) {
    var k = s.key;
    var p = path.dirname(k);

    var cbWrapped = function() {
      reload(cb);
    };
    
    // make sure we're deleting a screensaver that exists and is
    // actually editable
    if ( typeof(s) !== "undefined" && s.editable === true ) {
      rimraf(p, cbWrapped);
    }
    else {
      cbWrapped();
    }
  };
}



// var handlePackageChecks = function(opts) {
//   var first = opts.first;
//   var setup = opts.setup;

//   this.logger("handlePackageChecks", opts);
//   if ( first || setup ) {
//     this.logger("need to setup packages");
//     return setupPackages();
//   }
//   return Promise.resolve();
// }

// /**
//  * reload all our data/config/etc
//  */
// var setupPackages = function() {
//   this.logger("setupPackages");
//   return new Promise((resolve, reject) => {
//     updatePackage().then((data) => {
//       _firstLoad = false;
      
//       if ( data.downloaded === true ) {
//         setConfig("sourceUpdatedAt", data.updated_at);
//       }

//       listAll(function(data) {
//         var current = nconf.get("saver");
//         if (
//           ( current === undefined || getCurrentData() === undefined ) && 
//           data.length > 0
//         ) {
//           setConfig("saver", data[0].key);
//           writeSync();
//         }
        
//         resolve();
//       });
//     });
//   });
// };


// var getPackage = function() {
//   var source = getSource();
//   var sourceUpdatedAt = getSourceUpdatedAt();
//   return new Package({
//     repo:source,
//     updated_at:sourceUpdatedAt,
//     dest:defaultSaversDir()
//   });
// };

// var updatePackage = function(p) {
//   var lastCheckAt = getUpdateCheckTimestamp();
//   var now = new Date().getTime();
//   var diff = now - lastCheckAt;

//   if ( p === undefined ) {
//     p = getPackage();
//   }

//   this.logger("lastCheckAt: " + lastCheckAt + " - " + diff + " - " + PACKAGE_WAIT_TIME);
//   // don't bother checking if there's no source repo specified,
//   // or if we've pinged it recently
//   if ( typeof(p.repo) === "undefined" || p.repo === "" || diff < PACKAGE_WAIT_TIME ) {
//     this.logger("skip package check for now: " + diff);
//     return Promise.resolve({downloaded: false});
//   }
//   else {
//     setUpdateCheckTimestamp(now);
//     writeSync();

//     // @todo handle local check here
//     this.logger("check package: " + p.repo);
//     return p.checkLatestRelease();
//   }
// };


// var loadCurrent = function(cb) {
//   var current = nconf.get("saver");
//   listAll(function(data) {
//     var result = data.find((obj) => {
//       return obj.key === key;
//     });

//     cb(result);
//   });
// };

// /**
//  * pick a random screensaver
//  */
// var getRandomScreensaver = function() {
//   var tmp = this.loadedScreensavers.filter((s) => {
//     return ( typeof(s.preload) === "undefined" );
//   });
//   var idx = Math.floor(Math.random() * tmp.length);

//   return tmp[idx];
// };

// /**
//  * run any defined preload scripts for the screensaver.
//  * for now, there's really just one and it's basically 
//  * hardcoded -- replace the given screensaver with a random one.
//  */
// var applyPreload = function(saver) {
//   if ( saver.preload && saver.preload === "random" ) {
//     return getRandomScreensaver();
//   }

//   return saver;
// };
