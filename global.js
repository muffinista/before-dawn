window.urlParams = window.location.search.split(/[?&]/).slice(1).map(function(paramPair) {
    return paramPair.split(/=(.+)?/).slice(0, 2);
}).reduce(function (obj, pairArray) {            
    obj[pairArray[0]] = pairArray[1];
    return obj;
}, {});
//console.log("set global url params to", window.urlParams);

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


sheet.insertRule("body {margin:0; padding:0; cursor:none;}"); /* remove top and left whitespace */
sheet.insertRule("canvas {display:block;}");    /* remove scrollbars */
sheet.insertRule("canvas:focus {outline:0;}"); /* remove blue outline around canvas */
