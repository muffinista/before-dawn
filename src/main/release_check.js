"use strict";

var request = require("request");
var url, onUpdateCallback, onNoUpdateCallback, logger;

onUpdateCallback = console.log;
onNoUpdateCallback = console.log;
logger = console.log;

exports.setFeed = function(u) {
  url = u;
};
exports.setLogger = function(l) {
  logger = l;
};

exports.onUpdate = function(f) {
  onUpdateCallback = f;
};
exports.onNoUpdate = function(f) {
  onNoUpdateCallback = f;
};

exports.checkLatestRelease = function() {
  logger(`check ${url} for new release`);
  try {
    request({
      url: url,
      json: true,
      timeout: 5000,
      headers: {
        "User-Agent": "Before Dawn"
      }
    }, function(error, response, body) {
      logger(body);
      
      if ( response !== undefined && response.statusCode === 200 ) {
        onUpdateCallback(body);
      }
      else {
        onNoUpdateCallback();
      }
    });
  }
  catch(ex) {
    console.log("error in checkLatestRelease");
    console.log(ex);
    onNoUpdateCallback();
  }
};
