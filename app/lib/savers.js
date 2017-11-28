"use strict";

const fs = require("fs-extra");
const nconf = require("nconf");
const path = require("path");
const _ = require("lodash");
const mkdirp = require("mkdirp");
const rimraf = require("rimraf");

const Saver = require("./saver.js");

// wait for awhile before checking for a new package
const PACKAGE_WAIT_TIME = 60 * 60 * 1000;


var config_file = "config.json";
var baseDir;
var loadedScreensavers = [];

var _firstLoad = false;

var init = function(_path, cb) {
  baseDir = path.resolve(_path);
  reload(cb);
};

/**
 * reload all our data/config/etc
 */
var reload = function(cb, load_savers) {
  var configPath = path.join(baseDir, config_file);
  var saversDir = defaultSaversDir();

  
  if ( typeof(cb) === "undefined" ) {
    cb = console.log;
  }

  // check for/create our main directory
  // and our savers directory (which is a subdir
  // of the main dir)
  mkdirp(saversDir, function(err, made) {
    if ( made === true || ! fs.existsSync(configPath) ) {
      _firstLoad = true;
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
      setupPackages(function() {
        cb();
        _firstLoad = false;
      });
    }
    else if ( typeof(load_savers) === "undefined" || load_savers === true ) {
      setupPackages(cb);
    }
    else {
      cb();
    }
  });
};

var reset = function() {
  loadedScreensavers = [];
};

/**
 * reload all our data/config/etc
 */
var setupPackages = function(cb) {
  updatePackage(function(data) {
    if ( data.downloaded === true ) {
      setConfig("source:updated_at", data.updated_at);
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

      cb();
    });
  });
};

/**
 * delete a screensaver -- this removes the directory that contains all files
 * for the screensaver.
 */
var deleteSaver = function(k, cb) {
  var p = path.dirname(k);
  var s = getByKey(k);
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

var updatePackage = function(cb) {
  var source = getSource();

  var lastCheckAt = getUpdateCheckTimestamp();
  var now = new Date().getTime();

  var diff = now - lastCheckAt;

  // don't bother checking if there's no source repo specified,
  // or if we've pinged it recently
  if ( typeof(source.repo) === "undefined" || source.repo === "" || diff < PACKAGE_WAIT_TIME ) {
    cb({downloaded: false});
  }
  else {   
    var Package = require("./package.js");
    var p = new Package({
      repo:source.repo,
      updated_at:source.updated_at,
      dest:defaultSaversDir()
    });

    setUpdateCheckTimestamp(now);

    // @todo handle local check here

    p.checkLatestRelease(cb);
  }
};


/**
 * setup some reasonable defaults
 */
var ensureDefaults = function() {
  var source = nconf.get("source");
  if ( source === undefined ) {
    _firstLoad = true;
    setConfig("source", {
      repo: global.SAVER_REPO,
      hash: ""
    });
  }
};

var firstLoad = function() {
  return _firstLoad;
};


/**
 * look up a screensaver by key, and return it
 */
var getByKey = function(key) {
  var result = _.find(loadedScreensavers, function(obj) {
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
    var result = _.find(data, function(obj) {
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
  var s = _.sample(
    _.reject(loadedScreensavers, function(s) {
      return ( typeof(s.preload) !== "undefined" );
    })
  );

  return s;
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
  return nconf.get("source");
};

var setSource = function(x) {
  var s = getSource();
  if ( x !== s.repo ) {
    return nconf.set("source", {
      repo: x
    });
  }
  else { 
    return nconf.get("source");
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
  return val;
};


var setSleep = function(x) {
  setConfig("sleep", x);
};

var getSleep = function() {
  var val = nconf.get("sleep");
  if ( typeof(val) === "undefined" ) {
    val = 15;
  }
  return val;
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
  var root = path.join(baseDir, "savers");
  var system = path.join(baseDir, "system-savers");
  var system2 = path.join(__dirname, "..", "system-savers");  

  
  var folders = [];

  // if we're pulling savers from a git repo, this is where
  // they will be located
  if ( source !== undefined && typeof(source.repo) !== "undefined" && source.repo !== "" ) {
    folders.push(root);
  }

  // if there's a local source, use that
  if ( local !== "" && fs.existsSync(local)) {
    folders = folders.concat( local );
  }

  // if there's a system source, use that
  if ( fs.existsSync(system2) ) {
    folders = folders.concat( system2 );
  }
  else if ( fs.existsSync(system) ) {
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
            reject();
          }
        }
        catch(e) {
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

  return new Saver(contents);
};

/**
 * search for all screensavers we can find on the filesystem. if cb is specified,
 * call it with data when done. if reload == true, don't use cached data.
 */
var listAll = function(cb, force) {
  var folders = sources();
  var walker = require("folder-walker");
  var stream = walker(folders);

  var promises = [];

  // use cached data if available
  if ( loadedScreensavers.length > 0 && ( typeof(force) === "undefined" || force === false ) ) {
    cb(loadedScreensavers);
    return;
  }
  
  stream.on("data", function(opts) {
    var f = opts.filepath;
    var folder = path.dirname(f);
    var doLoad = f.match(/saver.json$/) &&
                 ! folder.split(path.sep).reverse()[0].match(/^__/) &&
                 ! skipFolder(folder);

   
    if ( doLoad ) {
      promises.push(loadFromFile(f));
    }
  });

  stream.on("end", function() {
    Promise.all(promises).then(function(data) {
      loadedScreensavers = _.sortBy(data, function(s) { return s.name.toLowerCase(); });
      cb(loadedScreensavers);
    });
  });
};

var updatePrefs = function(data, cb) {
  console.log("updatePrefs", data);
  for ( var k in data ) {
    var v = data[k];
    console.log(k, v);
    nconf.set(k, v);
  }

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

var getTemplatePath = function() {
  //  return path.join(defaultSaversDir(), "__template");
  return path.join(__dirname, "..", "system-savers", "__template");
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
var generateScreensaver = function(opts) {
  var src = getTemplatePath();
  var destDir = getLocalSource();

  var contents = fs.readdirSync(src);
  var defaults = {
    "source": "index.html",
    "options": []
  };

  if ( destDir === "" ) {
    throw new Error("No local directory specified!");
  }

  opts = _.merge({}, defaults, opts);
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
  contents = _.merge({}, JSON.parse(content), opts);

  fs.writeFileSync(configDest, JSON.stringify(contents, null, 2));

  // add dest in case someone needs it
  // but don't persist that data because that would be icky
  opts.dest = path.join(dest, "saver.json");
  
  return opts;
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
exports.getOptions = getOptions;
exports.listAll = listAll;
exports.updatePrefs = updatePrefs;
exports.write = write;
exports.firstLoad = firstLoad;
exports.getConfig = getConfig;
exports.getConfigSync = getConfigSync;
exports.generateScreensaver = generateScreensaver;
