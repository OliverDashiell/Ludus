require.config({
    baseUrl: 'static',
    paths: {
        // the left side is the module ID,
        // the right side is the path relative to baseUrl.
        // Also, the path should NOT include the '.js' file extension.

        'jquery':               'lib/bower_components/jquery/dist/jquery',
        'jquery-ui':            'lib/bower_components/jquery-ui/ui/jquery-ui',
        'jquery.ui.sortable':   'lib/bower_components/jquery-ui/ui/jquery.ui.sortable',
        'touch-punch':          'lib/bower_components/jquery-ui-touch-punch-amd/jquery.ui.touch-punch',
        'bootstrap':            'lib/bower_components/bootstrap/dist/js/bootstrap',
        'bootstrap-notify':     'lib/bower_components/bootstrap-notify/js/bootstrap-notify',
        'knockout':             'lib/bower_components/knockout.js/knockout.debug',
        'knockout-mapping':     'lib/bower_components/knockout-mapping/knockout.mapping',
        'knockout-sortable':    'lib/bower_components/knockout-sortable/build/knockout-sortable',
        'crafty':               'lib/bower_components/crafty/dist/crafty',
        'domready':             'lib/bower_components/domready/ready',
        'select2':              'lib/bower_components/select2/select2',
        'jquery-form':          'lib/bower_components/jquery-form/jquery.form'
    },
    shim: {
        "bootstrap": {
            deps: ["jquery-ui"]
        },
        "bootstrap-notify": {
            deps: ["bootstrap"]
        },
        "select2": {
            deps: ["jquery"]
        },
        "jquery-form": {
            deps: ["jquery"]
        },
        "jquery-ui": {
            deps: ["jquery"]
        },
        "touch-punch": {
            deps: ["jquery-ui"]
        },
        "jquery.ui.sortable": {
            deps: ["jquery-ui"]
        },
        "knockout": {
            exports: "ko"
        },
        "knockout-mapping": {
            deps: ["knockout"]
        },
        "knockout-sortable": {
            deps: ["jquery.ui.sortable", "knockout"]
        },
    },
    packages: ["js/ludus"]
});

define(
    "main",
    
    ["jquery", "knockout", "js/ludus", "bootstrap", "knockout-sortable", "domready"],

    function($, ko, Appl){
        var appl = window.appl = new Appl();

        return appl;
    }
);