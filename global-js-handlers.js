var firstMouseMove = false;

var exitScreenSaver = function() {
    var ipcRenderer;

    // seems like you get a mousemove event even without moving the mouse, i'm
    // guessing to establish initial position/etc. anyway, we can skip that event
    if ( firstMouseMove === false ) {
        firstMouseMove = true;
        return;
    }
    ipcRenderer = require('electron').ipcRenderer;
    ipcRenderer.send('asynchronous-message', 'stopScreenSaver');
};
                
var body = document.getElementsByTagName("body")[0];
var listenEvents = ["mousedown", "mousemove", "mousewheel", "keydown"];

for ( var i = 0; i < listenEvents.length; i++ ) {
    var name = listenEvents[i];
    body.addEventListener(name, exitScreenSaver, false);
}
