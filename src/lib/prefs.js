"use strict";

const fs = require("fs-extra");
const path = require("path");

const config_file = "config.json";

// @todo need a way to specify default repo on initial load

const PROPERTIES = [
  ["current", "saver", "string", undefined],
  ["sourceRepo", "sourceRepo", "string", undefined],
  ["delay", "delay", "integer", 5],
  ["sleep", "sleep", "integer", 10],
  ["lock", "lock", "boolean", false],
  ["disableOnBattery", "disable_on_battery", "boolean", true],
  ["auto_start", "auto_start", "boolean", false],
  ["runOnSingleDisplay", "run_on_single_display", "boolean", false],
  ["localSource", "localSource", "string", ""],
  ["sourceUpdatedAt", "sourceUpdatedAt", "string", undefined],
  ["options", "options", "hash", {}],
  ["updateCheckTimestamp", "sourceCheckTimestamp", "integer", 0]
];

class SaverPrefs {
  constructor(baseDir, _defaults) {
    this.baseDir = baseDir;
    this.configFile = path.join(baseDir, config_file);
    this.nconf = require("nconf");
    this.defaults = _defaults;

    this.reload();
  }

  reload() {
    this.firstLoad = false;
    this.nconf.reset();
    try {
      this.nconf.remove("file").file({
        file: this.configFile
      });
    }
    catch(e) {
      fs.unlinkSync(this.configFile);
      this.nconf.remove("file").file({
        file: this.configFile
      });
      this.writeSync();
      this.firstLoad = true;
    } 
  }

  needSetup() {
    return this.firstLoad === true || 
      this.noSource === true || 
      this.current === undefined ||
      this.current === "";
  }

  get noSource() {
    return (this.sourceRepo === undefined || this.sourceRepo === "" ) &&
      (this.localSource === undefined || this.localSource === "");
  }

  get defaultSaversDir() {
    return path.join(this.baseDir, "savers");
  };

  toHash() {
    let result = {};
    for ( var i = 0; i < PROPERTIES.length; i++ ) {
      let name, key, type, value;
      [name, key, type, value] = PROPERTIES[i];

      result[key] = this[name];
    }

    return result;
  };
  
  /**
   * setup some reasonable defaults
   */
  ensureDefaults() {
    if ( typeof(this.defaults) !== undefined ) {
      for ( var k in this.defaults ) {
        if ( this.nconf.get(k) === undefined ) {
          this.setConfig(k, this.defaults[k]);
        }
      }
    }
  };


  // /**
  //  * return the object/data of the current screensaver
  //  */
  // get currentData() {
  //   var key = this.nconf.get("saver");
  //   return getByKey(key);
  // };


  /**
   * get a list of folders we should check for screensavers
   */
  get sources() {
    var source = this.sourceRepo;
    var local = this.localSource;
    var system = this.systemSource;

    var root = path.join(this.baseDir, "savers");
    
    var folders = [];

    // if we're pulling savers from a git repo, this is where
    // they will be located
    if ( source !== undefined && source !== "" ) {
      folders.push(root);
    }

    // if there's a local source, use that
    if ( local !== "" && fs.existsSync(local)) {
      folders = folders.concat( local );
    }

    if ( fs.existsSync(system) ) {
      folders = folders.concat( system );
    }

    return folders;
  };

  get systemSource() {
    return path.join(this.baseDir, "system-savers");
  }
  
  /**
   * set config var k to value v
   */
  setConfig(k, v) {
    this.nconf.set(k, v);
  };

  // /**
  //  * set current screensaver key
  //  */
  // setCurrent(x, opts) {
  //   this.current = x;

  //   if ( typeof(opts) !== "undefined" ) {
  //     setOptions(opts, x);
  //   }
  // };

  // /**
  //  * set options for the specified screensaver
  //  */
  // setOptions(opts, s) {
  //   var key;
  //   if ( typeof(s) === "undefined" ) {
  //     s = this.current;
  //   }
  //   key = "options:" + s;
  //   this.setConfig(key, opts);
  // };

  getOptions(name) {
    if ( typeof(name) === "undefined" ) {
      name = this.current;
    }
    var key = "options:" + name;
    var result = this.nconf.get(key) || {};

    return result;
  };

  updatePrefs(data, cb) {
    for ( var k in data ) {
      var v = data[k];
      this[k] = v;
    }

    let result = this.changes;
    this.changes = {}

    this.write(() => {
      cb(result)
    });
  };

  write(cb) {
    this.nconf.save(cb);
  };
  
  writeSync() {
    this.nconf.save();
  };
  
  // getConfig(cb) {
  //   fs.readFile(this.configFile, function(err, data) {
  //     cb(JSON.parse(data.toString()));
  //   });
  // }
  
  // getConfigSync() {
  //   var data = {};

  //   if ( fs.existsSync(this.configFile) ) {
  //     data = fs.readFileSync(this.configFile);
  //     data = JSON.parse(data.toString());  
  //   }
  //   else {
  //     data = this.defaults;
  //   }
  
  //   // add anything that might not exist, because
  //   // vue.js won't treat missing data properly
  //   if ( data.auto_start === undefined ) {
  //     data.auto_start = false;
  //   }
  
  //   return data;
  // }

  setDefaultRepo(r) {
    this.sourceRepo = r;
    this.sourceUpdatedAt = undefined;
  }
}


for ( var i = 0; i < PROPERTIES.length; i++ ) {
  let name, key, type, value;
  [name, key, type, value] = PROPERTIES[i];

  Object.defineProperty(SaverPrefs.prototype, name, {
    get() {
      let v = this.nconf.get(key) || value;
      if ( type == "integer" ) {
        return parseInt(v, 10);
      }
      if ( type == "boolean" ) {
        return (/true/i).test(v);
      }
      return v;
    },
    set(newval) {
      if ( this.changes === undefined ) {
        this.changes = {};
      }

      if ( this.changes[key] === undefined && this.nconf.get(key) !== newval ) {
        this.changes[key] = newval;
      }

      this.setConfig(key, newval);
    }
  });
}


module.exports = SaverPrefs;