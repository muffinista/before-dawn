"use strict";

const path = require("path");
const Conf = require("conf");

const DEFAULTS = require("./prefs-schema.json");

class SaverPrefs {
  constructor(baseConfigDir, rootDir=undefined, saversDir=undefined) {
    this.baseDir = baseConfigDir;

    if ( rootDir === undefined ) {
      this.rootDir = this.baseDir;
    }
    else {
      this.rootDir = rootDir;
    }

    if ( saversDir === undefined ) {
      this.saversDir = path.join(this.rootDir, "savers");
    }
    else {
      this.saversDir = saversDir;
    }

    this.systemSource = path.join(this.rootDir, "system-savers");

    this.confOpts = {
      schema: DEFAULTS,
      clearInvalidConfig: true,
      cwd: this.baseDir
    };
    if ( process.env.CONFIG_DIR ) {
      this.confOpts.cwd = process.env.CONFIG_DIR;
    }

    this.reload();
  }

  get configFile() {
    return this.store.path;
  }

  get data() {
    let result = {};
    let self = this;
    Object.keys(DEFAULTS).forEach(function(name) {
      result[name] = self.store.get(name);
    });
    return result;
  }

  get defaults() {
    let result = {};
    Object.keys(DEFAULTS).forEach(function(name) {
      result[name] = DEFAULTS[name].default;
    });
    return result;
  }

  reload() {
    this.store = new Conf(this.confOpts);
    this.firstLoad = this.store.get("firstLoad", true);
    if ( this.firstLoad === true ) {
      this.store.set("firstLoad", false);
    }

    if (this.saver) {
      this.saver = this.saver.split(path.sep).join(path.posix.sep);
    }
  }

  reset() {
    this.store.clear();
    this.store._write({});
  }

  get needSetup() {
    return this.firstLoad === true || 
      this.saver === undefined ||
      this.saver === "";
  }


  get defaultSaversDir() {
    return this.saversDir;
  }

  /**
   * get a list of folders we should check for screensavers
   */
  get sources() {
    var local = this.localSource;
    var system = this.systemSource;
    
    var folders = [this.defaultSaversDir];

    // if there's a local source, use that
    if ( local !== "" ) {
      folders = folders.concat( local );
    }
    
    folders = folders.concat( system );
    return folders;
  }

  get systemSource() {
    return this._systemSource;
  }
  
  set systemSource(val) {
    this._systemSource = val;
  }


  //
  // get options for the specified screensaver
  //
  getOptions(name) {
    if ( typeof(name) === "undefined" ) {
      name = this.saver;
    }

    const opts = this.store.get("options", {});
    const result = opts[name];

    if ( result === undefined ) {
      return {};
    }

    return result;
  }
}


Object.keys(DEFAULTS).forEach(function(name) {
  Object.defineProperty(SaverPrefs.prototype, name, {
    get() {
      const result = this.store.get(name);
      
      if ( name === "sourceUpdatedAt" || name === "updateCheckTimestamp" ) {
        return new Date(result);
      }
      
      return result;
    },
    set(newval) {
      if ( newval === undefined ) {
        this.store.delete(name);
      }
      else {
        if ( typeof(newval) === "object" && ( name === "sourceUpdatedAt" || name === "updateCheckTimestamp" )) {
          newval = newval.toISOString();
        }
        this.store.set(name, newval);
      }
    }
  });
});

module.exports = SaverPrefs;
