'use strict';

const electron = require('electron');
var platform = process.platform;

var _, $, pool, winctl;

if ( platform === "darwin" ) {

  _ = require('lodash');
  $ = require('nodobjc');

  $.framework('Foundation');
  $.framework('Cocoa');

  pool = $.NSAutoreleasePool('alloc')('init');

  process.on('beforeExit', (code) => {
    pool('drain');
  });
}
else if ( platform === "win32" ) {
  winctl = require('winctl');
}

var methods = {
  'darwin': function() {
    var result;
    var displays = electron.screen.getAllDisplays();
    var windowList = $.CFBridgingRelease(
      $.CGWindowListCopyWindowInfo(
        $.kCGWindowListOptionOnScreenOnly, $.kCGNullWindowID
      )
    );
    var error = $.alloc($.NSError).ref();
    var jsonData = $.NSJSONSerialization(
      "dataWithJSONObject", windowList,
      "options", 0,
      "error", error);
    
    var jsonString = $.NSString("alloc")("initWithData", jsonData, "encoding", $.NSUTF8StringEncoding);
    //console.log(jsonString);
    
    var visibleMenubars = _.filter(JSON.parse(jsonString), function(x) {
      return x["kCGWindowName"] == "Menubar"; // || x["kCGWindowName"] == "Backstop Menubar";
    });
    
    //console.log("There are " + displays.length + " displays");
    //console.log("There are " + visibleMenubars.length + " menus");
    result = (visibleMenubars.length < displays.length);
    
    //    pool('drain');

    return result;
  },

  'win32': function() {
    var fullscreenWindow = winctl.GetFullscreenWindow();
    
    // we think we're in fullscreen mode if we have a fullscreen
    // window handle and the HWND id is > 0
    return (
      typeof(fullscreenWindow) !== "undefined" &&
      fullscreenWindow !== null &&
      fullscreenWindow.getHwnd() > 0
    );
  }
};


var _method = methods[platform];

var inFullscreen = function() {
  var result = false;

  if ( _method ) {
    try {
      result = _method();
    }
    catch(e) {
      console.log(e);
    }
  }

  return result;
};


exports.inFullscreen = inFullscreen;
