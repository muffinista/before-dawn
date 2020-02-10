"use strict";

const fs = require("fs-extra");
const path = require("path");

module.exports = class SaverFactory {
  constructor(prefs, logger) {
    this.prefs = prefs;
    if ( logger !== undefined ) {
      this.logger = logger;
    }
    else {
      this.logger = function() {};
    }
  }

  /**
   * generate a screensaver template
   */
  create(src, destDir, opts) {
    if ( destDir === "" || destDir === undefined ) {
      throw new Error("No local directory specified!");
    }

    this.logger(`SRC: ${src}`);
    let contents = fs.readdirSync(src);
    const defaults = {
      "source": "index.html",
      "options": []
    };

    opts = Object.assign({}, defaults, opts);
    opts.key = opts.name.toLowerCase().
                    replace(/[^a-z0-9]+/gi, "-").
                    replace(/-$/, "").
                    replace(/^-/, "");

    var dest = path.join(destDir, opts.key);
    this.logger(`mkdir ${dest}`);
    fs.mkdirpSync(dest);

    contents.forEach(function(content) {
      fs.copySync(path.join(src, content), path.join(dest, content));
    });

    //
    // generate JSON file
    //
    var configDest = path.join(dest, "saver.json");
    var content = fs.readFileSync( configDest );
    contents = Object.assign({}, JSON.parse(content), opts);

    fs.writeFileSync(configDest, JSON.stringify(contents, null, 2));

    // add dest in case someone needs it
    // but don't persist that data because that would be icky
    opts.dest = path.join(dest, "saver.json");
    
    return opts;
  }
};