window.urlParams = window.location.search.split(/[?&]/).slice(1).map(function(paramPair) {
    return paramPair.split(/=(.+)?/).slice(0, 2);
}).reduce(function (obj, pairArray) {            
    obj[pairArray[0]] = pairArray[1];
    return obj;
}, {});

var firstMouseMove = false;

var exitScreenSaver = function() {
    // seems like you get a mousemove event even without moving the mouse, i'm
    // guessing to establish initial position/etc. anyway, we can skip that event
    if ( firstMouseMove == false ) {
        firstMouseMove = true;
        return;
    }
    var remote = require('remote');
    var _window = remote.getCurrentWindow();
    _window.close();
};

var loadEvents = function() {
    
    var body = document.getElementsByTagName("body")[0];

    if ( body === undefined ) {
        return;
    }

    console.log("applying global exit event handlers");

    window.clearTimeout(timeoutId);
   
    body.addEventListener("mousemove", exitScreenSaver, false);
    body.addEventListener("keydown", exitScreenSaver, false);
};

var timeoutId = setTimeout(loadEvents, 100);
