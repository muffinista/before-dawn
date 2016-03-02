var assert = require('assert');
var savers = require('../lib/savers.js');

describe('savers', function() {
    describe('init', function() {
        it("passes data to callback", function() {
            savers.init("/tmp", function(data) {
                assert.deepEqual([], data);
            });
        });
    });

    describe('listAll', function() {
        it("passes data to callback", function() {
            savers.init("/tmp", function() {
                savers.listAll(function(data) {
                    assert.deepEqual([], data);
                });

                savers.setLocalSources([__dirname + "/fixtures/"]);
                savers.listAll(function(data) {
                    assert.equal(1, data.length);
                });
            });
        });
    });


    describe('getByKey', function() {
        it("returns saver", function() {
            savers.init("/tmp", function() {
                savers.setLocalSources([__dirname + "/fixtures/"]);
                savers.listAll(function(data) {
                    var key =  data[0].key;
                    var s = savers.getByKey(key);
                    assert.equal("Starfield", s.name);
                });
            });
        });
    });

    describe('setCurrent', function() {
        it("sets a key", function() {
            savers.init("/tmp", function() {
                savers.setCurrent("foo");
                assert.equal("foo", savers.getCurrent());
                savers.write(function() {
                    savers.reload(function() {
                        assert.equal("foo", savers.getCurrent());
                    });
                });

            });
        });
    });


});
