({
    baseUrl: "../src/ludus/web/www/static",
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
    packages: ["js/ludus"],
    name: "js/main-debug",
    out: "../src/ludus/web/www/static/js/main.js"
})