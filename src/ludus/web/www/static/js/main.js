require.config({baseUrl:"static",paths:{jquery:"lib/bower_components/jquery/jquery",bootstrap:"lib/bower_components/bootstrap/dist/js/bootstrap",knockout:"lib/bower_components/knockout.js/knockout.debug",domready:"lib/bower_components/domready/ready"},shim:{bootstrap:{deps:["jquery"]}},packages:["js/ludus"]}),define("main",["jquery","knockout","js/ludus","bootstrap","domready"],function(e,t,n){var r=window.appl=new n;return r}),define("js/main-debug",function(){});