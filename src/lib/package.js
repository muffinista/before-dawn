"use strict";

var fs = require("fs");
var path = require("path");
var request = require("request-promise-native");
var yauzl = require("yauzl");
var mkdirp = require("mkdirp");
const util = require("util");
const rimraf = require("rimraf");

/**
 * need source repo url
 * call https://developer.github.com/v3/repos/releases/#get-the-latest-release
 * check published_at
 * if it's after stored value, download it!
 */

module.exports = function Package(_attrs) {
  var self = this;

  this.repo = _attrs.repo;
  this.dest = _attrs.dest;
  this.updated_at = _attrs.updated_at;
  this.downloaded = false;
  this.url = "https://api.github.com/repos/" + self.repo + "/releases/latest";

  if ( typeof(this.updated_at) === "undefined" ) {
    this.updated_at = new Date(0);
  }

  if ( typeof(_attrs.log) === "undefined" ) {
    _attrs.log = console.log;
  }

  this.log = _attrs.log;
  
  this.defaultHeaders = {
    "User-Agent": "Before Dawn"
  };
  
  this.attrs = function() {
    return {
      dest: this.dest,
      updated_at: this.updated_at,
      downloaded: this.downloaded
    };
  };

  this.getReleaseInfo = async function() {
    let self = this;
    this.data = await request.get({
      url: this.url,
      json: true,
      headers: this.defaultHeaders
    }).catch(function(err) {

      self.log(err);

      if ( typeof(self.data) !== "undefined" ) {
        return self.data;
      }
      else {
        return {};
      }
    });

    return this.data;
  };

  this.setReleaseInfo = function(d) {
    this.data = d;
  };
  
  this.checkLatestRelease = async function(cb) {
    let data = await this.getReleaseInfo();
    if ( data && data.published_at && new Date(data.published_at) > new Date(self.updated_at) ) {
      this.downloadFile(data.zipball_url, function() {
        self.updated_at = data.published_at;
        cb(self.attrs());
      });
    }
    else {
      cb(self.attrs());
    }
  };
  
  this.checkLocalRelease = async function(dataSrc, zipSrc, cb) {
    let rf = util.promisify(fs.readFile);
    let data = await rf(dataSrc);
    data = JSON.parse(data);

    if ( new Date(data.published_at) > (self.updated_at) ) {
      self.updated_at = data.published_at;
      this.zipToSavers(zipSrc, cb);
    }
    else {
      //console.log("we're good!");
      cb(self.attrs());
    }
  };

  this.downloadFile = function(url, cb) {
    var temp = require("temp");
    var os = require("os");
    var tempName = temp.path({dir: os.tmpdir(), suffix: ".zip"});
    
    var _resp;
    var opts = {
      url:url,
      headers:this.defaultHeaders
    };

    request(opts).on("error", function(err) {
      console.log(err);
      cb(err);
    }).on("response", function(r) {
      _resp = r;
    }).on("end", function() {
      self.downloaded = true;
      self.zipToSavers(tempName, cb);
      
    }).pipe(fs.createWriteStream(tempName));
  };


  this.zipToSavers = function(tempName, cb) {
    //
    // clean out existing files
    //
    try {
      //console.log("remove stuff from " + self.dest);
      rimraf.sync(self.dest);
    }
    catch (err) {
      console.error(err);
    }

    yauzl.open(tempName, {lazyEntries: true}, function(err, zipfile) {
      if (err) {
        throw err;
      }

      zipfile.readEntry();
      zipfile.on("entry", function(entry) {
        var fullPath = entry.fileName;
        
        // the incoming zip filename will have on extra directory on it
        // projectName/dir/etc/file
        //
        // example: muffinista-before-dawn-screensavers-d388377/starfield/index.html
        //
        // let's get rid of the projectName
        //
        var parts = fullPath.split(/\//);
        parts.shift();

        fullPath = path.join(self.dest, path.join(...parts));
        //console.log(self.dest + " -> " + fullPath);
        
        if (/\/$/.test(entry.fileName)) {
          // directory file names end with '/' 
          mkdirp(fullPath, function(err) {
            //if (err) {throw err;}
            zipfile.readEntry();
          });
        }
        else {
          // file entry 
          zipfile.openReadStream(entry, function(err, readStream) {
            if (err) {throw err;}
            // ensure parent directory exists 
            mkdirp(path.dirname(fullPath), function(err) {
              //if (err) {throw err;}
              readStream.pipe(fs.createWriteStream(fullPath));
              readStream.on("end", function() {
                zipfile.readEntry();
              });
            });
          });
        }
      });

      zipfile.on("end", function() {       
        cb(self.attrs());
      });

    });
  }
};
