/**
 * simple class for a screen saver
 */


// we will generate a list of requirements that screensavers need
// to work. for now, it's just a screengrab. to maintain
// compatability, we'll generate a default list if one isn't
// specified    
const DEFAULT_REQUIREMENTS = ["screen"];

/**
 * take a hash and turn it into a URL string
 * @see http://stackoverflow.com/questions/1714786/querystring-encoding-of-a-javascript-object
 */
var serialize = function(obj) {
  var str = [];
  for(var p in obj) {
    if (obj.hasOwnProperty(p)) {
      str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
    }
  }
  return str.join("&");
};

const _path = require("path");
const fs = require("fs");


module.exports = function Saver(_attrs) {
  this.UNWRITABLE_KEYS = ["key", "path", "url", "settings", "editable"];

  this.attrs = _attrs;
  this.path = _attrs.path;
  this.name = _attrs.name;
  this.key = _attrs.key;
  this.description = _attrs.description;
  this.aboutUrl = _attrs.aboutUrl;
  this.author = _attrs.author;
  this.license = _attrs.license;
  this.preload = _attrs.preload;
  this.requirements = _attrs.requirements || DEFAULT_REQUIREMENTS;

  // allow for a specified URL -- this way you could create a screensaver
  // that pointed to a remote URL
  this.url = _attrs.url;
  if ( typeof(this.url) === "undefined" && 
    _attrs.path !== undefined  && 
    _attrs.source !== undefined) {
    this.url = "file://" + _path.join(_attrs.path, _attrs.source);
  }

  // keep track of our main saver.json file
  this.src = _attrs.src;
  if ( typeof(this.src) === "undefined" && typeof(this.key) !== "undefined" ) {
    this.src = _path.join(_path.dirname(this.key), "saver.json");
  }
  
  this.published = _attrs.published;
  if ( typeof(this.published) === "undefined" ) {
    this.published = true;
  }

  // provide a default editable value (this will
  // be set when loading to determine if the user
  // can edit this screensaver or not)
  this.editable = _attrs.editable;
  if ( typeof(this.editable) === "undefined" ) {
    this.editable = false;
  }

  this.valid = typeof(this.name) !== "undefined" &&
               typeof(this.description) !== "undefined" &&
               this.published === true;

  if ( typeof(_attrs.options) === "undefined" ) {
    _attrs.options = [];
  }
  this.options = _attrs.options;

  if ( this.valid === true ) {
    // figure out the settings from any defaults for this screensaver,
    // and combine with incoming user-specified settings
    this.settings = _attrs.options.map(function(o) {
      return [o.name, o.default];
    }).reduce(function(o, v) {
      o[v[0]] = v[1];
      return o; 
    }, {});
    this.settings = Object.assign({}, this.settings, _attrs.settings);
    
    // allow for custom preview URL -- if not specified, just use the default
    // if it is specified, do some checks to see if it's a full URL or a filename
    // in which case we will turn it into a full path
    if ( typeof(this.attrs.previewUrl) === "undefined" ) {
      this.previewUrl = this.url;
    }
    else if ( this.attrs.previewUrl.match(/:\/\//) ) {
      this.previewUrl = this.attrs.previewUrl;
    }
    else {
      this.previewUrl = this.path + "/" + this.attrs.previewUrl;
    }
  } // if valid

  this.getRequirements = function() {
    return this.requirements;
  };
  
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
    
    opts = Object.assign({}, this.settings, opts);
    
    if ( url.lastIndexOf("?") !== -1 ) {
      joiner = "&";
    }

    opts = serialize(opts);
    return url + joiner + opts;
  };
  
  this.toHash = function() {
    return this.attrs;   
  };

  // write a new set of attributes for this saver to its JSON file
  this.write = function(attrs, configDest) {
    if ( typeof(configDest) === "undefined" ) {
      configDest = _path.join(this.path, "saver.json");
    }

    for ( var i = 0 ; i < this.UNWRITABLE_KEYS.length; i++ ) {
      delete(attrs[this.UNWRITABLE_KEYS[i]]);
    }

    var output = JSON.stringify(attrs, null, 2);
    fs.writeFileSync(configDest, output);
  };
};

