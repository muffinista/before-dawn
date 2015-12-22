$ = jQuery = require('../bower_components/jquery/dist/jquery.min.js');

$(document).ready(function() {
    var remote = require('remote');
    var savers = require('../savers.js');

    // we set the path to our data files/etc in the main app, and retreive it here
    var basePath = remote.getGlobal('basePath');
    savers.init(basePath);

    var loadPreview = function(key) {
        var s = savers.getByKey(key);
        console.log("SAVER: " + key + " -> " + s.url);
        var iframe = $("<iframe scrolling='no' frameborder='0' />");
        $("#preview").html(iframe);
        var url_opts = {
            width: $("#preview").width(),
            height: $("#preview").height(),
            preview: 1
        };
        $(iframe).attr("src", s.getPreviewUrl(url_opts));

        var tpl = Handlebars.compile(document.getElementById("preview-details-template").innerHTML);
        var output = tpl(s);
        $("#details").html(output);
    };

    var closeWindow = function() {
        var window = remote.getCurrentWindow();
        window.close();
    };

    var renderList = function() {
        savers.listAll(function(entries) {
            var tpl = Handlebars.compile(document.getElementById("entry-template").innerHTML);
            var output = tpl(entries);

            var current = savers.getCurrent();
            console.log("current selection", current);

            $("#savers").html(output);
            
            $("input[name=screensaver][value='" + current + "']").attr("checked", "checked");
            loadPreview(current);
        });
    };

    $("body").on("change", "input[name=screensaver]", function() {
        var val = $("input[name=screensaver]:checked").val();
        loadPreview(val);
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
        var updater = require('screeny-shared/updater.js');
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
