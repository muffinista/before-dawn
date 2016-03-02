var assert = require('assert');
var main = require('../main.js');

describe('prefs', function() {
    it("does stuff", function() {
        main.bootApp(__dirname + "/fixtures/");
        main.openPrefsWindow();
    });
});
