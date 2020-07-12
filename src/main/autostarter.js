"use strict";

const main = require("./index.js");

var toggle = function(appName, value) {
  if ( process.env.TEST_MODE !== undefined ) {
    return;
  }

  var AutoLaunch = require("auto-launch");
  var appLauncher = new AutoLaunch({
    name: appName
  });

  if ( value === true ) {
    appLauncher.isEnabled().then((isEnabled) => {
      if ( isEnabled ) {
        return;
      }
      
      appLauncher.
        enable().
        then((err) =>{
          main.log.info("appLauncher enable", err);
        }).catch((err) => {
          main.log.info("appLauncher enable failed", err);
        });
    });
  }
  else {
    main.log.info("set auto start == false");
    appLauncher.isEnabled().then((isEnabled) => {
      if ( !isEnabled ) {
        return;
      }
      appLauncher.
        disable().
        then(function() { 
          main.log.info("appLauncher disabled");
        }).
        catch((err) => {
          main.log.info("appLauncher disable failed", err);
        });
    });
  }
};

exports.toggle = toggle;
