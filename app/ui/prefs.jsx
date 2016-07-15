var React = require('react');
var ReactDOM = require('react-dom');
var AutoLaunch = require('auto-launch');
var path = require('path');

var _ = require('lodash');

const shell = window.require('electron').shell;


(function() {

  var electron = window.require('electron');
  var remote = window.require('electron').remote;
  var savers = remote.getGlobal('savers');
  var appName = remote.getGlobal('APP_NAME');
  var appVersion = remote.getGlobal('APP_VERSION');
  var defaultSaverRepo = remote.getGlobal('SAVER_REPO');
  var appRepo = remote.getGlobal('APP_REPO');
  var updateAvailable = remote.getGlobal('NEW_RELEASE_AVAILABLE');

  const {dialog} = require('electron').remote;
  
  var Menu = remote.Menu;
  var MenuItem = remote.MenuItem;
    

  var appLauncher = new AutoLaunch({
	  name: appName
  });
    
  var saverOpts = {};

  var url_opts = {
    width: document.querySelector("#preview").offsetWidth,
    height: document.querySelector("#preview").offsetHeight,
    preview: 1
  };

  // parse incoming URL params -- we'll get a link to the current screen images for previews here
  var urlParams = window.location.search.split(/[?&]/).slice(1).map(function(paramPair) {
    return paramPair.split(/=(.+)?/).slice(0, 2);
  }).reduce(function (obj, pairArray) {            
    obj[pairArray[0]] = pairArray[1];
    return obj;
  }, {});

  console.log("appLauncher " + appName);
  appLauncher.isEnabled().then(function(enabled){
    console.log("auto launch enabled?: " + enabled);
	  if (enabled) {
      document.querySelector("input[name=auto_start]").setAttribute("checked", "checked");
    }
  }).then(function(err) {
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
  if ( url_opts.height == 0 ) {
    var atomScreen = electron.screen;
    var size = atomScreen.getPrimaryDisplay().bounds;
    var ratio = size.height / size.width;
    url_opts.height = url_opts.width * ratio;
    console.log("setting preview opts to", url_opts);
  }

  el = document.querySelector("[name=repo]");
  el.value = savers.getSource().repo;
  el.setAttribute("placeholder", defaultSaverRepo);


  document.querySelector("[name=localSources]").value = JSON.stringify(savers.getLocalSources());
  document.querySelector("select[name='delay'] option[value='" + savers.getDelay() + "']").setAttribute("selected", "selected");
  
  if ( savers.getLock() === true ) {
    document.querySelector("input[name=lock_screen][type=checkbox]").setAttribute("checked", "checked");
  }

  if ( savers.getDisableOnBattery() === true ) {
    document.querySelector("input[name=disable_on_battery]").setAttribute("checked", "checked");
  }

  var SaverList = React.createClass({
    getInitialState: function() {
      return {
        value: this.props.current
      };
    },
    onChanged: function (e) {
      this.setState({
        key: e.currentTarget.value
      });
    },
    handleChange: function(event) {
      this.setState({value: event.target.value});
    },
    render: function() {
      var self = this;
      var nodes = this.props.data.map(function(s, i) {
        var is_checked = (s.key === self.state.value);
        var authorClass = "author";
        var aboutUrlClass = "external aboutUrl";
        
        if ( typeof(s.author) === "undefined" || s.author === "" ) {
          authorClass = authorClass + " hide";
        }
        if ( typeof(s.aboutUrl) === "undefined" || s.aboutUrl === "" ) {
          aboutUrlClass = aboutUrlClass + " hide";
        }
        
        return (
          <li className={"list-group-item entry"} key={i}>
            <div className={"media-body"}>
              <label>
                <div className={"body"}>
                  <input type="radio" name="screensaver" value={s.key} onChange={self.onChanged} defaultChecked={is_checked} />
                  <b>{s.name}</b>
                  <p className={"description"}>{s.description}</p>
                  <span className={authorClass}>
                    {s.author} //
                  </span>
                  <a className={aboutUrlClass} href={s.aboutUrl}>learn more</a>
                </div>
              </label>
            </div>
          </li>
        );
      });

      return(<ul className={"list-group"}>{nodes}</ul>);
    }
  });

  var Preview = React.createClass({
    render: function() {
      var s = this.props.saver;
      var mergedOpts = _.merge(url_opts, s.settings);
      
      mergedOpts = _.merge(mergedOpts, saverOpts);
      var previewUrl = s.getPreviewUrl(mergedOpts);

      return (
        <div>
          <iframe scrolling='no' src={previewUrl} />
        </div>
      );
    }
  });

  var SliderWithValue = React.createClass({
    onSliderChange: function(evt) {
      var val = evt.target.value;
      this.value = val;
      this.setState({
        name: this.name,
        value: val
      });

      this.props.onChange({
        name: this.props.name,
        value: val
      });
    },
    render: function() {
      return <input type="range" defaultValue={this.props.value} min={this.props.min} max={this.props.max} onChange={this.onSliderChange} className="slider slider-square-inverted" />
    }
  });

  var OptionsForm = React.createClass({
    values: {},
    onChanged: function(e) {
      this.props.onChange(this.getValues());
    },
    renderOption: function(o, index, val) {
      var guts;
      var self = this;
      var ref = "option" + index;
      
      if ( o.type === "slider" ) {
        val = parseInt(val, 10);
        guts = <SliderWithValue name={o.name} value={val} min={o.min} max={o.max} ref={ref} onChange={this.onChanged} />;             
      }
      else {
        guts = <input type="text" name={o.name} defaultValue={val} ref={ref} onChange={this.onChanged} />;
      }

      return (
        <fieldset>
          <legend>{o.name}</legend>
          {guts}
        </fieldset>
      );
    },
    getValues: function() {
      var self = this;
      var data = {};
      _.each(this.props.saver.options, function(o, i) {
        var ref = "option" + i;
        data[o.name] = self.refs[ref].value;
      });
      
      return data;
    },
    render: function() {
      var self = this;
      var s = this.props.saver;
      var onChange = this.props.onChange;
      var values = s.settings;
      var head;
      
      var nodes = this.props.saver.options.map(function(o, i) {
        var val = values[o.name];
        if ( typeof(val) === "undefined" ) {
          val = o.default;
        }

        return (
          <div key={i}>
            {self.renderOption(o, i, val)}
          </div>
        );
      });

      if ( nodes.length > 0 ) {
        head = "Options";
      }
      else {
        head = "";
      }
      
      return(<div><h1>{head}</h1>{nodes}</div>);
    }
  });


  var loadPreview = function(s) {
    url_opts.screenshot = decodeURIComponent(urlParams.screenshot);
    ReactDOM.render(
      <Preview saver={s} />,
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
    loadPreview(s);
    loadOptionsForm(s);
1  };

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

    });
  };


  var handlePathChoice = function(result) {
    var data;

    if ( result === undefined ) {
      // this kind of stinks
      data = [];
    }
    else {
      data = result;
    }

    document.querySelector("[name=localSources]").value = JSON.stringify(data);
  };

  var showPathChooser = function(e) {
    e.preventDefault();
    dialog.showOpenDialog(
      {
        properties: [ 'openDirectory', 'createDirectory' ]
      },
      handlePathChoice );

  };



  var updatePrefs = function() {
    var delay = document.querySelector("select[name=delay]").value;
    var do_lock = document.querySelector("input[name=lock_screen]").checked;
    var disable_on_battery = document.querySelector("input[name=disable_on_battery]").checked;
    var val = getCurrentScreensaver();
    
    var repo = document.querySelector("input[name=repo]").value;
    var localSources = JSON.parse(document.querySelector("[name=localSources]").value) || [];
    
    saverOpts = window.optionsFormRef.getValues();
    
    savers.setCurrent(val, saverOpts);

    delay = parseInt(delay, 10);
    savers.setDelay(delay);
    savers.setLock(do_lock);
    savers.setDisableOnBattery(disable_on_battery);
    
    savers.setSource(repo);
    savers.setLocalSources(localSources);

    savers.write(function() {
      if ( document.querySelector("input[name=auto_start]").checked === true ) {
        console.log("set auto_start == true");
	      appLauncher.enable().then(function(x) { console.log("YAHOO!!!!", x); }).then(function(err){
          console.log("ERR", err);
        });
      }
      else {
        console.log("set auto start == false");
	      appLauncher.disable().then(function(x) { console.log("YAHOO 22222!!!!", x); });
      }
      closeWindow();
    });
  };

  document.querySelector(".cancel").addEventListener('click', closeWindow, false);
  document.querySelector(".pick").addEventListener('click', showPathChooser, false);
  document.querySelector(".save").addEventListener('click', updatePrefs, false);

  var screensaverChanged = function() {
    var val = getCurrentScreensaver();
    var s = savers.getByKey(val);
    
    saverOpts = {};
    redraw(s);
  };


  /* var handleLinkClick = function() {
     shell.openExternal(this.href);
     };
     var links = document.querySelectorAll('a[href^="http"]');
     for ( var i = 0; i < links.length; i++ ) {
     link[i].addEventListener('click', handleLinkClick, false);
     }
   */

  renderList();

  
  if ( updateAvailable === true ) {
    dialog.showMessageBox({
      type: "info",
      title: "Update Available!",
      message: "There's a new update available! Would you like to download it?",
      buttons: ["No", "Yes"],
      defaultId: 0
      //,
      //icon: path.join(__dirname, '..', 'assets', 'Icon1024.png')
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
