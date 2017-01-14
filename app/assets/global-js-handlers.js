var firstMouseMove = false;

/**
 * send a message that the user has done something and we should close
   the screensaver
 */
var exitScreenSaver = function(e) {
  var ipcRenderer;

  // seems like you get a mousemove event even without moving the mouse, i'm
  // guessing to establish initial position/etc. anyway, we can skip that event
  if ( e.type.indexOf("mouse") !== -1 && firstMouseMove === false ) {
    firstMouseMove = true;
    return;
  }
  ipcRenderer = require('electron').ipcRenderer;
  ipcRenderer.send('stopScreenSaver');
};


var body = document.getElementsByTagName("body")[0];
var listenEvents = ["mousedown", "mousemove", "mousewheel", "keydown", "keyup", "keypress"];

for ( var i = 0; i < listenEvents.length; i++ ) {
  var name = listenEvents[i];
  body.addEventListener(name, exitScreenSaver, false);
}


window.hideCursor = function() {
  var cursorUrl = "url('data:image/gif;base64,R0lGODlhAQABAPAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==')";

  // waiting for a bit before hiding the cursor seems to help in windows
  // @see http://delphic.me.uk/controllingthecursor.html for cursor url idea
  document.getElementsByTagName('html')[0].style.cursor = cursorUrl + ", none !important";
};

setTimeout(window.hideCursor, 2500);
