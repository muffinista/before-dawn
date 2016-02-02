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

    
    sheet.insertRule("body {margin:0; padding:0;}", 0); /* remove top and left whitespace */

cursor_url = "file://" + escape(__dirname) + "/assets/icon.png";
    sheet.insertRule("* { cursor:url(" + cursor_url + "), auto !important; }", 0); /* hide the cursor */

    sheet.insertRule("canvas {display:block;}", 0);    /* remove scrollbars */
    sheet.insertRule("canvas:focus {outline:0;}", 0); /* remove blue outline around canvas */
}, false);

