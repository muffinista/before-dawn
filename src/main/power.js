
"use strict";

const exec = require("child_process").execFile;

module.exports = class Power {
  constructor(opts = {}) {
    this.method = opts.method;
    this.platform = opts.platform;
    if ( this.platform === undefined ) {
      this.platform = process.platform;
    }

    this.commands = {
      linux: {
        cmd: "upower",
        opts: ["-i", "/org/freedesktop/UPower/devices/battery_BAT0"]
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
      let hasBattery = false;
      let state = undefined;
      const lines = raw.split("\n").map((line) => line.trim());

      lines.forEach((l) => {
        if ( l === "battery") {
          hasBattery = true;
        }

        if ( hasBattery && state === undefined && l.indexOf("state:") === 0 ) {
          state = l.split(/:\s+(?=[\w\d'])/)[1];
        }
      });

      if ( state ) {
        return (state !== "discharging");
      }
      return this.default;
    }
    catch(e) {
      return this.default; 
    }
  }
 
  query(cmd, args) {
    return new Promise((resolve) => {
      exec(cmd, args, (error, stdout, stderr) => {
        if (error) {
          console.warn(error);
        }
        resolve(stdout? stdout : stderr);
      });
    });
  }
};
