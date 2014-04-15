define(
	["knockout"], 
	function(ko){

		function Layer(options){
			this.name = ko.observable();
			this.properties = ko.observableArray();

			this.update(options);
		}

		Layer.prototype.update = function(options) {
			this.name(options.name || 'default');

			this.properties.removeAll();
			if(options.properties) {
				var i,item,items = options.properties;

				for (i = 0; i < items.length; i++) {
					item = items[i];

					this.properties.push(item);
				}
			}
		};

		Layer.prototype.serialise = function() {
			return {
				name: this.name(),
				properties: this.properties()
			};
		};

		return Layer;
	}
);