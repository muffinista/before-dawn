"use strict";

var fs = require('fs');
var path = require('path');
var request = require('request');
var extract = require('extract-zip');

module.exports = function Package(_attrs) {
    this.url = _attrs.url;
    this.etag = _attrs.etag;
    this.updated_at = _attrs.updated_at;
    this.dest = _attrs.dest;
    this.downloaded = false;

    var self = this;

    this.attrs = function() {
        return {
            dest: this.dest,
            url: this.url,
            etag: this.etag,
            updated_at: this.updated_at,
            downloaded: this.downloaded
        };
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
                cb(err);
            }).
            on('response', function(r) {
                _resp = r;
            }).
            on('end', function() {
                console.log("download over, let's trigger callback");
                extract(tempName, {dir: self.dest}, function(err) {
                    self.updated_at = _resp.headers['last-modified'];
                    self.etag = _resp.headers.etag;
                    console.log("new etag: " + self.etag);
                    self.downloaded = true;
                    
                    cb(self.attrs());
                });
            }).
            pipe(fs.createWriteStream(tempName));        
    };
    
    this.downloadIfStale = function(cb) {
        request({
            method: 'HEAD',
            uri: self.url,
            headers: {
                'If-Modified-Since': self.updated_at
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


