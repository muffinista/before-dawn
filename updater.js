"use strict";

var fs = require('fs');
var path = require('path');
var request = require('request');
var extract = require('extract-zip');
var _ = require('lodash');

var baseDir;

function Package(_attrs) {
    this.url = _attrs.url;
    this.key = _attrs.key;
    this.description = _attrs.description;
    this.updated_at = _attrs.updated_at;
    this.etag = _attrs.etag;
    this.dir = baseDir;

    var self = this;

    this.save = function() {
        var _attrs = {
            key: self.key,
            description: self.description,
            updated_at: self.updated_at,
            etag: self.etag,
            url: self.url
        };

        var dest = self.dir + self.key + ".json";
        fs.writeFileSync(dest, JSON.stringify(_attrs));
    };

    this.downloadFile = function(cb) {
        var temp = require("temp");
        var tempName = temp.path({suffix: '.zip'});

        console.log("download to " + tempName);

        var _resp;

        request
            .get(self.url)
            .on('error', function(err) {
                console.log(err);
            }).
            on('response', function(r) {
                _resp = r;
            }).
            on('end', function() {
                console.log("download over, let's trigger callback");
                extract(tempName, {dir: self.dir + self.key}, function(err) {
                    self.updated_at = _resp.headers['last-modified'];
                    self.etag = _resp.headers.etag;
                    console.log("new etag: " + self.etag);

                    self.save();

                    if ( typeof(cb) !== "undefined" ) {
                        console.log("unzip over, let's trigger callback");
                        console.dir(_resp.headers);
                        cb(_resp.headers);
                    }
                    
                });
            }).
            pipe(fs.createWriteStream(tempName)); 
    };
    
    this.downloadIfStale = function(did_download, did_not_download) {
        if ( typeof(this.etag) === "undefined" ) {
            self.downloadFile(did_download);
        }
        else {
            request({
                method: 'HEAD',
                uri:this.url,
                headers: {
                    'If-Modified-Since': this.updated_at
                }
            }).on('response', function(response) {
                console.log(response.statusCode);
                if ( response.statusCode !== 304 ) {
                    console.log("too old, download again " + response.statusCode);
                    self.downloadFile(did_download);
                }
                else if ( typeof(did_not_download) !== "undefined" ) {
                    did_not_download();
                }
            });
        }
    };
}


function listAll() {
    var fs = require('fs'), path = require('path');
    var results = {};

    if ( ! fs.existsSync(baseDir) ) {
        console.log("creating " + baseDir);
        fs.mkdirSync(baseDir);
    }

    console.log("check for savers in " + baseDir);

    fs.readdirSync(baseDir).forEach(function(name) {
        var filePath = path.join(baseDir, name);
        console.log(filePath);
        var stat = fs.statSync(filePath);
        if (stat.isFile()) {
            var content = fs.readFileSync( filePath );
            var contents = JSON.parse(content);
            contents.filename = name;

            var p = new Package(contents);
            results[p.key] = p;
        }
    });

    console.log("done!");

    return results;

}

function updateAll(didUpdate, noUpdate) {
    
    if ( typeof(didUpdate) === "undefined" ) {
        didUpdate = function(x) {
            console.log("updates!", x);
        };
    }
    
    if ( typeof(noUpdate) === "undefined" ) {
        noUpdate = function(x) {
            console.log("no updates!", x);
        };
    }

    _.forOwn(listAll(), function(p) {
        console.log(p);
        p.downloadIfStale(didUpdate, noUpdate);
    });
}

function addFromUrl(url, key) {
    var p = new Package({
        key: key,
        url: url
    });
    p.save();

    return p;
}


function init(path) {
    baseDir = path + "/savers/";
    console.log("set baseDir to " + baseDir);
}

exports.listAll = listAll;
exports.updateAll = updateAll;
exports.addFromUrl = addFromUrl;
exports.init = init;