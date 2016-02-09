/**
 * parse any incoming URL parameters and put them into their own
 * variable. depending on how/when you need to access these variables,
 * there's a good chance that you are better off doing it yourself.
 */
window.urlParams = window.location.search.split(/[?&]/).slice(1).map(function(paramPair) {
    return paramPair.split(/=(.+)?/).slice(0, 2);
}).reduce(function (obj, pairArray) {            
    obj[pairArray[0]] = pairArray[1];
    return obj;
}, {});

/**
 * add some styles that will hide the cursor when the screensaver is running and 
 * do other similar things.
 */
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
    sheet.insertRule("body {margin:0; padding:0; overflow: hidden}", 0); /* remove top and left whitespace */
    sheet.insertRule("* { cursor: " + cursorUrl + ", none !important; }", 0); /* hide the cursor */
    sheet.insertRule("canvas {display:block;}", 0);    /* remove scrollbars */
    sheet.insertRule("canvas:focus {outline:0;}", 0); /* remove blue outline around canvas */

    // waiting for a bit before hiding the cursor seems to help in windows
    // @see http://delphic.me.uk/controllingthecursor.html for cursor url idea
    var hideCursor = function() {
        document.getElementsByTagName('html')[0].style.cursor = cursorUrl + ", auto !important";
    };
    setTimeout(hideCursor, 1000);


    var firstMouseMove = false;

    var exitScreenSaver = function() {
        var ipcRenderer;

        // seems like you get a mousemove event even without moving the mouse, i'm
        // guessing to establish initial position/etc. anyway, we can skip that event
        if ( firstMouseMove == false ) {
            firstMouseMove = true;
            return;
        }
        ipcRenderer = require('electron').ipcRenderer;
        ipcRenderer.send('asynchronous-message', 'stopScreenSaver');
    };

    var body = document.getElementsByTagName("body")[0];

    body.addEventListener("mousemove", exitScreenSaver, false);
    body.addEventListener("mousewheel", exitScreenSaver, false);
    body.addEventListener("keydown", exitScreenSaver, false);
    
}, false);

