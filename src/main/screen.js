"use strict";

const exec = require("child_process").execFile;
const path = require("path");
let logger = () => {};
let workingDir = __dirname;

var setDir = function(d) {
  // eslint-disable-next-line no-console
  console.log("!!!!!", d);
  workingDir = d;
};

var setLogger = function(l) {
  logger = l;
};

/**
 * lock the screen when the saver deactivates. currently this only works on OSX and Windows
 */
var doLockScreen = function() {
  var cmd;
  let args = [];
  
  if ( process.platform === "darwin" ) {
    cmd = "/System/Library/CoreServices/Menu Extras/User.menu/Contents/Resources/CGSession";
    args = ["-suspend"];
  }
  else if ( process.platform === "win32" ) {
    // @see http://superuser.com/questions/21179/command-line-cmd-command-to-lock-a-windows-machine
    cmd = "rundll32.exe";
    args = ["user32.dll,LockWorkStation"];
  }
  else {
    cmd = path.join(workingDir, "bin", "lock-screen.sh");
    args = [];
  }

  logger(cmd, args);

  exec(cmd, args, function(error, stdout, stderr) {
    if (error !== null) {
      logger("doLockScreen error: " + error);
      logger("stdout: " + stdout);
      logger("stderr: " + stderr);
    }
  });
};


/**
 * put the display to sleep
 */
var doSleep = function() {
  var cmd;
  let args = [];

  if ( process.platform === "darwin" ) {
    cmd = "pmset";
    args = ["displaysleepnow"];
  }
  else if ( process.platform === "win32" ) {
    // this uses a 3rd party library -- nircmd -- to turn off the monitor
    // http://www.nirsoft.net/utils/nircmd.html
    // NOTE: this doesn't work in development mode right now because the path is wrong
    cmd = path.join(workingDir, "bin", "nircmd.exe");
    args = ["monitor", "off"];
  }
  else {
    // in linux, we use the same command to lock/skeep
    cmd = path.join(workingDir, "bin", "lock-screen.sh");
    args = [];
  }

  logger(cmd, args);

  exec(cmd, args, function(error, stdout, stderr) {
    if (error !== null) {
      logger("doSleep exec error: " + error);
      logger("stdout: " + stdout);
      logger("stderr: " + stderr);
    }
  });
};

exports.setLogger = setLogger;
exports.setDir = setDir;
exports.doLockScreen = doLockScreen;
exports.doSleep = doSleep;
