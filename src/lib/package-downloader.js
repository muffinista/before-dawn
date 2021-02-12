"use strict";

const fs = require("fs");
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

  getPackage() {
    var attrs = {
      repo: this.prefs.sourceRepo,
      updated_at: new Date(this.prefs.sourceUpdatedAt),
      dest: this.prefs.defaultSaversDir,
      log: this.logger
    };

    this.logger("getPackage", attrs);

    return new Package(attrs);
  }

  updatePackage(p) {
    var lastCheckAt = this.prefs.updateCheckTimestamp;
    var now = new Date();
    var diff = now - lastCheckAt;

    this.logger("updatePackage", now, lastCheckAt);

    if ( p === undefined ) {
      p = this.getPackage();
    }

    this.logger("updatePackage", p);

    if ( p.repo === undefined || p.repo === "" ) {
      return Promise.resolve({downloaded: false});
    }

    this.logger(`lastCheckAt: ${lastCheckAt} ${diff} ${PACKAGE_WAIT_TIME}`);
    const forceDownload = !fs.existsSync(this.prefs.defaultSaversDir);

    // don't bother checking if there's no source repo specified,
   if ( typeof(p.repo) === "undefined" || p.repo === "" ) {
      this.logger(`skip package check for now: ${diff}`);
      return Promise.resolve({downloaded: false});
    }
    else {
      this.prefs.updateCheckTimestamp = now;

      this.logger(`check package: ${p.repo}`);
      return p.checkLatestRelease(forceDownload).then((result) => {
        this.logger(result);
        if ( result && result.updated_at ) {
          this.prefs.sourceUpdatedAt = result.updated_at;
        }
        return result;
      });
    }
  }
};