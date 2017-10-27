"use strict";

var fs = require("fs");
var path = require("path");
var request = require("request");
var yauzl = require("yauzl");
var mkdirp = require("mkdirp");
var remove = require("remove");

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

  this.attrs = function() {
    return {
      dest: this.dest,
      etag: this.etag,
      updated_at: this.updated_at,
      downloaded: this.downloaded
    };
  };

  this.checkLatestRelease = function(cb) {
    console.log(this.url);
    request({
      url: this.url,
      json: true,
      headers: {
        "User-Agent": "Before Dawn"
      }
    }, function(error, response, body) {
      if ( error ) {
        console.log("release check failed", error);
      }
      else if ( body.published_at !== self.updated_at ) {
        console.log("let's download!");
        console.log(body.zipball_url);
        self.downloadFile(body.zipball_url, function() {
          self.updated_at = body.published_at;
          cb(self.attrs());
        });
      }
      else {
        console.log("we're good!");
        cb(self.attrs());
      }
    });
  };

  this.downloadFile = function(url, cb) {
    var temp = require("temp");
    var tempName = temp.path({suffix: ".zip"});

    console.log("download to " + tempName);

    var _resp;

    request({
      url:url,
      headers: {
        "User-Agent": "Before Dawn"
      }
    })
            .on("error", function(err) {
              console.log(err);
              cb(err);
            }).
             on("response", function(r) {
               _resp = r;
             }).
             on("end", function() {
               console.log("download over, let's trigger callback");

               try {
                 console.log("remove stuff from " + self.dest);
                 remove.removeSync(self.dest);
               } catch (err) {
                 console.error(err);
               }

               yauzl.open(tempName, {lazyEntries: true}, function(err, zipfile) {
                 if (err) {throw err;}
                 zipfile.readEntry();
                 zipfile.on("end", function() {
                   self.etag = _resp.headers.etag;
                   self.downloaded = true;
                   
                   cb(self.attrs());
                 });

                 zipfile.on("entry", function(entry) {
                   var fullPath = entry.fileName;

                   // the incoming zip filename will have on extra directory on it
                   // projectName/dir/etc/file
                   //
                   // let's get rid of the projectName
                   //
                   var parts = fullPath.split(/\//);
                   parts.shift();
                   fullPath = parts.join("/");

                   fullPath = self.dest + "/" + fullPath;

                   if (/\/$/.test(entry.fileName)) {
                     // directory file names end with '/' 
                     mkdirp(fullPath, function(err) {
                       if (err) {throw err;}
                       zipfile.readEntry();
                     });
                   }
                   else {
                     // file entry 
                     zipfile.openReadStream(entry, function(err, readStream) {
                       if (err) {throw err;}
                       // ensure parent directory exists 
                       mkdirp(path.dirname(fullPath), function(err) {
                         if (err) {throw err;}
                         readStream.pipe(fs.createWriteStream(fullPath));
                         readStream.on("end", function() {
                           zipfile.readEntry();
                         });
                       });
                     });
                   }
                 });
               });
             }).
             pipe(fs.createWriteStream(tempName));        
  };
  
  this.downloadIfStale = function(cb) {
    console.log("ETAG:" + self.etag);
    request({
      method: "HEAD",
      uri: self.url,
      headers: {
        "if-none-match": "\"" + self.etag + "\""
      }
    }).on("response", function(response) {
      console.log(response.statusCode);
      if ( response.statusCode !== 304 ) {
        console.log("too old, download again " + response.statusCode);
        self.downloadFile(cb);
      }
      else {
        console.log("not modified, we're done here");
        cb(self.attrs());
      }
    });
  };

};


