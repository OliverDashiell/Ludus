define(
	["jquery", "knockout"], 
	function($, ko){

		function Collector(options) {
			this.template = "collector-property";
			this.name = "Collector";

			this.id = ko.observable(-1);
			this.to_collect = ko.observable(1);
			this.on_finish = ko.observable("End Game");

            this.visible = ko.observable(false);

            this.update(options);
		}

		Collector.prototype.update = function(options) {
			this.id(options.id || -1);
			this.to_collect = ko.observable(options.to_collect || 1);
			this.on_finish = ko.observable(options.on_finish || "End Game");
		};

		return Collector;
	}
);