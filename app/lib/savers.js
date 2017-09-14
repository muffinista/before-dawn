"use strict";

const fs = require('fs-extra');
const nconf = require('nconf');
const path = require('path');
const _ = require('lodash');
const mkdirp = require('mkdirp');

const Saver = require('./saver.js');

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
var reload = function(cb) {
  var configPath = path.join(baseDir, config_file);
  let saversDir = defaultSaversDir();

  if ( typeof(cb) === "undefined" ) {
    cb = console.log;
  }

  // check for/create our main directory
  mkdirp(baseDir, function(err, made) {
    if ( made === true ) {
      console.log("created " + baseDir);
      _firstLoad = true;
    }

    // check for/create a folder for the actual screensavers
    // @todo multiple folder support?
    mkdirp(saversDir, function(err, made) {
      if ( made === true ) {
        console.log("created " + saversDir);
        _firstLoad = true;
      }

      // specify config path
      console.log("load config from " + configPath);      
      if ( ! fs.existsSync(configPath) ) {
        console.log("no config yet");
        _firstLoad = true;
      }

      nconf.file({
        file: configPath
      });
      setupPackages(cb);

    }); 
  });  
};

/**
 * reload all our data/config/etc
 */
var setupPackages = function(cb) {
  ensureDefaults();

  updatePackage(function(data) {
    if ( data.downloaded === true ) {
      setConfig('source:updated_at', data.updated_at);
    }

    listAll(function(data) {
      var current = nconf.get('saver');
      if (
        ( current === undefined || getCurrentData() === undefined ) && 
        data.length > 0
      ) {
        console.log("setting default saver to first in list " + data[0].key);
        setConfig('saver', data[0].key);
      }

      writeSync();
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
  console.log("DELETE " + p);
  var s = getByKey(k);

  // make sure we're deleting a screensaver that exists and is
  // actually editable
  if ( typeof(s) !== "undefined" && s.editable === true ) {
    deleteFolderRecursive(p);
  }
  reload(cb);
};


/**
 * recursively delete a directory
 * cribbed from http://stackoverflow.com/questions/18052762/remove-directory-which-is-not-empty
 */
var deleteFolderRecursive = function(path) {
  var files = [];
  if( fs.existsSync(path) ) {
    files = fs.readdirSync(path);
    files.forEach(function(file,index){
      var curPath = path + "/" + file;
      if(fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};

var defaultSaversDir = function() {
  return path.join(baseDir, 'savers');
};


var updatePackage = function(cb) {
  var Package = require("./package.js");

  var source = getSource();
  console.log("source repo: " + source);

  var lastCheckAt = getUpdateCheckTimestamp();
  var now = new Date().getTime();

  var diff = now - lastCheckAt;

  // don't bother checking if there's no source repo specified,
  // or if we've pinged it in the last 15 minutes
  if ( typeof(source.repo) == "undefined" || source.repo === "" || diff < 15 * 60 * 1000 ) {
    cb({downloaded: false});
  }
  else {
    setUpdateCheckTimestamp(now);
    
    var p = new Package({repo:source.repo, updated_at:source.updated_at, dest:defaultSaversDir()});
    p.checkLatestRelease(cb);
  }
};


/**
 * setup some reasonable defaults
 */
var ensureDefaults = function() {
  var source = nconf.get('source');
  if ( source === undefined ) {
    _firstLoad = true;
    console.log("add default source");
    setConfig('source',{
      repo: global.SAVER_REPO,
      hash: ''
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
  return nconf.get('saver');
};

/**
 * return the object/data of the current screensaver
 */
var getCurrentData = function() {
  var key = nconf.get('saver');
  return getByKey(key);
};


/**
 * return the URL of a zip file that is the source we will check to update our screensavers
 */
var getSource = function() {
  return nconf.get('source');
};

var setSource = function(x) {
  if ( x !== getSource()["repo"] ) {
    return nconf.set('source', {
      repo: x
    });
  }
  else { 
    return nconf.get('source');
  }
};

var setUpdateCheckTimestamp = function(x) {
  return nconf.set('sourceCheckTimestamp', x);
}
var getUpdateCheckTimestamp = function(x) {
  return nconf.get('sourceCheckTimestamp') || 0;
}

var getLocalSource = function() {
  return nconf.get('localSource') || "";
};
var setLocalSource = function(x) {
  return nconf.set('localSource', x);
};


/**
 * set config var k to value v
 */
var setConfig = function(k, v) {
  nconf.set(k, v);
  console.log("set "+ k + " to " + v);
};

/**
 * set current screensaver key
 */
var setCurrent = function(x, opts) {
  setConfig('saver', x);

  if ( typeof(opts) !== "undefined" ) {
    setOptions(opts, x);
  }
};

var setDelay = function(x) {
  setConfig('delay', x);
};

var getDelay = function() {
  var val = nconf.get('delay');
  if ( typeof(val) === "undefined" ) {
    val = 15;
  }
  return val;
};


var setSleep = function(x) {
  setConfig('sleep', x);
};

var getSleep = function() {
  var val = nconf.get('sleep');
  if ( typeof(val) === "undefined" ) {
    val = 15;
  }
  return val;
};

var setLock = function(x) {
  setConfig('lock', x);
};

var getLock = function() {
  return nconf.get('lock') || false;
};

var setDisableOnBattery = function(x) {
  setConfig('disable_on_battery', x);
};

var getDisableOnBattery = function() {
  return nconf.get('disable_on_battery') || false;
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


var parseAndLoadSaver = function(opts) {

  var f = opts.filepath;
  var folder = path.dirname(f);

  // make sure this is a saver.json file,
  // not in a template directory
  // and not in a folder we want to skip
  var doSkip = ! f.match(/saver.json$/) ||
               folder.split(path.sep).reverse()[0].match(/^__/) ||
               skipFolder(folder);

  if ( doSkip ) {
    return;
  }
  
  fs.readFile(opts.filepath, {encoding: 'utf8'}, function (err, content) {
    try {
      var contents = JSON.parse(content);           
      var stub = path.dirname(f);
      contents.path = stub;
      contents.key = stub + "/" + contents.source;
          
      // allow for a specified URL -- this way you could create a screensaver
      // that pointed to a remote URL
      if ( typeof(contents.url) === "undefined" ) {
        contents.url = 'file://' + contents.key;
      }
          
      contents.settings = getOptions(contents.key);
      contents.editable = (opts.root === getLocalSource());

      var s = new Saver(contents);
      if ( s.valid ) {
        loadedScreensavers.push(s);
      }
    }
    catch(e) {
      console.log(e);
      
      console.log("file " + f);
      console.log(content);
    }          
  });
  
};

/**
 * search for all screensavers we can find on the filesystem. if cb is specified,
 * call it with data when done. if reload == true, don't use cached data.
 */
var listAll = function(cb) {
  var root = path.join(baseDir, 'savers');
  var folders = [];
  var walker = require('folder-walker');
  
  var source = getSource();
  var local = getLocalSource();
  
  if ( typeof(source.repo) !== "undefined" && source.repo !== "" ) {
    folders.push(root);
  }

  if ( local !== "" ) {
    folders = folders.concat( local );
  }

  loadedScreensavers = [];
  var stream = walker(folders);

  stream.on('data', parseAndLoadSaver);
  stream.on('end', function() {
    loadedScreensavers = _.sortBy(loadedScreensavers, function(s) { return s.name.toLowerCase(); });
    
    if ( typeof(cb) !== "undefined" ) {
      cb(loadedScreensavers);
    }
  });
};

/**
 * get a URL we can use to render current screensaver. if opts is passed in, use them
 * when generating URL. otherwise use our global URL options
 */
var getCurrentUrl = function(opts) {
  var s = getCurrentData();
  return s.getUrl(opts);   
};


/**
 * return URL of the screensaver matching key
 */
var getUrl = function(key) {   
  var url = 'file://' + baseDir + '/savers/';
  if ( typeof(key) === "undefined" ) {
    key = getCurrent();
  }
  url = url + key;

  return url;
};


var write = function(cb) {
  var configPath = baseDir + "/" + config_file;
  console.log("write config to " + configPath);
  nconf.save(cb);
};

var writeSync = function() {
  var configPath = baseDir + "/" + config_file;
  console.log("sync write config to " + configPath);
  nconf.save();
}


var getTemplatePath = function() {
  return path.join(defaultSaversDir(), "__template");
};

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

  // throw error if no dest dir

  opts = _.merge({}, defaults, opts);
  opts.key = opts.name.toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/-$/, "").replace(/^-/, "");

  console.log(opts);
  
  var dest = path.join(destDir, opts.key);
  fs.mkdirpSync(dest);
  console.log("copy from", getTemplatePath());

  contents.forEach(function(content) {
    console.log(path.join(src, content), path.join(dest, content));
    fs.copySync(path.join(src, content), path.join(dest, content));
  });

  // generate JSON file

  var configDest = path.join(dest, "saver.json");
  var content = fs.readFileSync( configDest );
  var contents = _.merge({}, JSON.parse(content), opts);

  fs.writeFileSync(configDest, JSON.stringify(contents, null, 2));

  // add dest in case someone needs it
  // but don't persist that data because that would be icky
  opts.dest = path.join(dest, "index.html");
  
  return opts;
};

exports.init = init;
exports.reload = reload;
exports.delete = deleteSaver;

exports.getByKey = getByKey;
exports.getCurrent = getCurrent;
exports.getSource = getSource;
exports.setSource = setSource;
exports.getLocalSource = getLocalSource;
exports.setLocalSource = setLocalSource;
exports.getCurrentData = getCurrentData;
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
exports.getCurrentUrl = getCurrentUrl;
exports.getUrl = getUrl;
exports.loadedScreensavers = loadedScreensavers;
exports.write = write;
exports.firstLoad = firstLoad;
exports.generateScreensaver = generateScreensaver;
