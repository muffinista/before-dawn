"use strict";

var fs = require('fs');
var path = require('path');
var request = require('request');
//var extract = require('extract-zip');
var yauzl = require("yauzl");
var mkdirp = require("mkdirp");

/**
 * need source repo url
 * call https://developer.github.com/v3/repos/releases/#get-the-latest-release
 * check published_at
 * if it's after stored value, download it!
 */

module.exports = function Package(_attrs) {
    this.repo = _attrs.repo;
    this.dest = _attrs.dest;
    this.updated_at = _attrs.updated_at;
    this.downloaded = false;

    var self = this;

    this.attrs = function() {
        return {
            dest: this.dest,
            etag: this.etag,
            updated_at: this.updated_at,
            downloaded: this.downloaded
        };
    };

    this.checkLatestRelease = function(cb) {
        var url = "https://api.github.com/repos/" + self.repo + "/releases/latest";
        console.log(url);
        request({
            url: url,
            json: true,
            headers: {
                'User-Agent': "Before Dawn"
            }
        }, function(error, response, body) {
            if ( body.published_at !== self.updated_at ) {
                console.log(body.published_at);
                console.log(body);
                console.log("let's download!");
                console.log(body.zipball_url);
                self.downloadFile(body.zipball_url, function() {
                    self.updated_at = body.published_at;
                    cb(self.attrs());
                });
            }
            else {
                console.log("we're good!");
            }
        });
    };

    this.downloadFile = function(url, cb) {
        var temp = require("temp");
        var tempName = temp.path({suffix: '.zip'});

        console.log("download to " + tempName);

        var _resp;

        request({
            url:url,
            headers: {
                'User-Agent': "Before Dawn"
            }
        })
            .on('error', function(err) {
                console.log(err);
                cb(err);
            }).
            on('response', function(r) {
                _resp = r;
            }).
            on('end', function() {
                console.log("download over, let's trigger callback");

                yauzl.open(tempName, {lazyEntries: true}, function(err, zipfile) {
                    if (err) throw err;
                    console.log("hey", zipfile);
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
                        console.log(fullPath);

                        if (/\/$/.test(entry.fileName)) {
                            console.log("mkdir");
                            // directory file names end with '/' 
                            mkdirp(fullPath, function(err) {
                                if (err) throw err;
                                zipfile.readEntry();
                            });
                        }
                        else {
                            // file entry 
                            zipfile.openReadStream(entry, function(err, readStream) {
                                if (err) throw err;
                                console.log("ensure parent " + path.dirname(fullPath));
                                // ensure parent directory exists 
                                mkdirp(path.dirname(fullPath), function(err) {
                                    if (err) throw err;
                                    console.log("pipe");
                                    readStream.pipe(fs.createWriteStream(fullPath));
                                    readStream.on("end", function() {
                                        console.log("end");
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
            method: 'HEAD',
            uri: self.url,
            headers: {
                'if-none-match': '"' + self.etag + '"'
            }
        }).on('response', function(response) {
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


