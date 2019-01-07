"use strict";


/**
 * lock the screen when the saver deactivates. currently this only works on OSX and Windows
 */
var doLockScreen = function() {
  var exec = require("child_process").exec;
  var cmd;
  
  if ( process.platform === "darwin" ) {
    cmd = "'/System/Library/CoreServices/Menu Extras/User.menu/Contents/Resources/CGSession' -suspend";       
  }
  else if ( process.platform === "win32" ) {
    // @see http://superuser.com/questions/21179/command-line-cmd-command-to-lock-a-windows-machine
    cmd = "rundll32.exe user32.dll,LockWorkStation";
  }
  else {
    return;
  }

  exec(cmd, function(error, stdout, stderr) {
    // console.log("stdout: " + stdout);
    // console.log("stderr: " + stderr);
    if (error !== null) {
      console.log("exec error: " + error);
    }
  });
};


/**
 * put the display to sleep
 */
var doSleep = function() {
  const path = require("path");
  var exec = require("child_process").exec;
  var cmd;

  if ( process.platform === "darwin" ) {
    cmd = "pmset displaysleepnow";
  }
  else if ( process.platform === "win32" ) {
    // this uses a 3rd party library -- nircmd -- to turn off the monitor
    // http://www.nirsoft.net/utils/nircmd.html
    // NOTE: this doesn't work in development mode right now because the path is wrong
    cmd = path.join(__dirname, "bin", "nircmd.exe") + " monitor off";
  }
  else {
    return;
  }

  exec(cmd, function(error, stdout, stderr) {
    //console.log('stdout: ' + stdout);
    //console.log('stderr: ' + stderr);
    if (error !== null) {
      console.log("doSleep exec error: " + error);
    }
  });
};

exports.doLockScreen = doLockScreen;
exports.doSleep = doSleep;
