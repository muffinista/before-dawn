"use strict";

import * as main from "./index.js";
import AutoLaunch from "auto-launch";

export function toggle(appName, value) {
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
}
