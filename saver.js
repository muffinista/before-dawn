/**
 * simple class for a screen saver
 */

var _ = require('lodash');

/**
 * take a hash and turn it into a URL string
 * @see http://stackoverflow.com/questions/1714786/querystring-encoding-of-a-javascript-object
 */
var serialize = function(obj) {
  var str = [];
  for(var p in obj)
    if (obj.hasOwnProperty(p)) {
      str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
    }
  return str.join("&");
};

module.exports = function Saver(_attrs) {
    this.attrs = _attrs;
    this.name = _attrs.name;
    this.key = _attrs.key;
    this.description = _attrs.description;
    this.aboutUrl = _attrs.aboutUrl;
    this.author = _attrs.author;
    this.license = _attrs.license;
    this.url = _attrs.url;

    if ( typeof(_attrs.options) === "undefined" ) {
        _attrs.options = [];
    }
    this.options = _attrs.options;

    // figure out the settings from any defaults for this screensaver,
    // and combine with incoming user-specified settings
    this.settings = _attrs.options.map(function(o, i) {
        return [o.name, o.default];
    }).reduce(function(o, v, i) {
        o[v[0]] = v[1];
        return o; 
    }, {});;
    this.settings = _.merge(this.settings, _attrs.settings);
    console.log("my settings", this.settings);

    // allow for custom preview URL -- if not specified, just use the default
    if ( typeof(this.attrs.previewUrl) === "undefined" ) {
        this.previewUrl = this.url;
    }
    else {
        this.previewUrl = this.attrs.previewUrl;
    }

    /**
     * generate a preview URL with our variables tacked on
     */
    this.getPreviewUrl = function(opts) {
        return this.urlFor(this.previewUrl, opts);
    };

    /**
     * generate a URL with our variables tacked on
     */
    this.getUrl = function(opts) {
        return this.urlFor(this.url, opts);
    };

    this.urlFor = function(url, opts) {
        var joiner = "?";
        if ( typeof(opts) === "undefined" ) {
            opts = {};
        }

        console.log("urlFor", this.settings, opts);
        opts = _.merge(this.settings, opts);

        if ( url.lastIndexOf("?") !== -1 ) {
            joiner ="&";
        }

        opts = serialize(opts);
        return url + joiner + opts;
    };

};

