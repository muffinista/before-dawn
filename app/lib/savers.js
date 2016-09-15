"use strict";

var fs = require('fs-extra');
var nconf = require('nconf');
var path = require('path');
var _ = require('lodash');

var Saver = require('./saver.js');

var config_file = "config.json";

var baseDir;
var loadedData = [];

var _firstLoad = false;

var init = function(_path, cb) {
  baseDir = path.resolve(_path);
  console.log("working from " + baseDir);
  reload(cb);
};

var reload = function(cb) {
  var configPath = baseDir + "/" + config_file;

  // create our main directory
  if ( ! fs.existsSync(baseDir) ) {
    console.log("creating " + baseDir);
    fs.mkdirSync(baseDir);

    _firstLoad = true;
  }

  // create a folder for the actual screensavers
  // @todo multiple folder support?
  let saversDir = defaultSaversDir();

  if ( ! fs.existsSync(saversDir) ) {
    console.log("create: " + saversDir);
    fs.mkdirSync(saversDir);

    _firstLoad = true;
  }
  else {
    console.log(saversDir + " already exists");
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

  ensureDefaults();

  if ( typeof(cb) === "undefined" ) {
    cb = console.log;
  }

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
        write(cb);
      }
      else {
        cb(data);
      }
    });
  });
};

var defaultSaversDir = function() {
  return baseDir + "/savers";
};


var updatePackage = function(cb) {
  var Package = require("./package.js");

  var source = getSource();
  if ( typeof(source.repo) == "undefined" || source.repo === "" ) {
    cb({downloaded: false});
  }
  else {
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
  var result = _.find(loadedData, function(obj) {
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

var getLocalSources = function() {
  return nconf.get('localSources') || [];
};
var setLocalSources = function(x) {
  return nconf.set('localSources', x);
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
  return nconf.get('delay') || 15;
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
  return nconf.get('disable_on_battery') || true;
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
 * recursively parse through a directory structure
 *  @see http://stackoverflow.com/questions/2727167/getting-all-filenames-in-a-directory-with-node-js
 */
var walk = function(currentDirPath, callback) {
  var fs = require('fs'), path = require('path');
  fs.readdirSync(currentDirPath).forEach(function(name) {
    var filePath = path.join(currentDirPath, name);
    var stat = fs.statSync(filePath);
    if (stat.isFile()) {
      callback(filePath, stat);
    } else if (stat.isDirectory()) {
      walk(filePath, callback);
    }
  });
};

/**
 * search for all screensavers we can find on the filesystem. if cb is specified,
 * call it with data when done. if reload == true, don't use cached data.
 */
var listAll = function(cb) {
  var root = baseDir + '/savers/';
  var folders = [];

  var source = getSource();

  if ( typeof(source.repo) !== "undefined" && source.repo !== "" ) {
    folders.push(root);
  }
  
  folders = folders.concat( getLocalSources() );
  loadedData = [];

  folders.forEach( function ( src ) {
    console.log("loading from: " + src);
    walk(src, function(f, stat) {
      // exclude matches from directories that start with __
      if ( f.match(/saver.json$/) && ! path.dirname(f).split(path.sep).reverse()[0].match(/^__/) ) {
        try {
          var content = fs.readFileSync( f );
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
          
          var s = new Saver(contents);
          if ( s.valid ) {
            loadedData.push(s);
          }
        }
        catch(e) {
          console.log(e);
        }
      }
    });
  });

  if ( typeof(cb) !== "undefined" ) {
    cb(loadedData);
  }

  return loadedData;
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


var getTemplatePath = function() {
  return path.join(defaultSaversDir(), "__template");
};

/**
 * generate a screensaver template
 */
var generateScreensaver = function(opts) {
  var src = getTemplatePath();
  var destDir = getLocalSources()[0];

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
  console.log(contents);
 

  fs.writeFileSync(configDest, JSON.stringify(contents, null, 2));

  return dest;
};

exports.init = init;
exports.reload = reload;
exports.getByKey = getByKey;
exports.getCurrent = getCurrent;
exports.getSource = getSource;
exports.setSource = setSource;
exports.getLocalSources = getLocalSources;
exports.setLocalSources = setLocalSources;
exports.getCurrentData = getCurrentData;
exports.setCurrent = setCurrent;
exports.setOptions = setOptions;
exports.setDelay = setDelay;
exports.getDelay = getDelay;
exports.setLock = setLock;
exports.getLock = getLock;
exports.setDisableOnBattery = setDisableOnBattery;
exports.getDisableOnBattery = getDisableOnBattery;
exports.getOptions = getOptions;
exports.listAll = listAll;
exports.getCurrentUrl = getCurrentUrl;
exports.getUrl = getUrl;
exports.loadedData = loadedData;
exports.write = write;
exports.firstLoad = firstLoad;
exports.generateScreensaver = generateScreensaver;
