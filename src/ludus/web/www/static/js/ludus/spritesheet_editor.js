define(
	["jquery", "knockout"], 
	function($, ko){

		function SpritesheetEditor(appl){
			this.appl = appl;
			this.title = "foo";
			this.selected_sheet = ko.observable();
			this.selected_sprite = ko.observable();
		}

		return SpritesheetEditor;

	}
);