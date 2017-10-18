import 'jquery';
import 'bootstrap';

const React = require("react");
const ReactDOM = require("react-dom");
const AutoLaunch = require("auto-launch");
const path = require("path");

const _ = require("lodash");
const Noty = require('noty');

import OptionsForm from "../components/options-form.jsx";
import Preview from "../components/preview.jsx";
import SaverList from "../components/saver-list.jsx";

const shell = window.require("electron").shell;
const {BrowserWindow} = window.require("electron").remote;

(function() {
  var electron = window.require("electron");
  const {ipcRenderer} = window.require("electron");
  const {crashReporter} = window.require("electron");

  var savers = require("../../lib/savers.js");
  var remote = window.require("electron").remote;
  var appName = remote.getGlobal("APP_NAME");
  var appVersion = remote.getGlobal("APP_VERSION");
  var defaultSaverRepo = remote.getGlobal("SAVER_REPO");
  var appRepo = remote.getGlobal("APP_REPO");
  var updateAvailable = remote.getGlobal("NEW_RELEASE_AVAILABLE");

  var ravenUrl = remote.getGlobal("RAVEN_URL");
  
  const {dialog} = require("electron").remote;

  var appLauncher = new AutoLaunch({
	  name: appName
  });
    
  var saverOpts = {};
  var url_opts = {};
  
  // parse incoming URL params -- we'll get a link to the current screen images for previews here
  var tmpParams = new URLSearchParams(document.location.search);

  // the main app will pass us a screenshot URL, here it is
  var screenshot = decodeURIComponent(tmpParams.get("screenshot"));

  if ( typeof(ravenUrl) !== "undefined" ) {
    Raven.config(ravenUrl).install();
  }
  
  crashReporter.start(remote.getGlobal("CRASH_REPORTER"));

  ipcRenderer.on("savers-updated", (event, arg) => {
    var val, s;

    console.log("handle savers-updated event");
    val = getCurrentScreensaver();

    renderList(false);
  });

  console.log("appLauncher " + appName);
  appLauncher.isEnabled().then(function(enabled){
    console.log("auto launch enabled?: " + enabled);
	  if (enabled) {
      document.querySelector("input[name=auto_start]").setAttribute("checked", "checked");
    }
  }).catch(function(err) {
    console.log("appLauncher error", err);
  });
  
  var el = document.querySelector("body > header div h1");
  if ( el ) {
    el.innerHTML = appName;
  }

  el = document.querySelector("body > header div .version");
  if ( el ) {
    el.innerHTML = appVersion;
  }
  
  // if the preview div didn't have a height, figure one out by getting
  // the width and making it proprtional to the main screen. at the moment,
  // the div will never have a height at this point unless someone specifically
  // hacks the CSS to make it work differently
  var getPreviewUrlOpts = function() {
    var tmp = {
      width: document.querySelector("#preview").offsetWidth,
      height: document.querySelector("#preview").offsetHeight,
      screenshot: screenshot,
      preview: 1
    };

    if ( tmp.height == 0 ) {
      var atomScreen = electron.screen;
      var size = atomScreen.getPrimaryDisplay().bounds;
      var ratio = size.height / size.width;
      tmp.height = tmp.width * ratio;
      //console.log("setting preview opts to", url_opts);
    }

    return tmp;
  };

  var loadPreview = function(s) {
    url_opts = getPreviewUrlOpts();

    ReactDOM.render(
      <Preview saver={s} url_opts={url_opts} saver_opts={saverOpts} />,
      document.getElementById("preview")
    );
  };

  var getCurrentScreensaver = function() {
    var el = document.querySelector("input[name=screensaver]:checked")
    if ( el !== null ) {
      return el.value;
    }

    return undefined;
  };

  /**
   * the user has updated the settings for this screensaver,
   * let's stash that data and redraw.
   */
  var optionsUpdated = function(data) {
    saverOpts = data;
    var current = getCurrentScreensaver();
    var s = savers.getByKey(current);
    redraw(s);        
  };
  
  var loadOptionsForm = function(s) {
    ReactDOM.render(
      <OptionsForm saver={s} onChange={(x) => optionsUpdated(x)} />,
      document.getElementById("options")
    );
  };
  
  var closeWindow = function() {
    var window = remote.getCurrentWindow();
    window.close();
  };

  var redraw = function(s) {
    var current_list_item = document.querySelector("#savers .list-group-item.active");
    if ( current_list_item !== null ) {
      current_list_item.classList.remove("active");
    }
    
    if ( typeof(s) === "undefined" ) {
      var current = getCurrentScreensaver();
      s = savers.getByKey(current);
    }

    if ( typeof(s) !== "undefined" ) {
      loadPreview(s);
      loadOptionsForm(s);

      var radio = document.querySelector("[name=screensaver]:checked");
      var el = radio.closest("li");
      var authorClass = "external author";
      var aboutUrlClass = "external aboutUrl";
      var buttonWrapClass = "hide";

      el.classList.add("active");
      
      if ( typeof(s.author) === "undefined" || s.author === "" ) {
        authorClass = authorClass + " hide";
      }
      if ( typeof(s.aboutUrl) === "undefined" || s.aboutUrl === "" ) {
        aboutUrlClass = aboutUrlClass + " hide";
      }

      if ( s.editable === true ) {
        buttonWrapClass = "buttons";
      }
      
      ReactDOM.render(
        <div>
          <h1 className={"name"}>{s.name} <a className={aboutUrlClass} href={s.aboutUrl}>learn more</a></h1>
          <p className={"description"}>{s.description}</p>
          <span className={authorClass}>
            {s.author}
          </span>
        </div>,
        document.getElementById("details")
      );

    }
  };

  var onResize = function() {
    redraw();
  };
  
  var handleLinkClick = function(event) {
    event.preventDefault();
    shell.openExternal(this.href);
  };
  
  var renderList = function(doScroll) {
    if ( typeof(doScroll) === "undefined" ) {
      doScroll = true;
    }

    savers.listAll(function(entries) {
      var current = savers.getCurrent();

      ReactDOM.render(
        <SaverList current={current} data={entries} />,
        document.getElementById("savers")
      );

      // scroll to the currently selected screensaver
      if ( doScroll === true ) {
        var $target = $("input[name=screensaver]:checked");
        if ( $target.length > 0 ) {
          var $list = $("#savers");
          $list.scrollTop($list.scrollTop() - $list.offset().top + $target.offset().top - 25);
        }
      }
      
      var s = savers.getByKey(current);
      redraw(s);

      var radios = document.querySelectorAll("input[name=screensaver]");
      for ( var i = 0; i < radios.length; i++ ) {
        radios[i].addEventListener("click", screensaverChanged, false);
      }

      var links = document.querySelectorAll("a.watcher");
      for ( var i = 0; i < links.length; i++ ) {
        links[i].addEventListener("click", openSaverInWatcher, false);
      }
      links = document.querySelectorAll("a.delete");
      for ( var i = 0; i < links.length; i++ ) {
        links[i].addEventListener("click", deleteSaver, false);
      }

      links = document.querySelectorAll("a[href^=\"http\"]");
      for ( var i = 0; i < links.length; i++ ) {
        links[i].addEventListener("click", handleLinkClick, false);
      }
    });
  };


  var handlePathChoice = function(result) {
    if ( result !== undefined ) {
      data = result;
      document.querySelector("[name=localSource]").value = data;
    }
  };

  var addNewSaver = function(e) {
    var prefsUrl = "file://" + __dirname + "/new.html";
    prefsUrl = prefsUrl + "?screenshot=" + encodeURIComponent(screenshot);

    var w = new BrowserWindow({
      width:450,
      height:500,
      resizable:true
    });

    w.loadURL(prefsUrl);
    e.preventDefault();
  };

  
  var showPathChooser = function(e) {
    e.preventDefault();
    dialog.showOpenDialog(
      {
        properties: [ "openDirectory", "createDirectory" ]
      },
      handlePathChoice );

  };

  /**
   * open the screensaver in preview window
   */
  var openSaverInWatcher = function(e) {
    var src = e.target.dataset.src;
    var w = new BrowserWindow();

    e.preventDefault();

    // pass the key of the screensaver we want to load
    // as well as the URL to our screenshot image
    var target = "file://" + __dirname + "/watcher.html?" +
                 "src=" + encodeURIComponent(src) +
                 "&screenshot=" + encodeURIComponent(screenshot);
    w.loadURL(target);

  };

  var deleteSaver = function(e) {
    var key = e.target.dataset.key;
    var s = savers.getByKey(key);
    
    dialog.showMessageBox(
      {
        type: "info",
        title: "Are you sure?",
        message: "Are you sure you want to delete this screensaver?",
        detail: "Deleting screensaver " + s.name,
        buttons: ["No", "Yes"],
        defaultId: 0
      },
      function(result) {
        if ( result === 1 ) {
          savers.delete(key, function() {
            ipcRenderer.send("savers-updated", key);
          });
        }
      }
    );

    e.preventDefault();
  };
  
  var updatePrefs = function() {
    var delay = document.querySelector("select[name=delay]").value;
    var sleep = document.querySelector("select[name=sleep]").value;    
    var do_lock = document.querySelector("input[name=lock_screen]").checked;
    var disable_on_battery = document.querySelector("input[name=disable_on_battery]").checked;
    var val = getCurrentScreensaver();
    
    var repo = document.querySelector("input[name=repo]").value;
    var localSource = document.querySelector("[name=localSource]").value;

    if ( val !== undefined ) {
      savers.setCurrent(val, saverOpts);
    }

    delay = parseInt(delay, 10);   
    savers.setDelay(delay);

    sleep = parseInt(sleep, 10);
    savers.setSleep(sleep);
    
    savers.setLock(do_lock);
    savers.setDisableOnBattery(disable_on_battery);
    
    savers.setSource(repo);
    savers.setLocalSource(localSource);

    savers.write(function() {
      if ( document.querySelector("input[name=auto_start]").checked === true ) {
        console.log("set auto_start == true");
	      appLauncher.enable().then(function(x) { }).then(function(err){
          console.log("ERR", err);
        });
      }
      else {
        console.log("set auto start == false");
	      appLauncher.disable().then(function(x) { });
      }

      /* new Noty({
         type: 'success',
         layout: 'topRight',
         timeout: 1000,
         text: 'Changes saved!',
         animation: {
         open: null
         }
         }).show();      
       */
      closeWindow();
    });
  }; // updatePrefs

  var screensaverChanged = function() {
    var val = getCurrentScreensaver();
    var s = savers.getByKey(val);
    
    saverOpts = {};
    redraw(s);
  };

  document.querySelector(".create").addEventListener("click", addNewSaver, false);
  document.querySelector(".cancel").addEventListener("click", closeWindow, false);
  document.querySelector(".pick").addEventListener("click", showPathChooser, false);
  document.querySelector(".save").addEventListener("click", updatePrefs, false);

  window.addEventListener("resize", onResize, true);

  //
  // i'm seeing a weird issue where both tabs can be marked as active,
  // which ruins the output. this little snippet seems to handle that
  // issue.
  // @see https://github.com/twbs/bootstrap/issues/19374
  $(document).ready(function() {
    $(".nav-tabs .nav-link")
       .click(function() {
        $(".tab-pane.active,.nav-link.active").removeClass("active");
      });
  });

  
  var basePath = window.require("electron").remote.getGlobal("basePath");
  savers.init(basePath, function() {
    el = document.querySelector("[name=repo]");
    el.value = savers.getSource().repo;
    el.setAttribute("placeholder", defaultSaverRepo);

    document.querySelector("[name=localSource]").value = savers.getLocalSource();
    el = document.querySelector("select[name='delay'] option[value='" + savers.getDelay() + "']");
    if ( el !== null ) {
      el.setAttribute("selected", "selected");
    }

    el = document.querySelector("select[name='sleep'] option[value='" + savers.getSleep() + "']");
    if ( el !== null ) {
      el.setAttribute("selected", "selected");
    }
    
    if ( savers.getLock() === true ) {
      document.querySelector("input[name=lock_screen][type=checkbox]").setAttribute("checked", "checked");
    }

    if ( savers.getDisableOnBattery() === true ) {
      document.querySelector("input[name=disable_on_battery]").setAttribute("checked", "checked");
    }
    renderList();
  });

  
  if ( updateAvailable === true ) {
    dialog.showMessageBox(
      {
        type: "info",
        title: "Update Available!",
        message: "There's a new update available! Would you like to download it?",
        buttons: ["No", "Yes"],
        defaultId: 0
      },
      function(result) {
        console.log(result);
        if ( result === 1 ) {
          shell.openExternal("https://github.com/" + appRepo + "/releases/latest");
        }
      }
    );
  }

})();
