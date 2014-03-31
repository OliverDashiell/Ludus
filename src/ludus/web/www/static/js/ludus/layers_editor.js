define(
	["jquery", "knockout"], 
	function($, ko){

		function SpritesheetEditor(appl){
			this.appl = appl;
			this.layers = ko.observable();
			this.selected_layer = ko.observable();
			this.edit_layers = ko.observableArray();
		}

		SpritesheetEditor.prototype.rollback_layers = function() {
			
		};

		return SpritesheetEditor;

	}
);