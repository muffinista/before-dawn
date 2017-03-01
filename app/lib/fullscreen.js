'use strict';

var methods = {
  'darwin': function(displays) {
    var result;

    var _ = require('lodash');
    var $ = require('NodObjC');

    console.log("osx check");
    
    $.framework('Foundation');
    $.framework('Cocoa');

    var pool = $.NSAutoreleasePool('alloc')('init');
    var windowList = $.CFBridgingRelease(
      $.CGWindowListCopyWindowInfo(
        $.kCGWindowListOptionOnScreenOnly, $.kCGNullWindowID
      )
    );
    var error = $.alloc($.NSError).ref();
    var jsonData = $.NSJSONSerialization(
      "dataWithJSONObject", windowList,
      "options", $.NSJSONWritingPrettyPrinted,
      "error", error);
    
    var jsonString = $.NSString("alloc")("initWithData", jsonData, "encoding", $.NSUTF8StringEncoding);
    console.log(jsonString);
    
    var visibleMenubars = _.filter(JSON.parse(jsonString), function(x) {
      return x["kCGWindowName"] == "Menubar"; // || x["kCGWindowName"] == "Backstop Menubar";
    });
    
    console.log("There are " + displays.length + " displays");
    console.log("There are " + visibleMenubars.length + " menus");
    result = (visibleMenubars.length < displays.length);
    
    pool('drain');

    return result;
  },

  'win32': function() {
    var winctl = require('winctl');
    console.log("windows check");
    
    var fullscreenWindow = winctl.GetFullscreenWindow();
    console.log("fullscreen window " + fullscreenWindow);
    
    // we think we're in fullscreen mode if we have a fullscreen
    // window handle and the HWND id is > 0
    result = (
      typeof(fullscreenWindow) !== "undefined" &&
      fullscreenWindow !== null &&
      fullscreenWindow.getHwnd() > 0
    );
    return result;
  }
};


var inFullscreen = function(displays) {
  var result = false;
  var p = process.platform;

  console.log("inFullscreen");
  
  if ( methods[p] ) {
    try {
      result = methods[p](displays);
    }
    catch(e) {
      console.log(e);
    }
  }

  return result;
};


exports.inFullscreen = inFullscreen;
