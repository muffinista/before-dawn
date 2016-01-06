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
    this.options = _attrs.options;
    this.settings = _attrs.settings;
    this.url = _attrs.url;

    // allow for custom preview URL -- if not specified, just use the default
    if ( typeof(this.attrs.previewUrl) === "undefined" ) {
        this.previewUrl = this.url;
        /**
         * 
         if ( typeof(url_params) !== "undefined" ) {
            var opts = serialize(url_params);
            this.previewUrl = this.previewUrl + "?" + opts;
        }
         */
    }
    else {
        this.previewUrl = this.attrs.previewUrl;
    }


    this.getPreviewUrl = function(opts) {
        var joiner = "?";
        if ( typeof(opts) === "undefined" ) {
            return this.previewUrl;
        }

        if ( this.previewUrl.lastIndexOf("?") !== -1 ) {
            joiner ="&";
        }

        opts = serialize(opts);
        return this.previewUrl + joiner + opts;
    };

    this.getUrl = function(opts) {
        var joiner = "?";
        if ( typeof(opts) === "undefined" ) {
            //return this.url;
            opts = {};
        }

        opts = _.merge(opts, this.settings);

        if ( this.url.lastIndexOf("?") !== -1 ) {
            joiner = "&";
        }

        opts = serialize(opts);
        return this.url + joiner + opts;
    };
};

