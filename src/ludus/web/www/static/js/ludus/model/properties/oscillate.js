define(
	["jquery", "knockout"], 
	function($, ko){

		function Oscillate(options) {
			this.template = "oscillate-property";
			this.name = "Oscillate";

			this.id = ko.observable(-1);
			this.y = ko.observable(0);
            this.x = ko.observable(0);
            this.trigger = ko.observable("Start");
            this.timeout = ko.observable(100);
            this.duration = ko.observable(1000);

            this.visible = ko.observable(false);

            this.update(options);
		}

		Oscillate.prototype.update = function(options) {
			this.id(options.id || -1);
			this.y(options.y || 0);
            this.x(options.x || 0);
            this.trigger(options.trigger || "Start");
            this.timeout(options.timeout || 100);
            this.duration(options.duration || 1000);
		};

		return Oscillate;
	}
);