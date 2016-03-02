var assert = require('assert');
var Saver = require('../lib/saver.js');

describe('Saver', function() {
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
