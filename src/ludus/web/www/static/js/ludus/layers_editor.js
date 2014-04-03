define(
	["jquery", "knockout"], 
	function($, ko){

		function LayersEditor(appl, editor){
			this.appl = appl;
			this.editor = editor;
			this.layers = ko.observableArray();
			this.selected_layer = ko.observable();
			this.new_layer = ko.observable(null);

			this.edit_visible = ko.observable(null);
			this.edit_value = ko.observable(null);

			this.selected_layer.subscribe(function() {
				if(this.selected_layer() != this.edit_visible()){
					this.edit_value(null);
					this.edit_visible(null);
				}
			}, this);
		}	

		LayersEditor.prototype.create_layer = function() {
			this.layers.push( this.new_layer() );
			
			this.editor.save_game();
			this.new_layer(null);
		};

		LayersEditor.prototype.remove_layer = function() {
			if(this.selected_layer() != 'background') {
				var index = this.layers.indexOf( this.selected_layer() );

				this.layers.splice(index, 1);

				this.editor.save_game();
				this.selected_layer( this.layers()[0] );
			}
		};

		LayersEditor.prototype.layer_moved = function(data) {
			this.editor.save_game();
		};

		LayersEditor.prototype.show_edit = function(name) {
			this.selected_layer(name);

			if(this.selected_layer() != 'background') {
				this.edit_value(name);
				this.edit_visible(name);
			}
		};

		LayersEditor.prototype.update_layer = function(form) {
			if(this.edit_value() && this.edit_visible() != 'background') {
				var index = this.layers.indexOf( this.edit_value() );

				if(index == -1) {
					index = this.layers.indexOf( this.edit_visible() );

					this.layers()[index] = this.edit_value();
					this.editor.save_game();
				}
				else {
					this.appl.notify("A layer with that name already exists", "warning", 4000);
				}
			}
			else {
				this.appl.notify("Cannot change layer name to nothing", "warning", 4000);
			}
			
			this.edit_value(null);
			this.edit_visible(null);
		};

		return LayersEditor;

	}
);