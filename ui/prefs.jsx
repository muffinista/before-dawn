var React = require('react');
var ReactDOM = require('react-dom');
var Slider = require('rc-slider');
var AutoLaunch = require('auto-launch');
var path = require('path');

var _ = require('lodash');
var jQuery = require('./jquery.min.js');
var $ = jQuery;

const shell = window.require('electron').shell;

$(document).ready(function() {
    var remote = window.require('remote');
    var savers = remote.getGlobal('savers');
    var appName = remote.getGlobal('APP_NAME');
    var appVersion = remote.getGlobal('APP_VERSION');
    var defaultSaverRepo = remote.getGlobal('SAVER_REPO');
    var appRepo = remote.getGlobal('APP_REPO');
    var updateAvailable = remote.getGlobal('NEW_RELEASE_AVAILABLE');
    var dialog = remote.require('dialog');

    var Menu = remote.Menu;
    var MenuItem = remote.MenuItem;

    
    var appLauncher = new AutoLaunch({
	      name: appName
    });
    
    var temp = window.require('temp');
    var screenshot = window.require('desktop-screenshot');
    
    var saverOpts = {};

    var url_opts = {
        width: $("#preview").width(),
        height: $("#preview").height(),
        preview: 1
    };

    var menuTemplate = [
        {
            label: 'Edit',
            submenu: [
                {
                    label: 'Undo',
                    accelerator: 'CmdOrCtrl+Z',
                    role: 'undo'
                },
                {
                    label: 'Redo',
                    accelerator: 'Shift+CmdOrCtrl+Z',
                    role: 'redo'
                },
                {
                    type: 'separator'
                },
                {
                    label: 'Cut',
                    accelerator: 'CmdOrCtrl+X',
                    role: 'cut'
                },
                {
                    label: 'Copy',
                    accelerator: 'CmdOrCtrl+C',
                    role: 'copy'
                },
                {
                    label: 'Paste',
                    accelerator: 'CmdOrCtrl+V',
                    role: 'paste'
                },
                {
                    label: 'Select All',
                    accelerator: 'CmdOrCtrl+A',
                    role: 'selectall'
                }
            ]
        },
        {
            label: 'View',
            submenu: [
                {
                    label: 'Reload',
                    accelerator: 'CmdOrCtrl+R',
                    click: function(item, focusedWindow) {
                        if (focusedWindow)
                            focusedWindow.reload();
                    }
                },
                {
                    label: 'Toggle Developer Tools',
                    accelerator: (function() {
                        if (process.platform == 'darwin')
                            return 'Alt+Command+I';
                        else
                            return 'Ctrl+Shift+I';
                    })(),
                    click: function(item, focusedWindow) {
                        if (focusedWindow)
                            focusedWindow.toggleDevTools();
                    }
                }
            ]
        },
        {
            label: 'Window',
            role: 'window',
            submenu: [
                {
                    label: 'Minimize',
                    accelerator: 'CmdOrCtrl+M',
                    role: 'minimize'
                },
                {
                    label: 'Close',
                    accelerator: 'CmdOrCtrl+W',
                    role: 'close'
                }
            ]
        },
        {
            label: 'Help',
            role: 'help',
            submenu: [
                {
                    label: 'Learn More',
                    click: function() {
                        require('electron').shell.openExternal('https://github.com/muffinista/before-dawn');
                    }
                }
            ]
        }
    ];

    if (process.platform == 'darwin') {
        var name = remote.app.getName();
        menuTemplate.unshift({
            label: name,
            submenu: [
                {
                    label: 'About ' + name,
                    role: 'about'
                },
                {
                    type: 'separator'
                },
                {
                    label: 'Services',
                    role: 'services',
                    submenu: []
                },
                {
                    type: 'separator'
                },
                {
                    label: 'Hide ' + name,
                    accelerator: 'Command+H',
                    role: 'hide'
                },
                {
                    label: 'Hide Others',
                    accelerator: 'Command+Alt+H',
                    role: 'hideothers'
                },
                {
                    label: 'Show All',
                    role: 'unhide'
                },
                {
                    type: 'separator'
                },
                {
                    label: 'Quit',
                    accelerator: 'Command+Q',
                    click: function() { remote.app.quit(); }
                }
            ]
        });
    }


    var menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);
    
    appLauncher.isEnabled(function(enabled){
        console.log("auto launch enabled?: " + enabled);

	      if (enabled) {
            $("input[name=auto_start][type=checkbox]").attr("checked", "checked");            
        }
    });

    
    $("body > header div h1").html(appName);
    $("body > header div .version").html(appVersion);
    
    // if the preview div didn't have a height, figure one out by getting
    // the width and making it proprtional to the main screen. at the moment,
    // the div will never have a height at this point unless someone specifically
    // hacks the CSS to make it work differently
    if ( url_opts.height == 0 ) {
        var atomScreen = window.require('screen');
        var size = atomScreen.getPrimaryDisplay().bounds;
        var ratio = size.height / size.width;
        url_opts.height = url_opts.width * ratio;
        console.log("setting preview opts to", url_opts);
    }

    $("input[name=repo]").val( savers.getSource().repo ).attr("placeholder", defaultSaverRepo);
    $("[name=localSources]").val(JSON.stringify(savers.getLocalSources()));

    $("select[name=delay] option[value=" + savers.getDelay() + "]").attr("selected", "selected");
    if ( savers.getLock() === true ) {
        $("input[name=lock_screen][type=checkbox]").attr("checked", "checked");
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
                    <div className={"entry"} key={i}>
                      <label className={"pure-g"}>
                        <div className={"pure-u-1-8"}>
                          <input type="radio" name="screensaver" value={s.key} onChange={self.onChanged} defaultChecked={is_checked} />
                        </div>
                        <div className={"body pure-u-7-8"}>
                          <h1>{s.name}</h1>
                          <p className={"description"}>{s.description}</p>
                          <span className={authorClass}>
                            {s.author} //
                          </span>
                          <a className={aboutUrlClass} href={s.aboutUrl}>learn more</a>
                        </div>
                      </label>
                    </div>
                );
            });

            return(<div>{nodes}</div>);
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
      onSliderChange: function(val) {
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
            return <Slider defaultValue={this.props.value} onChange={this.onSliderChange} />;
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

            return(<div>{nodes}</div>);
        }
    });


    var loadPreview = function(s) {
        var screenshot_file = temp.path({suffix: '.png'});
        screenshot(screenshot_file, function(error, complete) {
            if ( complete ) {
                url_opts.screenshot = encodeURIComponent("file://" + screenshot_file);
            }

            ReactDOM.render(
                <Preview saver={s} />,
                document.getElementById('preview')
            );

        });
    };

    var optionsUpdated = function(data) {
        saverOpts = data;
        var current = $("input[name=screensaver]:checked").val();
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
        });
    };

    $("body").on("change", "input[name=screensaver]", function() {
        var val = $("input[name=screensaver]:checked").val();
        var s = savers.getByKey(val);

        saverOpts = {};
        redraw(s);
    });

    $("a.cancel").on("click", function(e) {
        closeWindow();
    });

    $("a.pick").on("click", function(e) {
        var dialog = remote.require('dialog');
        dialog.showOpenDialog({
            properties: [ 'openDirectory', 'createDirectory' ]
        },
            function(result) {
                console.log("****", result);

                if ( result === undefined ) {
                    $("[name=localSources]").val('[]');
                }
                else {
                    $("[name=localSources]").val(JSON.stringify(result));
                }
            });
    });

    $("a.save").on("click", function(e) {
        var delay = $("select[name=delay] option:selected").val();
        var do_lock = $("input[name=lock_screen][type=checkbox]").is(":checked");
        var val = $("input[name=screensaver]:checked").val();

        var repo = $("input[name=repo]").val();
        var localSources = JSON.parse($("[name=localSources]").val()) || [];

        saverOpts = window.optionsFormRef.getValues();
        
        console.log("saverOpts", saverOpts);
        savers.setCurrent(val, saverOpts);

        delay = parseInt(delay, 10);
        savers.setDelay(delay);
        savers.setLock(do_lock);

        savers.setSource(repo);
        savers.setLocalSources(localSources);

        savers.write(function() {
            if ( $("input[name=auto_start][type=checkbox]:checked").length > 0 ) {
	              appLauncher.enable(closeWindow);
            }
            else {
	              appLauncher.disable(closeWindow);
            }
        });
    });

    $(document).on('click', 'a[href^="http"]', function(event) {
        event.preventDefault();
        shell.openExternal(this.href);
    });

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
    

});
