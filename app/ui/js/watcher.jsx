import React from "react";
import ReactDOM from "react-dom"

import AttributesForm from "./attributes-form";
import OptionsForm from "./options-form";

(function() {
  const remote = window.require("electron").remote;
  const {ipcRenderer} = window.require("electron");
  const {crashReporter} = require("electron");
  crashReporter.start(remote.getGlobal("CRASH_REPORTER"));

  const _ = require("lodash");

  const fs = require("fs");
  const path = require("path");
  const url = require("url");
  const exec = require("child_process").exec;
  var savers = remote.getGlobal("savers");

  var ravenUrl = remote.getGlobal("RAVEN_URL");
  if ( typeof(ravenUrl) !== "undefined" ) {
    Raven.config(ravenUrl).install();
  }

  
  // parse incoming URL params -- we'll get a link to the current screen images for previews here
  var tmpParams = new URLSearchParams(document.location.search);
  window.urlParams = {};

  for(let k of tmpParams.keys() ) {
    window.urlParams[k] = tmpParams.get(k);
  }

  console.log("PARAMS", window.urlParams);
  
  // the main app will pass us a screenshot URL, here it is
  var screenshot = decodeURIComponent(urlParams.screenshot);
  var src = decodeURIComponent(urlParams.src);

  console.log("SRC", src);
  
  // load screensaver object
  var s = savers.getByKey(src);
  var saverAttrs = {};

  console.log("SAVER", s);
  
  if ( s !== undefined ) {
    saverAttrs = s.toHash();
  }

  var reloadPreview = function(ev) {
    var iframe = document.querySelector("iframe");
    var holder = document.querySelector("#main").closest(".row");

    iframe.width = holder.offsetWidth - 3;
    iframe.height = holder.offsetHeight - 3;

    var url_opts = {
      width: iframe.width,
      height: iframe.height,
      preview: 1,
      screenshot: screenshot
    };

    if ( s !== undefined ) {
      var mergedOpts = _.merge(url_opts, s.settings);
      var previewUrl = s.getUrl(mergedOpts);

      console.log("LOAD URL", previewUrl);
      iframe.src = previewUrl;
    }

    if ( typeof(ev) !== "undefined" ) {
      ev.preventDefault();
    }
  };

  var wrapper = document.getElementById("wrapper");
  var iframe = document.createElement("iframe");
  var saverOpts;

  var optionsUpdated = function(data) {
    saverOpts = data;
    reloadPreview();
  };
  
  var attrsUpdated = function(data) {
    console.log("ATTRS UPDATED", data);
    saverAttrs = data;
  };

  ReactDOM.render(
    <OptionsForm saver={s} onChange={optionsUpdated} />,
    document.getElementById("options")
  );

  ReactDOM.render(
    <AttributesForm saver={saverAttrs} onChanged={attrsUpdated} />,
    document.getElementById("attributes")
  );

  // add the iframe to the output
  wrapper.appendChild(iframe);

  reloadPreview();
  window.addEventListener("resize", reloadPreview, true);

  // figure out the path to the screensaver folder. use
  // decodeURIComponent to convert %20 to spaces
  var filePath = path.dirname(decodeURIComponent(url.parse(src).path));
  fs.watch(filePath, (eventType, filename) => {
    if (filename) {
      reloadPreview();
    }
  });

  // this is duped from new.html -- are we keeping that?
  var openFolderInOS = function(f) {
    var cmd;
    switch(process.platform) {
      case "darwin":
        cmd = `open ${f}`;
        break;
      case "win32":
        if (process.env.SystemRoot) {
          cmd = path.join(process.env.SystemRoot, "explorer.exe");
        }
        else {
          cmd = "explorer.exe";
        }

        cmd = cmd + ` /select,${f}`;
        break;
      default:
        // # Strip the filename from the path to make sure we pass a directory
        // # path. If we pass xdg-open a file path, it will open that file in the
        // # most suitable application instead, which is not what we want.
        cmd = `xdg-open ${f}`;
    };

    exec(cmd, function(error, stdout, stderr) {
      console.log("stdout: " + stdout);
      console.log("stderr: " + stderr);
      if (error !== null) {
        console.log("exec error: " + error);
      }
    });
  };

  
  var openFolder = function(ev) {
    ev.preventDefault();
    openFolderInOS(filePath);
  };

  var closeWindow = function(ev) {
    var window = remote.getCurrentWindow();
    window.close();

    ev.preventDefault();
  };

  var saveSettings = function(ev) {
    ev.preventDefault();

    console.log("SAVE", saverAttrs);
    s.write(saverAttrs);
    ipcRenderer.send("savers-updated", s.key);

    if ( this.classList.contains("and-close") ) {
      closeWindow(ev);
    }
  };
  var openConsole = function(ev) {
    ev.preventDefault();
    remote.getCurrentWindow().toggleDevTools();
  };

  // here's a little jQuery for bootstrap stuff
  $(function () {
    // we need to make sure the preview iframe is the right size
    // when we open that tab. this bit of jQuery handles that
    $("a[href=\"#main\"]").on("shown.bs.tab", function (e) {
      reloadPreview();
    })

    // activate tooltips
    $("[data-toggle=\"tooltip\"]").tooltip();
  })

   
  document.querySelector(".open").addEventListener("click", openFolder, false);
  document.querySelector(".cancel").addEventListener("click", closeWindow, false);
  document.querySelector(".reload").addEventListener("click", reloadPreview, false);
  document.querySelector(".console").addEventListener("click", openConsole, false);
  
  var saveButtons = document.querySelectorAll(".save");

  for ( var i = 0; i < saveButtons.length; i++ ) {
    saveButtons[i].addEventListener("click", saveSettings, false);
  }

  
  
})();
