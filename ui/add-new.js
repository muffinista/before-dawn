$ = jQuery = require('./bower_components/jquery/dist/jquery.min.js');

$(document).ready(function() {
    var remote = require('remote');
    var updater = require('screeny-shared/updater.js');

    var basePath = remote.getGlobal('basePath');
    updater.init(basePath);

    var closeWindow = function() {
        var window = remote.getCurrentWindow();
        window.close();
    };

    $("a.cancel").on("click", function(e) {
        closeWindow();
    });

    $("button").on("click", function(e) {
        var key = $("input[name=key]").val();
        var url = $("input[name=url]").val();
        
        updater.addFromUrl(url, key);
        closeWindow();
    });

});
