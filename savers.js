"use strict";

var fs = require('fs');
var nconf = require('nconf');
var path = require('path');
var _ = require('lodash');

var Saver = require('./saver.js');

var config_file = "config.json";

var baseDir;
var loadedData = [];
var url_opts = {};


var init = function(_path, cb) {
    baseDir = path.resolve(_path);
    console.log("working from " + baseDir);
    reload(cb);
};

var updatePackage = function(cb) {
    var Package = require("./package.js");

    var source = getSource();
    console.log("source", source);

    
    //var p = new Package({repo:source.repo, etag:source.hash, dest:defaultSaversDir()});
    //p.checkLatestRelease(cb);
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
        console.log(saversDir + " already exists");
    }

    // specify config path
    console.log("load config from " + configPath);
    nconf.file({
        file: configPath
    });

    ensureDefaults();

    console.log("update package");

    updatePackage(function(data) {
        console.log("UPDATED!", data);

        if ( data.downloaded == true ) {
            setConfig('source',{
                hash: data.etag,
                updated_at: data.updated_at
            });           
        }
        
        var current = nconf.get('saver');
        console.log("CURRENT: " + current);
        if ( current === undefined || getCurrentData() === undefined ) {
            console.log("creating config defaults");
            listAll(function(data) {
                console.log("listall");
                console.log(data);
                if ( data.length > 0 ) {
                    console.log("setting default saver to first in list " + data[0].key);
                    setConfig('saver', data[0].key);
                }

                write(cb);
            }, true);
        }
        else {
            write(function() {
                listAll(cb);
            });
        }
    });

};

var defaultSaversDir = function() {
    return baseDir + "/savers";
};

/**
 * setup some reasonable defaults
 */
var ensureDefaults = function() {
    var source = nconf.get('source');
    if ( source === undefined ) {
        console.log("add default source");
        setConfig('source',{
            repo:'muffinista/before-dawn-screensavers',
            hash: ''
        });
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

    console.log("local screensavers are at: " + src);

    if ( src !== undefined && src !== defaultSaversDir() ) {
        var wrench = require("wrench");
        console.log(src + " -> " + defaultSaversDir());
        wrench.copyDirSyncRecursive(src, defaultSaversDir(), {
            forceDelete: true
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
 * return the URL of a zip file that is the source we will check to update our screensavers
 */
var getSource = function() {
    return nconf.get('source');
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

var setLock = function(x) {
    setConfig('lock', x);
};

var getDelay = function() {
    return nconf.get('delay') || 15;
};

var getLock = function() {
    return nconf.get('lock') || false;
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
    console.log("SET OPTIONS", key, opts);
    setConfig(key, opts);
};

var getOptions = function(name) {
    if ( typeof(name) === "undefined" ) {
        name = getCurrent();
    }
    var key = "options:" + name;
    console.log("GET OPTIONS " + key);
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

    console.log("let's walk " + root);
    walk(root, function(f, stat) {
        console.log(f);
        if ( f.match(/saver.json$/) ) {
            var content = fs.readFileSync( f );
            var contents = JSON.parse(content);

            var stub = path.dirname(path.relative(root, f));
            //console.log("STUB: " + stub);
            contents.key = stub + "/" + contents.source;

            console.log("KEY: " + contents.key);

            // allow for a specified URL -- this way you could create a screensaver
            // that pointed to a remote URL
            if ( typeof(contents.url) === "undefined" ) {
                contents.url = 'file://' + baseDir + '/savers/' + contents.key;
            }

            contents.settings = getOptions(contents.key);
            console.log("OPTIONS", contents.settings);

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

exports.init = init;
exports.reload = reload;
exports.getByKey = getByKey;
exports.getCurrent = getCurrent;
exports.getSource = getSource;
exports.getCurrentData = getCurrentData;
exports.setCurrent = setCurrent;
exports.setOptions = setOptions;
exports.setDelay = setDelay;
exports.setLock = setLock;
exports.getDelay = getDelay;
exports.getLock = getLock;
exports.getOptions = getOptions;
exports.listAll = listAll;
exports.getCurrentUrl = getCurrentUrl;
exports.getUrl = getUrl;
exports.loadedData = loadedData;
exports.write = write;
