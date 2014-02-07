require.config({
    baseUrl: 'static',
    paths: {
        // the left side is the module ID,
        // the right side is the path relative to baseUrl.
        // Also, the path should NOT include the '.js' file extension.

        'jquery' :    'lib/bower_components/jquery/jquery',
        'bootstrap':  'lib/bower_components/bootstrap/dist/js/bootstrap',
        'knockout':   'lib/bower_components/knockout.js/knockout.debug',
        'domready':   'lib/bower_components/domready/ready'
    },
    shim: {
        "bootstrap": {
          deps: ["jquery"]
        }
    },
    packages: ["js/ludus"]
});

define(
    "main",
    
    ["jquery", "knockout", "js/ludus", "bootstrap", "domready"],

    function(jquery, knockout, Appl){
        var appl = window.appl = new Appl();

        return appl;
    }
);