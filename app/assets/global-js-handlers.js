window.hideCursor = function() {
  var cursorUrl = "url('data:image/gif;base64,R0lGODlhAQABAPAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==')";

  // waiting for a bit before hiding the cursor seems to help in windows
  // @see http://delphic.me.uk/controllingthecursor.html for cursor url idea
  document.getElementsByTagName('html')[0].style.cursor = cursorUrl + ", none !important";
};

setTimeout(window.hideCursor, 2500);
