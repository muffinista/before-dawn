"use strict";

const request = require("request");
module.exports = class ReleaseCheck {
  constructor() {
    this.onUpdateCallback = () => {};
    this.onNoUpdateCallback = () => {};
    this.logger = () => {};
    
  }
  setFeed(u) {
    this.url = u;
  };
  setLogger(l) {
    this.logger = l;
  };

  onUpdate(f) {
    this.onUpdateCallback = f;
  };
  onNoUpdate(f) {
    this.onNoUpdateCallback = f;
  };

  checkLatestRelease() {
    this.logger(`check ${this.url} for new release`);
    try {
      let _self = this;
      request({
        url: this.url,
        json: true,
        timeout: 5000,
        headers: {
          "User-Agent": "Before Dawn"
        }
      }, function(error, response, body) {
        _self.logger(body);
        
        if ( response !== undefined && response.statusCode === 200 ) {
          _self.onUpdateCallback(body);
        }
        else {
          _self.onNoUpdateCallback();
        }
      });
    }
    catch(ex) {
      console.log("error in checkLatestRelease");
      console.log(ex);
      this.onNoUpdateCallback();
    }
  };
};