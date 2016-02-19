"use strict";

var request = require('request');

exports.checkLatestRelease = function(repo, version, yes_cb, no_cb) {
    var url = "https://api.github.com/repos/" + repo + "/releases/latest";
    console.log(url);
    request({
        url: url,
        json: true,
        headers: {
            'User-Agent': "Before Dawn"
        }
    }, function(error, response, body) {
        var tag = body.tag_name;
        if ( tag !== version ) {
            console.log("tags dont match");
            yes_cb(body);
        }
        else if ( typeof(no_cb) !== "undefined" ) {
            console.log("tags match");
            no_cb(body);
        } 
    });
};
