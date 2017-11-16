import "jquery";
import "bootstrap";

(function() {
  var remote = require('electron').remote;
  var currentWindow = remote.getCurrentWindow();
  var savers = currentWindow.savers;
  const {ipcRenderer} = window.require('electron');

  // parse incoming URL params -- we'll get a link to the current screen images for previews here
  var tmpParams = new URLSearchParams(document.location.search);

  // the main app will pass us a screenshot URL, here it is
  var screenshot = decodeURIComponent(tmpParams.get("screenshot"));

  var handleSave = function() {   
    var name = document.querySelector("[name=name]").value;
    var description = document.querySelector("[name=description]").value;     
    var aboutUrl = document.querySelector("[name=aboutUrl]").value;     
    var author = document.querySelector("[name=author]").value;

    ipcRenderer.on("generate-screensaver", (event, data) => {
      ipcRenderer.send("open-editor", {
        src: data.dest,
        screenshot: screenshot
      });
      currentWindow.close();
    });

    ipcRenderer.send("generate-screensaver", {
      name: name,
      description: description,
      aboutUrl: aboutUrl,
      author: author
    });
  };

  var cancel = function() {
    var remote = require('electron').remote;
    const {ipcRenderer} = window.require('electron');
    var me = remote.getCurrentWindow();
    me.close();
  };

  var validateForm = function() {
    var form = document.querySelector("form");
    form.classList.add("submit-attempt");
  };

  document.querySelector(".cancel").addEventListener('click', cancel, false);

  document.querySelector("body").classList.add("loaded");

  var localSource = savers.getLocalSource();
  if ( typeof(localSource) === "undefined" || localSource === "" ) {
    document.querySelector(".new").classList.add("hide");
    document.querySelector(".need-setup").classList.remove("hide");     
  }
  else {
    document.querySelector("body").classList.add("loaded");
    document.querySelector(".save").addEventListener('click', validateForm, false);
    document.querySelector("form").addEventListener('submit', handleSave, false);
  }

})();
