require.config({
    baseUrl: 'static',
    paths: {
        // the left side is the module ID,
        // the right side is the path relative to baseUrl.
        // Also, the path should NOT include the '.js' file extension.

        'jquery' :          'lib/bower_components/jquery/jquery',
        'bootstrap':        'lib/bower_components/bootstrap/dist/js/bootstrap',
        'bootstrap-notify': 'lib/bower_components/bootstrap-notify/js/bootstrap-notify',
        'knockout':         'lib/bower_components/knockout.js/knockout.debug',
        "crafty":           'lib/bower_components/crafty/dist/crafty',
        'domready':         'lib/bower_components/domready/ready',
        'select2':          'lib/bower_components/select2/select2'
    },
    shim: {
        "bootstrap": {
          deps: ["jquery"]
        },
        "bootstrap-notify": {
            deps: ["jquery","bootstrap"]
        },
        "select2": {
          deps: ["jquery"]
        },
    },
    packages: ["js/ludus"]
});

define(
    "main",
    
    ["jquery", "knockout", "js/ludus", "bootstrap", "domready"],

    function($, knockout, Appl){
        var appl = window.appl = new Appl();

        return appl;
    }
);