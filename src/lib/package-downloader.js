"use strict";

const Package = require("./package.js");

// wait for awhile before checking for a new package
const PACKAGE_WAIT_TIME = 60 * 60 * 1000;


module.exports = class PackageDownloader {
  constructor(prefs, logger) {
    this.prefs = prefs;
    if ( logger !== undefined ) {
      this.logger = logger;
    }
    else {
      this.logger = function() {};
    }
  }

  setLocalFile(f) {
    this.localZip = f;
  }

  getPackage() {
    var source = this.prefs.sourceRepo;
    var sourceUpdatedAt = this.prefs.sourceUpdatedAt;
    var attrs = {
      repo:source,
      updated_at:sourceUpdatedAt,
      dest:this.prefs.defaultSaversDir
    };

    if ( this.localZip ) {
      attrs.local_zip = this.localZip;
    }

    this.logger("getPackage", attrs);

    return new Package(attrs);
  }

  updatePackage(p) {
    var lastCheckAt = this.prefs.updateCheckTimestamp;
    var now = new Date().getTime();
    var diff = now - lastCheckAt;

    this.logger("updatePackage", now, lastCheckAt);

    if ( p === undefined ) {
      p = this.getPackage();
    }

    this.logger("updatePackage", p);

    if ( p.repo === undefined || p.repo === "" ) {
      return Promise.resolve({downloaded: false});
    }

    this.logger("lastCheckAt: " + lastCheckAt + " - " + diff + " - " + PACKAGE_WAIT_TIME);
    // don't bother checking if there's no source repo specified,
    // or if we've pinged it recently
    if ( typeof(p.repo) === "undefined" || p.repo === "" || diff < PACKAGE_WAIT_TIME ) {
      this.logger("skip package check for now: " + diff);
      return Promise.resolve({downloaded: false});
    }
    else {
      this.prefs.updateCheckTimestamp = now;
      this.prefs.writeSync();

      this.logger("check package: " + p.repo);
      return p.checkLatestRelease().then((result) => {
        this.prefs.sourceUpdatedAt = result.updated_at;
        this.prefs.writeSync();
        return result;
      });
    }
  }
};