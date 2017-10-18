'use strict';

const assert = require('assert');
const Saver = require('../../app/lib/saver.js');
const _ = require('lodash');
const tmp = require('tmp');
const path = require('path');
const fs = require('fs');


describe('Saver', function() {
  const testName = "Test Screensaver";
  const testDescription = "It's a screensaver, but for testing";

  const attrs = {
    "name": testName,
    "description": testDescription,
    "aboutUrl": "",
    "author": "Colin Mitchell",
    "source": "index.html",
    "requirements": [],
    "options": [
      {
        "index": 0,
        "name": "New Option I Guess",
        "type": "text",
        "description": "Description",
        "min": "1",
        "max": "100",
        "default": "50"
      },
      {
        "index": 1,
        "name": "New Option",
        "type": "slider",
        "description": "Description",
        "min": "1",
        "max": "100",
        "default": "75"
      }
    ],
    "editable": true
  };

  var loadSaver = function(opts) {
    if ( typeof(opts) === "undefined" ) {
      opts = {};
    }

    var vals = _.merge({}, attrs, opts);
    return new Saver(vals);
  };
  
	describe('initialization', function() {
    it('loads data', function() {
      var s = loadSaver();
			assert.equal(testName, s.name);
			assert.equal(testDescription, s.description);      
		});
    
    it('loads options', function() {
      var s = loadSaver();
			assert.equal(testName, s.name);
      assert.equal(2, s.options.length);
    });
    
    it('is published by default', function() {
      var s = loadSaver();
			assert.equal(testName, s.name);
      assert(s.published);
    });
    
    it('is not valid if not published', function() {
      var s = loadSaver({published: false});
      assert(!s.valid);
    });

    it('has default settings', function() {
      var s = loadSaver();
      assert.equal('75', s.settings['New Option']);
      assert.equal('50', s.settings['New Option I Guess']);      
    });

    it('merges user settings', function() {
      var s = loadSaver({settings: []});
      assert.equal('75', s.settings['New Option']);
      assert.equal('50', s.settings['New Option I Guess']);      
    });

    it('loads local previewUrl', function() {
      var s = loadSaver({path: "path", previewUrl:"preview.html"});
      assert.equal('path/preview.html', s.previewUrl);
    });
  });

  describe('getUrl', function() {
    it('handles no opts', function() {
      var s = loadSaver({url:'index.html'});
      assert.equal('index.html?New%20Option%20I%20Guess=50&New%20Option=75', s.getUrl());
    });

    it('handles opts', function() {
      var s = loadSaver({url:'index.html'});
      assert.equal('index.html?New%20Option%20I%20Guess=50&New%20Option=75&foo=bar', s.getUrl({foo: 'bar'}));
    });

    it('handles urls with queries', function() {
      var s = loadSaver({url:'index.html?baz=boo'});
      assert.equal('index.html?baz=boo&New%20Option%20I%20Guess=50&New%20Option=75&foo=bar', s.getUrl({foo: 'bar'}));
    });
  });
  
  describe('getRequirements', function() {
    it('defaults to empty', function() {
      var s = loadSaver();
      assert.deepEqual([], s.getRequirements());
    });

    it('reads from incoming params', function() {
      var s = loadSaver({requirements:['stuff']});
      assert.deepEqual(['stuff'], s.getRequirements());
    });
  });

  describe('getPreviewUrl', function() {
    it('returns a preview url');
    it('uses custom url');    
  });
  
  describe('toHash', function() {
    it('should return attributes', function() {
      var s = loadSaver();
      assert.deepEqual(attrs, s.toHash());
    });
  });
  
  describe('write', function() {
    it('should write some output', function() {
      var dest = tmp.fileSync().name;
      var s = loadSaver();
      s.attrs.name = "New Name To Write";
      
      s.write(s.toHash(), dest);

      var data = JSON.parse(fs.readFileSync(dest));
      s = new Saver(data);
      assert.equal("New Name To Write", s.name);
    });

    it('should work without a dest', function() {
      var p = tmp.dirSync().name;
      var dest = path.join(p, "saver.json");

      var s = loadSaver({path: p});
      s.attrs.name = "New Name To Write";
      
      s.write(s.toHash());

      
      var data = JSON.parse(fs.readFileSync(dest));
      s = new Saver(data);
      assert.equal("New Name To Write", s.name);
    });
  });

  describe('published', function() {
    it("defaults to true", function() {
      var s = new Saver({
        path:""
      });
      assert.equal(true, s.published);
    });

    it("accepts incoming value", function() {
      var s = new Saver({
        path:"",
        published: false
      });
      assert.equal(false, s.published);
    });
  });

  describe('valid', function() {
    it("false without data", function() {
      var s = new Saver({
        path:""
      });
      assert.equal(false, s.valid);
    });

    it("false without name", function() {
      var s = new Saver({
        description:"description",
        path:""
      });
      assert.equal(false, s.valid);
    });

    it("false without description", function() {
      var s = new Saver({
        name:"name",
        path:""
      });
      assert.equal(false, s.valid);
    });

    it("false if not published", function() {
      var s = new Saver({
        name:"name",
        description:"description",
        published:false,
        path:""
      });
      assert.equal(false, s.valid);
    });

    it("true if published with name and description", function() {
      var s = new Saver({
        name:"name",
        description:"description",
        path:""
      });
      assert.equal(true, s.valid);
    });

  });

  describe('settings', function() {
    it("defaults to empty", function() {
      var s = new Saver({
        name:"name",
        description:"description",
        path:""
      });
      assert.deepEqual({}, s.settings);
    });

    it("accepts incoming options", function() {
      var s = new Saver({
        name:"name",
        description:"description",
        path:"",
        options: [
          {
            "name": "density",
            "type": "slider",
            "description": "how dense?",
            "min": "1",
            "max": "100",
            "default": "75"
          }
        ]
      });
      assert.deepEqual({density:"75"}, s.settings);
    });

    it("accepts incoming options and user settings", function() {
      var s = new Saver({
        name:"name",
        description:"description",
        path:"",
        options: [
          {
            "name": "density",
            "type": "slider",
            "description": "how dense?",
            "min": "1",
            "max": "100",
            "default": "75"
          }
        ],
        settings: {
          density:"100",
          other:"hello"
        }
      });
      assert.deepEqual({density:"100", other:"hello"}, s.settings);
    });
  });

  describe('getPreviewUrl', function() {
    it("uses previewUrl if provided", function() {
      var s = new Saver({
        name:"name",
        description:"description",
        previewUrl:"http://google.com/",
        path:""
      });

      assert.equal("http://google.com/?foo=bar", s.getPreviewUrl({foo:"bar"}));
    });

    it("uses url if no previewUrl", function() {
      var s = new Saver({
        name:"name",
        description:"description",
        url:"http://yahoo.com/",
        path:""
      });

      assert.equal("http://yahoo.com/?foo=bar", s.getPreviewUrl({foo:"bar"}));
      
    });
  });

  describe('getUrl', function() {
    it("uses url", function() {
      var s = new Saver({
        name:"name",
        description:"description",
        url:"http://yahoo.com/",
        path:""
      });

      assert.equal("http://yahoo.com/?foo=bar", s.getUrl({foo:"bar"}));
    });
  });
});
