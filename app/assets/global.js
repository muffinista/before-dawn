// waiting for a bit before hiding the cursor seems to help in windows
// @see http://delphic.me.uk/controllingthecursor.html for cursor url idea
/* var hideCursor = function() {
   document.getElementsByTagName('html')[0].style.cursor = "url('data:image/gif;base64,R0lGODlhAQABAPAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=='), auto !important";
   };
   setTimeout(hideCursor, 1000);
 */

/**
 * add some styles that will hide the cursor when the screensaver is running and
 * do other similar things.
 */
/*
window.addEventListener("load", function load(event){
  window.removeEventListener("load", load, false); //remove listener, no longer needed

  // https://davidwalsh.name/add-rules-stylesheets
  var sheet = (function() {
    // Create the <style> tag
    var style = document.createElement("style");

    // WebKit hack :(
    style.appendChild(document.createTextNode(""));

    // Add the <style> element to the page
    document.head.appendChild(style);

    return style.sheet;
  })();

  var cursorUrl = "url('data:image/gif;base64,R0lGODlhAQABAPAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==')";
  sheet.insertRule("body {margin:0; padding:0; overflow: hidden}", 0); // remove top and left whitespace
  sheet.insertRule("* { cursor: " + cursorUrl + ", none !important; }", 0); // hide the cursor
  sheet.insertRule("canvas {display:block;}", 0);    // remove scrollbars
  sheet.insertRule("canvas:focus {outline:0;}", 0); // remove blue outline around canvas

  // waiting for a bit before hiding the cursor seems to help in windows
  // @see http://delphic.me.uk/controllingthecursor.html for cursor url idea
  var hideCursor = function() {
    //alert("hide!");
    document.getElementsByTagName('html')[0].style.cursor = cursorUrl + ", auto !important";
  };
  setTimeout(hideCursor, 1000);
});
*/
