"use strict";

const fs = require("fs-extra");
const nconf = require("nconf");
const path = require("path");
const mkdirp = require("mkdirp");
const rimraf = require("rimraf");

const Saver = require("./saver.js");
const Package = require("./package.js");

// wait for awhile before checking for a new package
const PACKAGE_WAIT_TIME = 60 * 60 * 1000;


var config_file = "config.json";
var baseDir;
var systemDir;
var loadedScreensavers = [];
var logger;
var _firstLoad = false;

var init = function(opts) {
  if ( typeof(opts) === "string" ) {
    opts = {
      base: opts
    }
  }

  baseDir = opts.base;
  if ( opts.systemDir ) {
    systemDir = opts.systemDir;
  }
  else {
    systemDir = baseDir;
  }

  if ( opts.logger ) {
    logger = opts.logger;
  }
  else {
    logger = function() {};
  }

  return setupFiles();
};

var setupFiles = function(load_savers) {
  return new Promise(function (resolve, reject) {
    var configPath = path.join(baseDir, config_file);
    var saversDir = defaultSaversDir();
    var results = {
      first: false,
      setup: false
    };

    logger("saversDir: " + saversDir, fs.existsSync(saversDir));
    logger("configPath: " + configPath);
    
    // check for/create our main directory
    // and our savers directory (which is a subdir
    // of the main dir)
    mkdirp(saversDir, function(err, made) {
      if ( err ) {
        logger("err!", err);
        return reject(err);
      }

      // check if we just created the folder,
      // if there's no config yet,
      // or if the savers folder was empty
      if ( made === true || ! fs.existsSync(configPath) || fs.readdirSync(saversDir).length === 0 ) {
        _firstLoad = true;
        results.first = true;
      }

      try {
        nconf.remove("file").file({
          file: configPath
        });
      }
      catch(e) {
        fs.unlinkSync(configPath);
        nconf.remove("file").file({
          file: configPath
        });
      }   

      ensureDefaults();
      
      if ( _firstLoad === true ) {
        writeSync();
      }
      else if ( typeof(load_savers) === "undefined" || load_savers === true ) {
        results.setup = true;
      }

      resolve(results);
    });
  });
};

var handlePackageChecks = function(opts) {
  var first = opts.first;
  var setup = opts.setup;

  logger("handlePackageChecks", opts);
  if ( first || setup ) {
    logger("need to setup packages");
    return setupPackages();
  }
  return Promise.resolve();
}

/**
 * reload all our data/config/etc
 */
var reload = function(load_savers) {
  var configPath = path.join(baseDir, config_file);
  var saversDir = defaultSaversDir();

  logger("savers.reload");

  return setupFiles(load_savers).then(handlePackageChecks);  
};

var reset = function() {
  loadedScreensavers = [];
};

/**
 * reload all our data/config/etc
 */
var setupPackages = function() {
  logger("setupPackages");
  return new Promise((resolve, reject) => {
    updatePackage().then((data) => {
      _firstLoad = false;
      
      if ( data.downloaded === true ) {
        setConfig("sourceUpdatedAt", data.updated_at);
      }

      listAll(function(data) {
        var current = nconf.get("saver");
        if (
          ( current === undefined || getCurrentData() === undefined ) && 
          data.length > 0
        ) {
          setConfig("saver", data[0].key);
          writeSync();
        }
        
        resolve();
      });
    });
  });
};

/**
 * delete a screensaver -- this removes the directory that contains all files
 * for the screensaver.
 */
var deleteSaver = function(s, cb) {
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

var defaultSaversDir = function() {
  return path.join(baseDir, "savers");
};

var getPackage = function() {
  var source = getSource();
  var sourceUpdatedAt = getSourceUpdatedAt();
  return new Package({
    repo:source,
    updated_at:sourceUpdatedAt,
    dest:defaultSaversDir()
  });
};

var updatePackage = function(p) {
  var lastCheckAt = getUpdateCheckTimestamp();
  var now = new Date().getTime();
  var diff = now - lastCheckAt;

  if ( p === undefined ) {
    p = getPackage();
  }

  logger("lastCheckAt: " + lastCheckAt + " - " + diff + " - " + PACKAGE_WAIT_TIME);
  // don't bother checking if there's no source repo specified,
  // or if we've pinged it recently
  if ( typeof(p.repo) === "undefined" || p.repo === "" || diff < PACKAGE_WAIT_TIME ) {
    logger("skip package check for now: " + diff);
    return Promise.resolve({downloaded: false});
  }
  else {
    setUpdateCheckTimestamp(now);
    writeSync();

    // @todo handle local check here
    logger("check package: " + p.repo);
    return p.checkLatestRelease();
  }
};


/**
 * setup some reasonable defaults
 */
var ensureDefaults = function() {
  var source;

  // check for our old repo config setup
  source = nconf.get("source:repo");
  if ( source !== undefined ) {
    setConfig("sourceRepo", source);
    setConfig("source", undefined);
    writeSync();
  }
  else {
    source = nconf.get("sourceRepo");
    if ( source === undefined ) {
      _firstLoad = true;
      setConfig("sourceRepo", global.SAVER_REPO);
    }
  }

  if ( typeof(global.CONFIG_DEFAULTS) !== undefined ) {
    for ( var k in global.CONFIG_DEFAULTS ) {
      if ( nconf.get(k) === undefined ) {
        setConfig(k, global.CONFIG_DEFAULTS[k]);
      }
    }
  }
};

var firstLoad = function() {
  return _firstLoad;
};


/**
 * look up a screensaver by key, and return it
 */
var getByKey = function(key) {
  var result = loadedScreensavers.find((obj) => {
    return obj.key === key;
  });
  return result;
};

/**
 * return the key of the current screensaver
 */
var getCurrent = function() {
  return nconf.get("saver");
};

var loadCurrent = function(cb) {
  var current = nconf.get("saver");
  listAll(function(data) {
    var result = data.find((obj) => {
      return obj.key === key;
    });

    cb(result);
  });
};

/**
 * return the object/data of the current screensaver
 */
var getCurrentData = function() {
  var key = nconf.get("saver");
  return getByKey(key);
};

/**
 * pick a random screensaver
 */
var getRandomScreensaver = function() {
  var tmp = loadedScreensavers.filter((s) => {
    return ( typeof(s.preload) === "undefined" );
  });
  var idx = Math.floor(Math.random() * tmp.length);

  return tmp[idx];
};

/**
 * run any defined preload scripts for the screensaver.
 * for now, there's really just one and it's basically 
 * hardcoded -- replace the given screensaver with a random one.
 */
var applyPreload = function(saver) {
  if ( saver.preload && saver.preload === "random" ) {
    return getRandomScreensaver();
  }

  return saver;
};

/**
 * return the URL of a zip file that is the source we will check to update our screensavers
 */
var getSource = function() {
  return nconf.get("sourceRepo");
};
var getSourceUpdatedAt = function() {
  return nconf.get("sourceUpdatedAt");
};

var setSource = function(x) {
  var s = getSource();
  if ( x !== s ) {
    reset();
    setUpdateCheckTimestamp(undefined);
    return nconf.set("sourceRepo", x);
  }
  else { 
    return nconf.get("sourceRepo");
  }
};

var setUpdateCheckTimestamp = function(x) {
  return nconf.set("sourceCheckTimestamp", x);
};
var getUpdateCheckTimestamp = function(x) {
  return nconf.get("sourceCheckTimestamp") || 0;
};

var getLocalSource = function() {
  return nconf.get("localSource") || "";
};
var setLocalSource = function(x) {
  reset();
  return nconf.set("localSource", x);
};


var systemSource = function() {
  return path.join(systemDir, "system-savers");
}


/**
 * set config var k to value v
 */
var setConfig = function(k, v) {
  nconf.set(k, v);
};

/**
 * set current screensaver key
 */
var setCurrent = function(x, opts) {
  setConfig("saver", x);

  if ( typeof(opts) !== "undefined" ) {
    setOptions(opts, x);
  }
};

var setDelay = function(x) {
  setConfig("delay", x);
};

var getDelay = function() {
  var val = nconf.get("delay");
  if ( typeof(val) === "undefined" ) {
    val = 15;
  }
  return parseInt(val, 10);
};


var setSleep = function(x) {
  setConfig("sleep", x);
};

var getSleep = function() {
  var val = nconf.get("sleep");
  if ( typeof(val) === "undefined" ) {
    val = 15;
  }
  return parseInt(val, 10);
};

var setLock = function(x) {
  setConfig("lock", x);
};

var getLock = function() {
  return nconf.get("lock") || false;
};

var setDisableOnBattery = function(x) {
  setConfig("disable_on_battery", x);
};

var getDisableOnBattery = function() {
  return nconf.get("disable_on_battery") || false;
};

var setRunOnSingleDisplay = function(x) {
  setConfig("run_on_single_display", x);
};

var getRunOnSingleDisplay = function() {
  return nconf.get("run_on_single_display") || false;
};


/**
 * set options for the specified screensaver
 */
var setOptions = function(opts, s) {
  var key;
  if ( typeof(s) === "undefined" ) {
    s = getCurrent();
  }
  key = "options:" + s;
  setConfig(key, opts);
};

var getOptions = function(name) {
  if ( typeof(name) === "undefined" ) {
    name = getCurrent();
  }
  var key = "options:" + name;
  var result = nconf.get(key) || {};

  return result;
};


/**
 * skip any folder which contains a '.before-dawn-skip' file
 * this way we can have templates and documentation and things like
 * that which won't get loaded into the app by mistake.
 */
var skipFolder = function(p) {
  return fs.existsSync(path.join(p, ".before-dawn-skip"));
};

/**
 * get a list of folders we should check for screensavers
 */
var sources = function() {
  var source = getSource();
  var local = getLocalSource();
  var system = systemSource();

  var root = path.join(baseDir, "savers");
  
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

/**
 * load screensaver data from filesystem
 */
var loadFromFile = function(src, settings) {
  return new Promise(function (resolve, reject) {
    fs.readFile(src, {encoding: "utf8"}, function (err, content) {
      if ( err ) {
        logger("loadFromFile err", src, err);
        reject(err);
      }
      else {
        try {
          var contents = JSON.parse(content);           
          var stub = path.dirname(src);
          var s = loadFromData(contents, stub, settings);

          if ( s.valid ) {
            resolve(s);
          }
          else {
            logger("loadFromFile not valid! " + src);
            reject();
          }
        }
        catch(e) {
          logger("loadFromFile exception", e);
          reject(e);
        }
      }
    });
  });
};

var loadFromData = function(contents, stub, settings) {
  var src = getLocalSource();

  if ( typeof(stub) !== "undefined" ) {
    contents.path = stub;
    contents.key = stub + "/" + contents.source;
  }

  contents.editable = false;
  if ( typeof(src) !== "undefined" && src !== "" ) {
    contents.editable = (contents.key.indexOf(src) === 0);
  }

  if ( typeof(contents.settings) === "undefined" ) {
    if ( settings === undefined ) {
      settings = getOptions(contents.key);
    }
    contents.settings = settings;
  }

  // ensure that all screensavers have options set
  if ( getOptions(contents.key) === {} ) {
    setOptions({}, contents.key);
  }
  
  return new Saver(contents);
};

/**
 * search for all screensavers we can find on the filesystem. if cb is specified,
 * call it with data when done. if reload == true, don't use cached data.
 */
var listAll = function(cb, force) {
  var folders = sources();
  var glob, pattern, savers;
  
  var promises = [];

  // exclude system screensavers from the cache check
  // @todo get rid of this
  var systemScreensaverCount = 1;

  // use cached data if available
  if ( loadedScreensavers.length > systemScreensaverCount &&
       ( typeof(force) === "undefined" || force === false ) ) {
    cb(loadedScreensavers);
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
      promises.push(loadFromFile(f));
    }
  }

  // filter out failed promises here
  // @see https://davidwalsh.name/promises-results
  promises = promises.map(p => p.catch(() => undefined))

  Promise.all(promises).then(function(data) {
    // remove any undefined screensavers
    data = data.filter(s => s !== undefined);
    loadedScreensavers = data.sort((s) => { return s.name.toLowerCase(); });
    cb(loadedScreensavers);
  });
};

var updatePrefs = function(data, cb) {
  for ( var k in data ) {
    var v = data[k];
    if ( k === "repo" ) {
      setSource(v);
    }
    else {
      nconf.set(k, v);
    }
  }

  // just write our data out -- setupPackages will
  // be called from the UI separately and we don't
  // want it to be called twice
  write(cb);
};

var write = function(cb) {
  var configPath = baseDir + "/" + config_file;
  nconf.save(cb);
};

var writeSync = function() {
  var configPath = baseDir + "/" + config_file;
  nconf.save();
};

var getConfig = function(cb) {
  var configPath = path.join(baseDir, config_file);
  fs.readFile(configPath, function(err, data) {
    cb(JSON.parse(data.toString()));
  });
}

var getConfigSync = function() {
  var configPath = path.join(baseDir, config_file);
  var data = fs.readFileSync(configPath);
  data = JSON.parse(data.toString());

  // add anything that might not exist, because
  // vue.js won't treat missing data properly
  if ( data.auto_start === undefined ) {
    data.auto_start = false;
  }

  return data;
}


/**
 * generate a screensaver template
 */
var generateScreensaver = function(src, opts) {
  var destDir = getLocalSource();

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

var getDefaults = function() {
  return {
    sourceRepo: global.SAVER_REPO,
    delay: 5,
    sleep: 10,
    lock: false,
    disable_on_battery: true,
    auto_start: false,
    run_on_single_display: false,
    localSource: ""
  };
};


exports.init = init;
exports.reload = reload;
exports.reset = reset;
exports.delete = deleteSaver;

exports.loadFromFile = loadFromFile;
exports.getByKey = getByKey;
exports.getCurrent = getCurrent;
exports.loadCurrent = loadCurrent;
exports.getSource = getSource;
  
exports.setSource = setSource;
exports.getLocalSource = getLocalSource;
exports.setLocalSource = setLocalSource;
exports.getCurrentData = getCurrentData;
exports.applyPreload = applyPreload;
exports.setCurrent = setCurrent;
exports.setOptions = setOptions;
exports.setDelay = setDelay;
exports.getDelay = getDelay;
exports.setSleep = setSleep;
exports.getSleep = getSleep;
exports.setLock = setLock;
exports.getLock = getLock;
exports.setDisableOnBattery = setDisableOnBattery;
exports.getDisableOnBattery = getDisableOnBattery;

exports.getRunOnSingleDisplay = getRunOnSingleDisplay;
exports.setRunOnSingleDisplay = setRunOnSingleDisplay;

exports.getOptions = getOptions;
exports.listAll = listAll;
exports.updatePrefs = updatePrefs;
exports.write = write;
exports.firstLoad = firstLoad;
exports.getConfig = getConfig;
exports.getConfigSync = getConfigSync;
exports.generateScreensaver = generateScreensaver;
exports.getDefaults = getDefaults;

exports.getPackage = getPackage;
exports.updatePackage = updatePackage;
exports.setupPackages = setupPackages;
exports.setUpdateCheckTimestamp = setUpdateCheckTimestamp;
exports.getUpdateCheckTimestamp = getUpdateCheckTimestamp;
exports.handlePackageChecks = handlePackageChecks;
