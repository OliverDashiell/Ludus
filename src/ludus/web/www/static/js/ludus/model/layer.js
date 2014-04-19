define(
	["knockout", "knockout-mapping", "../utils"], 
	function(ko, mapping, utils){

		function Layer(options){
			this.id = ko.observable();
			this.name = ko.observable();
			this.properties = ko.observableArray();

			this.visible = ko.observable(true);

			this.update(options);
		}

		Layer.prototype.update = function(options) {
			this.id(options.id || -1);
			this.name(options.name || 'default');

			if(options.properties && options.properties.length > 0){
				mapping.fromJS(options.properties, utils.get_property_mapping_options(), this.properties);
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