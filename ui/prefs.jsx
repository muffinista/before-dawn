var React = require('react');
var ReactDOM = require('react-dom');
var Slider = require('rc-slider');

$ = jQuery = require('../bower_components/jquery/dist/jquery.min.js');


$(document).ready(function() {
    var remote = window.require('remote');
    var savers = remote.getGlobal('savers');

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
            console.log("change", event);
            this.setState({value: event.target.value});
        },
        render: function() {
            var self = this;
            var nodes = this.props.data.map(function(s) {
                var is_checked = (s.key === self.state.value);
                return (
                    <div class="entry">
                    <h1>{s.name}</h1>
                    <div class="body">
                    <input type="radio" name="screensaver" value={s.key} onChange={this.onChanged} defaultChecked={is_checked} />
                    {s.description}
                </div>
                    </div>
                );
            });

            return(<div>{nodes}</div>);
        }
    });

    var Preview = React.createClass({
        render: function() {
            var s = this.props.saver;
            var url_opts = {
                //  width: $("#preview").width(),
                //  height: $("#preview").height(),
                width: 200,
                height: 200,
                preview: 1
            };
            var previewUrl = s.getPreviewUrl(url_opts);

            return (
                <div>
                    <iframe scrolling='no' src={previewUrl} />
                    </div>
            );
        }
    });

    var Details = React.createClass({
        render: function() {
            var s = this.props.saver;
            return (
                <div>
      <h1>{s.name}</h1>
      <h2>{s.author}</h2>
      <p>{s.description}</p>     
      <a href="{s.aboutUrl}">{s.aboutUrl}</a>
                    </div>
            );
        }
    });

    var OptionsForm = React.createClass({
        onChanged: function(e) {
            console.log("CHANGE", e);
        },
        renderOption: function(o) {
            var guts;
            if ( o.type === "slider" ) {
                guts = <Slider name={o.name} min={o.min} max={o.max} onChange={this.onChanged} />;
            }
            else {
                guts = <input type="text" name={o.name} onChange={this.onChanged} />;
            }

            return (
                    <fieldset>
                    <legend>{o.name}</legend>
                    {guts}
                </fieldset>
            );
        },
        getValues: function() {
            var data = this.props.saver.options.map(function(o) {
                return 0;
            });
        },
        render: function() {
            var self = this;
            var s = this.props.saver;
            
            var nodes = this.props.saver.options.map(function(o) {
                return (
                    <div>
                    {self.renderOption(o)}
                    </div>
                );
            });

            return(<div>{nodes}</div>);
        }
    });


    var loadPreview = function(s) {
        ReactDOM.render(
                <Preview saver={s} />,
            document.getElementById('preview')
        );   
    };

    var loadDetails = function(s) {
        ReactDOM.render(
                <Details saver={s} />,
            document.getElementById('details')
        );   
    };

    var loadOptionsForm = function(s) {
        ReactDOM.render(
                <OptionsForm saver={s} />,
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
        loadDetails(s);
    };

    var renderList = function() {
        savers.listAll(function(entries) {
            var current = savers.getCurrent();
            console.log("current selection", current);
            
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
        redraw(s);
    });

    $("a.cancel").on("click", function(e) {
        closeWindow();
    });

    $("a.save").on("click", function(e) {
        var val = $("input[name=screensaver]:checked").val();
        savers.setCurrent(val);
        closeWindow();
    });

    $("a.updater").on("click", function(e) {
        var updater = window.require('updater.js');
        updater.init(basePath);

        var didUpdate = function(x) {
            $(".update-results").html("Hooray for updates!");
            renderList();
        };
        var noUpdate = function(x) {
            $(".update-results").html("No updates!");
        };

        updater.updateAll(didUpdate, noUpdate);
    });

    renderList();

});
