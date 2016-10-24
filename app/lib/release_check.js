"use strict";

var request = require('request');
var semver = require('semver');

exports.checkLatestRelease = function(repo, version, yes_cb, no_cb) {
  var url = "https://api.github.com/repos/" + repo + "/releases/latest";
  try {
    request({
      url: url,
      json: true,
      headers: {
        'User-Agent': "Before Dawn"
      }
    }, function(error, response, body) {
      var tag;

      if ( typeof(body) === "undefined" ) {
        no_cb();
      }
      
      tag = body.tag_name;
      
      // our first few tags in git aren't semver compatible so fix that
      if ( tag === "v0.3" || tag === "v0.2" || tag === "v0.1" ) {
        tag = tag + ".0";
      }

      if ( typeof(semver) !== "undefined" && semver.gt(semver.clean(tag), semver.clean(version)) ) {
        console.log("tags dont match");
        yes_cb(body);
      }
      else if ( typeof(no_cb) !== "undefined" ) {
        console.log("tags match");
        no_cb(body);
      } 
    });
  }
  catch(ex) {
    console.log("hey!!!!");
    console.log(ex);
    no_cb();
  }
};
