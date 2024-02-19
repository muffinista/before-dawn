
"use strict";

import { execFile } from "child_process";

export default class Power {
  constructor(opts = {}) {
    this.method = opts.method;
    this.platform = opts.platform;
    if ( this.platform === undefined ) {
      this.platform = process.platform;
    }

    // https://stackoverflow.com/questions/651563/getting-the-last-element-of-a-split-string-array
    this.commands = {
      linux: {
        cmd: "dbus-send",
        opts: [
          "--print-reply",
          "--system",
          "--dest=org.freedesktop.UPower",
          "/org/freedesktop/UPower",
          "org.freedesktop.DBus.Properties.Get",
          "string:org.freedesktop.UPower",
          "string:OnBattery" 
        ]
      },
    };
    this.default = true;
  }

  async rawData() {
    if ( this.commands[this.platform] ) {
      const cmd = this.commands[this.platform].cmd;
      const opts = this.commands[this.platform].opts;
  
      try {
        return await this.query(cmd, opts);
      }
      catch(e) {
        return undefined;
      }
    }

    return undefined;
  }

  async charging(raw = null) {
    if ( this.method !== undefined) {
      return !this.method();
    }

    if ( raw === null ) {
      raw = await this.rawData();
    }

    if ( raw === undefined ) {
      return this.default;
    }

    try {
      // method return time=1630857381.345226 sender=:1.59 -> destination=:1.1404 serial=30 reply_serial=2
      // variant       boolean false      
      const result = raw.split("\n").find((line) => line.indexOf("variant") !== -1);

      // OnBattery == false means we're plugged in
      return result.indexOf("false") !== -1;
    }
    catch(e) {
      console.log(e);
      return this.default; 
    }
  }
 
  query(cmd, args) {
    return new Promise((resolve) => {
      execFile(cmd, args, (error, stdout, stderr) => {
        if (error) {
          console.warn(error);
        }
        resolve(stdout? stdout : stderr);
      });
    });
  }
}
