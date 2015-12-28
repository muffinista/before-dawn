"use strict";

var fs = require('fs');
var nconf = require('nconf');
var path = require('path');
var _ = require('lodash');

var config_file = "config.json";

var baseDir;
var loadedData = [];
var url_opts = {};


var init = function(_path, cb) {
    baseDir = path.resolve(_path);
    console.log("working from " + baseDir);
    reload(cb);
};

var reload = function(cb) {
    var configPath = baseDir + "/" + config_file;

    console.log("baseDir: " + path);
    // create our main directory
    if ( ! fs.existsSync(baseDir) ) {
        console.log("creating " + baseDir);
        fs.mkdirSync(baseDir);
    }

    // create a folder for the actual screensavers
    // @todo multiple folder support?
    let saversDir = defaultSaversDir();

    if ( ! fs.existsSync(saversDir) ) {
        console.log("create: " + saversDir);
        fs.mkdirSync(saversDir);
    }
    else {
        console.log(saversDir + "already exists");
    }

    // specify config path
    console.log("load config from " + configPath);
    nconf.file({
        file: configPath
    });

    ensureDefaults();
    listAll(cb);
};

var defaultSaversDir = function() {
    return baseDir + "/savers";
};

/**
 * setup some reasonable defaults
 */
var ensureDefaults = function() {
    var sources = nconf.get('sources');
    if ( sources === undefined ) {
        console.log("add default source");
        setConfig('sources', [
            {
                key: 'defaults',
                url: 'http://yzzyx.xyz/screensavers.zip',
                hash: ''
            }
        ]);
    }


    //
    // copy our default set of screensavers into the app directory
    //
    // @todo maybe only do this once or even not at all
    var src = undefined;
    if ( fs.existsSync(__dirname + "/savers") ) {
        src = __dirname + "/savers";
    }
    else if ( fs.existsSync(__dirname + "/../savers") ) {
        src = __dirname + "/../savers";
    }

    console.log(src);

    if ( src !== undefined && src !== defaultSaversDir() ) {
        var wrench = require("wrench");
        console.log(src + " -> " + defaultSaversDir());
        wrench.copyDirSyncRecursive(src, defaultSaversDir(), {
            forceDelete: true
        });
    }

    var current = nconf.get('saver');
    if ( current === undefined ) {
        console.log("creating config defaults");
        listAll(function(data) {
            if ( data.length > 0 ) {
                console.log("setting default saver to first in list " + data[0].key);
                setConfig('saver', data[0].key);
            }
        });
    }
};


//
// http://stackoverflow.com/questions/13786160/copy-folder-recursively-in-node-js
//
function copyFileSync( source, target ) {

    var targetFile = target;

    //if target is a directory a new file with the same name will be created
    if ( fs.existsSync( target ) ) {
        if ( fs.lstatSync( target ).isDirectory() ) {
            targetFile = path.join( target, path.basename( source ) );
        }
    }

    fs.createReadStream( source ).pipe( fs.createWriteStream( targetFile ) );
}

function copyFolderRecursiveSync( source, target ) {
    var files = [];

    //check if folder needs to be created or integrated
    var targetFolder = path.join( target, path.basename( source ) );
    if ( !fs.existsSync( targetFolder ) ) {
        fs.mkdirSync( targetFolder );
    }

    //copy
    if ( fs.lstatSync( source ).isDirectory() ) {
        files = fs.readdirSync( source );
        files.forEach( function ( file ) {
            var curSource = path.join( source, file );
            if ( fs.lstatSync( curSource ).isDirectory() ) {
                copyFolderRecursiveSync( curSource, targetFolder );
            } else {
                copyFileSync( curSource, targetFolder );
            }
        } );
    }
}


/**
 * simple class for a screen saver
 */
function Saver(_attrs) {
    this.attrs = _attrs;
    this.name = _attrs.name;
    this.key = _attrs.key;
    this.description = _attrs.description;
    this.aboutUrl = _attrs.aboutUrl;
    this.author = _attrs.author;
    this.license = _attrs.license;
    this.options = _attrs.options;

    // allow for a specified URL -- this way you could create a screensaver
    // that pointed to a remote URL
    if ( typeof(this.attrs.url) !== "undefined" ) {
        this.url = this.attrs.url;
    }
    else {
        this.url = 'file://' + baseDir + '/savers/' + this.attrs.key;
    }

    // allow for custom preview URL -- if not specified, just use the default
    if ( typeof(this.attrs.previewUrl) === "undefined" ) {
        this.previewUrl = this.url;
        if ( typeof(url_params) !== "undefined" ) {
            var opts = serialize(url_params);
            this.previewUrl = this.previewUrl + "?" + opts;
        }
    }
    else {
        this.previewUrl = this.attrs.previewUrl;
    }


    this.getPreviewUrl = function(opts) {
        if ( typeof(opts) === "undefined" ) {
            return this.previewUrl;
        }

        opts = serialize(opts);
        return this.previewUrl + "?" + opts;
    };
}


/**
 * specify a hash of options which will be tacked onto any screensaver URLs -- we will
 * pass some handy global info this way, such as screen resolution/etc
 */
var setOpts = function(o) {
    url_opts = o;
};

/**
 * look up a screensaver by key, and return it
 */
var getByKey = function(key) {
    var result = _.find(loadedData, function(obj) {
        return obj.key === key;
    });
    console.log("getByKey: " + key);
    console.log(result);
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
 * return a list of sources -- URLs we will check for updated screensaver packages
 */
var getSources = function() {
    return nconf.get('sources');
};


/**
 * set config var k to value v
 */
var setConfig = function(k, v) {
    nconf.set(k, v);
    console.log("set "+ k + " to " + v);
    nconf.save(function (err) {
        fs.readFile(config_file, function (err, data) {
            //console.dir(JSON.parse(data.toString()));
        });
    });   
};

/**
 * set current screensaver key
 */
var setCurrent = function(x) {
    setConfig('saver', x);
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
var listAll = function(cb, reload) {
    var dir = require('node-dir');
    var root = baseDir + '/savers/';

    console.log("load from " + root);

    if ( reload === true ) {
        loadedData = [];
    }

    if ( loadedData.length > 0 ) {
        if ( typeof(cb) !== "undefined" ) {
            cb(loadedData);
        }
        return loadedData;
    }

    walk(root, function(f, stat) {
        if ( f.match(/saver.json$/) ) {
            var content = fs.readFileSync( f );
            var contents = JSON.parse(content);

            var stub = path.dirname(path.relative(root, f));
            //console.log("STUB: " + stub);
            contents.key = stub + "/" + contents.source;

            console.log("KEY: " + contents.key);

            var s = new Saver(contents);
            loadedData.push(s);
        }
    });

    if ( typeof(cb) !== "undefined" ) {
        cb(loadedData);
    }
    return loadedData;

};

/**
 * take a hash and turn it into a URL string
 * @see http://stackoverflow.com/questions/1714786/querystring-encoding-of-a-javascript-object
 */
var serialize = function(obj) {
  var str = [];
  for(var p in obj)
    if (obj.hasOwnProperty(p)) {
      str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
    }
  return str.join("&");
};

/**
 * get a URL we can use to render current screensaver. if opts is passed in, use them
 * when generating URL. otherwise use our global URL options
 */
var getCurrentUrl = function(opts) {
    var url = 'file://' + baseDir + '/savers/' + getCurrent();

    if ( typeof(opts) === "undefined" ) {
        opts = url_opts;
    }

    opts = serialize(opts);
    if ( url.lastIndexOf("?") !== -1 ) {
        url = url + "&" + opts;
    }
    else {
        url = url + "?" + opts;
    }

    return url;
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


exports.init = init;
exports.reload = reload;
exports.setOpts = setOpts;
exports.getByKey = getByKey;
exports.getCurrent = getCurrent;
exports.getSources = getSources;
exports.getCurrentData = getCurrentData;
exports.setCurrent = setCurrent;
exports.listAll = listAll;
exports.getCurrentUrl = getCurrentUrl;
exports.getUrl = getUrl;
exports.loadedData = loadedData;

