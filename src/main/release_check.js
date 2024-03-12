"use strict";
export default class ReleaseCheck {
  constructor() {
    this.onUpdateCallback = () => {};
    this.onNoUpdateCallback = () => {};
    this.logger = () => {};
  }

  setFeed(u) {
    this.url = u;
  }
  setLogger(l) {
    this.logger = l;
  }

  onUpdate(f) {
    this.onUpdateCallback = f;
  }
  onNoUpdate(f) {
    this.onNoUpdateCallback = f;
  }

  checkLatestRelease() {
    this.logger(`check ${this.url} for new release`);
    let _self = this;
    fetch(this.url, {
      timeout: 5000,
      headers: {
        "User-Agent": "Before Dawn"
      }
    }).then(function(response) {
      if ( response.ok ) {
        return response.json();
      }
      return undefined;
    }).then(function(body) {
      _self.logger(body);
      
      if ( body !== undefined ) {
        _self.onUpdateCallback(body);
      }
      else {
        _self.onNoUpdateCallback();
      }
    }).catch(() => {
      this.onNoUpdateCallback();
    });
  }
}