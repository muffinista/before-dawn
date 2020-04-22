"use strict";

const fs = require("fs-extra");
const path = require("path");
const mkdirp = require("mkdirp");

const lockfile = require("proper-lockfile");

const CONFIG_FILE_NAME = "config.json";

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
  ["sourceUpdatedAt", "sourceUpdatedAt", "date", undefined],
  ["options", "options", "hash", {}],
  ["updateCheckTimestamp", "sourceCheckTimestamp", "integer", 0],
  ["launchShortcut", "launchShortcut", "string", undefined],
];

class SaverPrefs {
  constructor(paths, _defaults) {
    if ( typeof(paths) === "string" ) {
      this.baseDir = paths;
    }
    else {
      this.baseDir = paths.baseDir;
      this.systemSource = paths.systemSource;
    }

    if ( this.systemSource === undefined ) {
      this.systemSource = path.join(this.baseDir, "system-savers");
    }

    this.configFile = path.join(this.baseDir, CONFIG_FILE_NAME);
    this.defaults = _defaults;

    mkdirp.sync(this.baseDir);
    this.reload();
  }

  set defaults(_defaults) {
    this._defaults = _defaults;
  }

  loadData() {
    this._data = JSON.parse(fs.readFileSync(this.configFile));
  }

  reload() {
    this.firstLoad = false;
    this._data = {};

    try {
      this.loadData();
    }
    catch(e) {
      this.ensureDefaults();
      this.writeSync();
      this.loadData();
      this.firstLoad = true;
    } 
  }

  reset() {
    this.firstLoad = true;
    this._data = {};
    this.ensureDefaults();
    this.writeSync();
    this.loadData();
  }

  get needSetup() {
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
  }

  toHash() {
    let result = {};
    for ( var i = 0; i < PROPERTIES.length; i++ ) {
      // eslint-disable-next-line no-unused-vars
      let name, key, type, value;
      [name, key, type, value] = PROPERTIES[i];

      result[key] = this[name];
    }

    return result;
  }
  
  /**
   * setup some reasonable defaults
   */
  ensureDefaults() {
    if ( typeof(this._defaults) !== undefined ) {
      for ( var k in this._defaults ) {
        if ( this._data[k] === undefined ) {
          this.setConfig(k, this._defaults[k]);
        }
      }
    }
  }


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

    
    folders = folders.concat( system );

    return folders;
  }

  get systemSource() {
    return this._systemSource;
  }
  
  set systemSource(val) {
    this._systemSource = val;
  }

  /**
   * set config var k to value v
   */
  setConfig(k, v) {
    this._data[k] = v;
  }


  getOptions(name) {
    if ( typeof(name) === "undefined" ) {
      name = this.current;
    }

    if ( name === "undefined" ) {
      return {};
    }

    if ( this._data.options === undefined ) {
      this._data.options = {};
    }

    return this._data.options[name] || {};
  }

  async updatePrefs(data) {
    for ( var k in data ) {
      var v = data[k];
      this[k] = v;
    }

    let result = this.changes;
    this.changes = {};

    this.writeSync();
    // await this.write();

    return result;
  }

  // async write() {
  //   let release = await lockfile.lock(this.configFile, { realpath: false });
  //   await fs.writeJson(this.configFile, this._data, { spaces: 2 });

  //   release();
  // }
  
  writeSync() {
    let output = JSON.stringify(this._data, null, 2);
    let release = lockfile.lockSync(this.configFile, { realpath: false });

    fs.writeFileSync(this.configFile, output);
    release();
  }

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
      let v = this._data[key];
      // don't assign default value unless it's explicitly missing
      // ie, don't overwrite "false"!
      if ( v === undefined || v === null ) {
        v = value;
      }

      if ( type == "integer" ) {
        return parseInt(v, 10);
      }
      if ( type == "boolean" ) {
        return (/true/i).test(v);
      }
      if ( type === "date" ) {
        let tmp = new Date(v);
        if ( isNaN(tmp.getTime()) ) {
          v = undefined;
        }
        else {
          v = tmp;
        }
      }
      return v;
    },
    set(newval) {
      if ( this.changes === undefined ) {
        this.changes = {};
      }

      if ( this.changes[key] === undefined && this._data[key] !== newval ) {
        this.changes[key] = newval;
      }

      this.setConfig(key, newval);
    }
  });
}


module.exports = SaverPrefs;