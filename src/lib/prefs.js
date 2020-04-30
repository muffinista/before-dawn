"use strict";

const path = require("path");
const Conf = require("conf");

const DEFAULTS = {
  saver: {
    type: "string",
    default: ""
  },
  sourceRepo: {
    type: "string",
    default: ""
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
    default: ""
  },
  options: {
    default: {}
  },
  sourceUpdatedAt: {
    // type: "string",
    default: "1970-01-01T00:00:00.000Z"
  },
  updateCheckTimestamp: {
    // type: "string",
    default: "1970-01-01T00:00:00.000Z"
  },
  launchShortcut: {
    type: "string",
    default: ""
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
  }

  reset() {
    this.store.clear();
    this.store._write({});
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
    this.store.set("sourceUpdatedAt", new Date(0));
  }
}

Object.keys(DEFAULTS).forEach(function(name) {
  Object.defineProperty(SaverPrefs.prototype, name, {
    get() {
      // console.log(`GET ${name}`);
      const result = this.store.get(name);

      if ( name === "sourceUpdatedAt" || name === "updateCheckTimestamp" ) {
        return new Date(result);
      }

      return result;
    },
    set(newval) {
      // console.log(`SET ${name} -> ${newval}`);
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