"use strict";

const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const yauzl = require("yauzl");
const mkdirp = require("mkdirp");
const rimraf = require("rimraf");
const lockfile = require("proper-lockfile");

const temp = require("temp");
const os = require("os");


/**
 * need source repo url
 * call https://developer.github.com/v3/repos/releases/#get-the-latest-release
 * check published_at
 * if it's after stored value, download it!
 */

module.exports = class Package {
  constructor(_attrs) {
    this.repo = _attrs.repo;
    this.dest = _attrs.dest;
    this.updated_at = _attrs.updated_at;
    this.downloaded = false;
    this.url = `https://api.github.com/repos/${this.repo}/releases/latest`;

    this.useLocalFile = false;

    if ( _attrs.local_zip ) {
      this.localZip = _attrs.local_zip;
      this.useLocalFile = true;
    }

    if ( typeof(this.updated_at) === "undefined" ) {
      this.updated_at = new Date(0);
    }
  
    if ( typeof(_attrs.log) === "undefined" ) {
      _attrs.log = function() {};
    }
  
    this.logger = _attrs.log;
    
    this.defaultHeaders = {
      "User-Agent": "Before Dawn"
    };  
  }
  
  attrs() {
    return {
      dest: this.dest,
      updated_at: this.updated_at,
      downloaded: this.downloaded
    };
  }

  async getReleaseInfo() {
    if ( this.useLocalFile ) {
      var stats = fs.statSync(this.localZip);
      this.data = {
        created_at: stats.mtime,
        published_at: stats.mtime,
        zipball_url: this.localZip
      };
    }
    else {
      this.data = await fetch(this.url, this.defaultHeaders)
        .then(res => res.json())
        .then((json) => {
          return json;
        })
        .catch((err) => {
          this.logger(err);
          if ( typeof(this.data) !== "undefined" ) {
            return this.data;
          }
          else {
            return {};
          }
        });
    }
    return this.data;
  }

  async checkLatestRelease(force) {
    let data = await this.getReleaseInfo();

    if ( data && (
      force === true ||
      data.published_at && new Date(data.published_at) > new Date(this.updated_at) )
    ) {
      this.logger("download package updates!");
      let dest;

      if ( this.useLocalFile ) {
        dest = this.localZip;
      }
      else {
        dest = await this.downloadFile(data.zipball_url);
      }
    
      await this.zipToSavers(dest);

      this.downloaded = true;
      this.updated_at = data.published_at;

      return this.attrs();  
    }
    else {
      this.logger("no package update available");
      return this.attrs();
    }
  }

  async downloadFile(url, dest) {
    if ( dest === undefined ) {
      dest = temp.path({dir: os.tmpdir(), suffix: ".zip"});
    }

    const res = await fetch(url, this.defaultHeaders);
    return await new Promise((resolve, reject) => {
      const fileStream = fs.createWriteStream(dest);
      res.body.pipe(fileStream);
      res.body.on("error", (err) => {
        reject(err);
      });
      fileStream.on("finish", function() {
        resolve(dest);
      });
    });
  }

  zipToSavers(tempName) {
    let self = this;

    return new Promise(function (resolve, reject) {
      lockfile.lock(self.dest, { realpath: false, stale: 30000 }).then((release) => {
        yauzl.open(tempName, {lazyEntries: true}, (err, zipfile) => {
          if (err) {
            release().then(() => {
              reject(err);
            });
          }
          else {
            //
            // clean out existing files
            //
            try {
              rimraf.sync(self.dest);
            }
            catch (err) {
              self.logger(err);
            }

            zipfile.readEntry();
            zipfile.on("entry", function(entry) {
              var fullPath = entry.fileName;
              // the incoming zip filename will have on extra directory on it
              // projectName/dir/etc/file
              //
              // example: muffinista-before-dawn-screensavers-d388377/starfield/index.html
              //
              // let's get rid of the projectName
              //
              var parts = fullPath.split(/\//);
              parts.shift();
              
              fullPath = path.join(self.dest, path.join(...parts));
              if (/\/$/.test(entry.fileName)) {
                // directory file names end with '/' 
                mkdirp(fullPath).then(() => {
                  zipfile.readEntry();
                }).catch((err) => {
                  release().then(() => {
                    return reject(err);
                  });
                });
              }
              else {
                // file entry 
                zipfile.openReadStream(entry, function(err, readStream) {
                  if (err) {
                    release().then(() => {
                      return reject(err);
                    });
                  }
                  
                  // ensure parent directory exists 
                  mkdirp(path.dirname(fullPath)).then(() => {
                    readStream.pipe(fs.createWriteStream(fullPath));
                    readStream.on("end", function() {
                      zipfile.readEntry();
                    });
                  }).catch((err) => {
                    release().then(() => {
                      return reject(err);
                    });
                  });
                });
              }
            });
            
            zipfile.on("end", function() {
              release().then(() => {
                resolve(self.attrs());
              });
            });  
          }
          
        });  
      });
    });
  }
};
