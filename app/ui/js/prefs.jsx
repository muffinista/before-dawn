var React = require('react');
var ReactDOM = require('react-dom');
var AutoLaunch = require('auto-launch');
var path = require('path');

var _ = require('lodash');

var SliderWithValue = require('./slider-with-value');
var OptionsForm = require('./options-form');

var Preview = require('./preview');
var SaverList = require('./saver-list');


const shell = window.require('electron').shell;
const {BrowserWindow} = window.require('electron').remote;

(function() {
  var electron = window.require('electron');
  const {ipcRenderer} = window.require('electron')
  var remote = window.require('electron').remote;
  var savers = remote.getGlobal('savers');
  var appName = remote.getGlobal('APP_NAME');
  var appVersion = remote.getGlobal('APP_VERSION');
  var defaultSaverRepo = remote.getGlobal('SAVER_REPO');
  var appRepo = remote.getGlobal('APP_REPO');
  var updateAvailable = remote.getGlobal('NEW_RELEASE_AVAILABLE');


  ipcRenderer.on('savers-updated', (event, arg) => {
    console.log("handle savers-updated event");
    renderList();

    var val = getCurrentScreensaver();
    var s = savers.getByKey(val);
    
    redraw(s);

  });
  
  const {dialog} = require('electron').remote;

  var appLauncher = new AutoLaunch({
	  name: appName
  });
    
  var saverOpts = {};
  var url_opts = {};
  
  // parse incoming URL params -- we'll get a link to the current screen images for previews here
  var tmpParams = new URLSearchParams(document.location.search);

  // the main app will pass us a screenshot URL, here it is
  var screenshot = decodeURIComponent(tmpParams.get("screenshot"));
  
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

  el = document.querySelector("[name=repo]");
  el.value = savers.getSource().repo;
  el.setAttribute("placeholder", defaultSaverRepo);


  document.querySelector("[name=localSource]").value = savers.getLocalSource();
  document.querySelector("select[name='delay'] option[value='" + savers.getDelay() + "']").setAttribute("selected", "selected");
  document.querySelector("select[name='sleep'] option[value='" + savers.getSleep() + "']").setAttribute("selected", "selected");
  
  if ( savers.getLock() === true ) {
    document.querySelector("input[name=lock_screen][type=checkbox]").setAttribute("checked", "checked");
  }

  if ( savers.getDisableOnBattery() === true ) {
    document.querySelector("input[name=disable_on_battery]").setAttribute("checked", "checked");
  }

  
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
      document.getElementById('preview')
    );
  };

  var getCurrentScreensaver = function() {
    return document.querySelector("input[name=screensaver]:checked").value;
  };
  
  var optionsUpdated = function(data) {
    saverOpts = data;
    var current = getCurrentScreensaver();
    var s = savers.getByKey(current);
    redraw(s);        
  };
  
  var loadOptionsForm = function(s) {
    // hold a ref to the form so we can get values later
    // @todo - i assume this is a hack that doesn't match with react very well
    window.optionsFormRef = ReactDOM.render(
      <OptionsForm saver={s} onChange={optionsUpdated} />,
      document.getElementById('options')
    );
  };
  
  var closeWindow = function() {
    var window = remote.getCurrentWindow();
    window.close();
  };

  var redraw = function(s) {
    if ( typeof(s) === "undefined" ) {
      var current = getCurrentScreensaver();
      s = savers.getByKey(current);
      //console.log(current, s);
    }

    loadPreview(s);
    loadOptionsForm(s);
  };

  var onResize = function() {
    redraw();
  };
  
  var handleLinkClick = function(event) {
    event.preventDefault();
    shell.openExternal(this.href);
  };
  
  var renderList = function() {
    savers.listAll(function(entries) {
      var current = savers.getCurrent();

      ReactDOM.render(
        <SaverList current={current} data={entries} />,
        document.getElementById('savers')
      );
      
      var s = savers.getByKey(current);
      redraw(s);

      var radios = document.querySelectorAll('input[name=screensaver]');
      for ( var i = 0; i < radios.length; i++ ) {
        radios[i].addEventListener('click', screensaverChanged, false);
      }

      var links = document.querySelectorAll('a.watcher');
      for ( var i = 0; i < links.length; i++ ) {
        links[i].addEventListener('click', openSaverInWatcher, false);
      }
      links = document.querySelectorAll('a.delete');
      for ( var i = 0; i < links.length; i++ ) {
        links[i].addEventListener('click', deleteSaver, false);
      }

      links = document.querySelectorAll('a[href^="http"]');
      for ( var i = 0; i < links.length; i++ ) {
        links[i].addEventListener('click', handleLinkClick, false);
      }
    });
  };


  var handlePathChoice = function(result) {
    var data;

    if ( result === undefined ) {
      // this kind of stinks
      data = "";
    }
    else {
      data = result;
    }

    document.querySelector("[name=localSource]").value = data;
  };

  var addNewSaver = function(e) {
    var prefsUrl = 'file://' + __dirname + '/new.html';
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
        properties: [ 'openDirectory', 'createDirectory' ]
      },
      handlePathChoice );

  };

  /**
   * open the screensaver in preview window
   */
  var openSaverInWatcher = function(e) {
    var key = e.target.dataset.key;
    var w = new BrowserWindow();

    e.preventDefault();

    // pass the key of the screensaver we want to load
    // as well as the URL to our screenshot image
    var target = 'file://' + __dirname + "/watcher.html?" +
                 "src=" + encodeURIComponent(key) +
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
        console.log(result);
        if ( result === 1 ) {
          savers.delete(key, function() {
            ipcRenderer.send('savers-updated', key);
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
    
    saverOpts = window.optionsFormRef.getValues();
    
    savers.setCurrent(val, saverOpts);

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
      closeWindow();
    });
  };


  document.querySelector(".create").addEventListener('click', addNewSaver, false);
  document.querySelector(".cancel").addEventListener('click', closeWindow, false);
  document.querySelector(".pick").addEventListener('click', showPathChooser, false);
  document.querySelector(".save").addEventListener('click', updatePrefs, false);

  window.addEventListener('resize', onResize, true);
  
  
  var screensaverChanged = function() {
    var val = getCurrentScreensaver();
    var s = savers.getByKey(val);
    
    saverOpts = {};
    redraw(s);
  };

  renderList();

  
  if ( updateAvailable === true ) {
    dialog.showMessageBox({
      type: "info",
      title: "Update Available!",
      message: "There's a new update available! Would you like to download it?",
      buttons: ["No", "Yes"],
      defaultId: 0
    },
                          function(result) {
                            console.log(result);
                            if ( result === 1 ) {
                              shell.openExternal('https://github.com/' + appRepo + '/releases/latest');
                            }
                          }
    );
  }

})();
