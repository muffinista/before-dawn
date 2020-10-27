
"use strict";

const exec = require("child_process").execFile;

module.exports = class Power {
  constructor(_platform = process.platform) {
    this.platform = _platform;
    this.commands = {
      darwin: {
        cmd: "ioreg", 
        opts: ["-n", "AppleSmartBattery",  "-r"]
      },
      linux: {
        cmd: "upower",
        opts: ["-i", "/org/freedesktop/UPower/devices/battery_BAT0"]
      },
      win32: {
        cmd: "WMIC", 
        opts: ["Path", "Win32_Battery", "Get", "BatteryStatus"]
      },
    };
    this.default = true;
  }

  async rawData() {
    if ( this.commands[this.platform] ) {
      const cmd = this.commands[this.platform].cmd;
      const opts = this.commands[this.platform].opts;
  
      return await this.query(cmd, opts);
    }

    return undefined;
  }

  async charging(raw = null) {
    if ( raw === null ) {
      raw = await this.rawData();
    }

    if ( raw === undefined ) {
      return this.default;
    }

    try {
      if ( this.platform === "darwin") {
        const result = raw.split("\n").
          map((line) => line.trim()).
          filter((line) => line.match(/^"/)).
          map((line) => line.replace(/"/g, "").split(/ = /)).
          reduce((obj, values) => { obj[values[0]] = values[1]; return obj;}, {});
  
        return !Object.keys(result).length || 
          result["FullyCharged"] == "Yes" ||
          result["IsCharging"] == "Yes";
      }

      if ( this.platform === "linux") {
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
      if ( this.platform === "win32" ) {
        // 1 { "Battery is discharging" }
        return parseInt(raw.trim().split("\n")[1], 10) !== 1;
      }
    }
    catch(e) {
      return this.default; 
    }

    return this.default;
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
