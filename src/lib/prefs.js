"use strict";

const path = require("path");
const Conf = require("conf");

const DEFAULTS = {
  saver: {
    type: "string",
    default: undefined
  },
  sourceRepo: {
    type: "string",
    default: undefined
  },
  delay: {
    type: "number",
    default: 5
  },
  sleep: {
    type: "number",
    default: 10
  },
  lock: {
    type: "boolean",
    default: false
  },
  disableOnBattery: {
    type: "boolean",
    default: true
  },
  auto_start: {
    type: "boolean",
    default: false
  },
  runOnSingleDisplay: {
    type: "boolean",
    default: false
  },
  localSource: {
    type: "string",
    default: undefined
  },
  sourceUpdatedAt: {
    //type: "date-time",
    default: undefined
  },
  options: {
    default: {}
  },
  updateCheckTimestamp: {
    //type: "date-time",
    default: undefined
  },
  launchShortcut: {
    type: "string",
    default: undefined
  },
};

class SaverPrefs {
  constructor(baseDir, systemSource=undefined) {
    this.baseDir = baseDir;

    if ( systemSource !== undefined ) {
      this.systemSource = systemSource;
    }
    else {
      this.systemSource = path.join(this.baseDir, "system-savers");
    }

    this.confOpts = {
      schema: DEFAULTS,
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
    Object.keys(DEFAULTS).forEach(function(name) {
      result[name] = this.store.get(name);
    });
    return result;
  }

  reload() {
    this.store = new Conf(this.confOpts);

    this.firstLoad = this.store.get("firstLoad", true);
    if ( this.firstLoad ) {
      this.store.set("firstLoad", false);
    }
  }

  reset() {
    this.store.reset();
  }

  get needSetup() {
    return this.firstLoad === true || 
      this.noSource === true || 
      this.saver === undefined ||
      this.saver === "";
  }

  get noSource() {
    return (this.sourceRepo === undefined || this.sourceRepo === "" ) &&
      (this.localSource === undefined || this.localSource === "");
  }

  get defaultSaversDir() {
    return path.join(this.baseDir, "savers");
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

  async updatePrefs(data) {
    for ( var k in data ) {
      var v = data[k];
      //this[k] = v;
      this.store.set(k, v);
    }

    let result = this.changes;
    this.changes = {};

    return result;
  }

  setDefaultRepo(r) {
    this.sourceRepo = r;
    this.store.delete("sourceUpdatedAt");
  }

  ensureDefaults() {

  }
}

Object.keys(DEFAULTS).forEach(function(name) {
  Object.defineProperty(SaverPrefs.prototype, name, {
    get() {
      // console.log(`GET ${name}`);
      return this.store.get(name);
    },
    set(newval) {
      // console.log(`SET ${name} -> ${newval}`);
      if ( newval === undefined ) {
        this.store.delete(name);
      }
      else {
        this.store.set(name, newval);
      }
    }
  });
});

module.exports = SaverPrefs;