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
			this.selected_layer( this.layers()[this.layers().length-1] );
			this.new_layer(null);
		};

		LayersEditor.prototype.remove_layer = function() {
			if(this.selected_layer() != 'background') {
				var that = this;
				var modal = $('#delete_layer_dlog').modal();

				var delete_btn = $('#delete_layer_button').click(function() {
					// delete all sprites for this layer
					var deleted = that.editor.remove_sprites_by_layer(that.selected_layer());

					if(deleted) {
						var index = that.layers.indexOf( that.selected_layer() );

						that.layers.splice(index, 1);

						that.editor.save_game();
						that.selected_layer( that.layers()[0] );
					}
					else {
						that.appl.notify("One or more of the sprites on this layer could not be deleted, try again.", "error", 4000);
					}

					modal.modal('hide');
				});

				modal.modal('show');

				// must remove event handlers so that closures can be garbage collected
				modal.on('hidden.bs.modal', function(e) {
					modal.off('hidden.bs.modal');
					delete_btn.off('click');
				});
			}
		};

		LayersEditor.prototype.layer_moved = function(data) {
			this.editor.sort_by_layer(this.editor.game().state.objects);
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
			if(this.edit_value()) {

				if(this.edit_value() != this.selected_layer() && this.edit_visible() != 'background') {
					var index = this.layers.indexOf( this.edit_value() );

					if(index == -1) {
						index = this.layers.indexOf( this.edit_visible() );

						this.layers()[index] = this.edit_value();
						this.editor.save_game();
						this.selected_layer( this.layers()[index] );
					}
					else {
						this.appl.notify("A layer with that name already exists", "warning", 4000);
					}
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