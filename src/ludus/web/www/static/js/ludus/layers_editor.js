define(
	["jquery", "knockout", "./model/layer"], 
	function($, ko, Layer){

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

		LayersEditor.prototype.set_game = function(data) {
			var i,item,items = data;

			this.layers.removeAll();
			for (i = 0; i < items.length; i++) {
				item = items[i];

				this.layers.push( new Layer(item) );
			};

			// default to background layer
			if(this.selected_layer() == null) {
				this.selected_layer(this.layers()[0]);
			}
			else {
				var index = this.get_layer_index( this.selected_layer().name() );

				if(index != -1) {
					this.selected_layer( this.layers()[index] );
				}
				else {
					this.selected_layer(this.layers()[0]);
				}
			}
		};

		LayersEditor.prototype.get_layer_index = function(name) {
			var i,item,items = this.layers();

			for (i = 0; i < items.length; i++) {
				item = items[i];

				if(item.name() == name) {
					return i; 
				}
			};

			return -1;		
		};

		LayersEditor.prototype.get_property_index = function(layer, name) {
			var i,item,items = layer.properties();

			for (i = 0; i < items.length; i++) {
				item = items[i];

				if(item.name == name) {
					return i; 
				}
			};

			return -1;
		};

		LayersEditor.prototype.sorted_layers = function() {
			var sorted = [];

			var i,item,items = this.layers();

			for (i = 0; i < items.length; i++) {
				item = items[i];

				sorted.push(item.name());
			};

			return sorted;
		};

		LayersEditor.prototype.create_layer = function() {
			if(this.get_layer_index( this.new_layer() ) == -1) {
				var layer = new Layer({
					name:this.new_layer()
				});

				this.layers.push( layer );
				this.editor.game().state.layers.push( layer );
				
				this.editor.save_game();
				this.selected_layer( this.layers()[this.layers().length-1] );
				this.new_layer(null);
			}
			else {
				this.appl.notify("A layer with that name already exists", "warning", 4000);
			}
		};

		LayersEditor.prototype.remove_layer = function() {
			if(this.selected_layer().name() != 'background') {
				var that = this;
				var modal = $('#delete_layer_dlog').modal();

				var delete_btn = $('#delete_layer_button').click(function() {
					// delete all sprites for this layer
					var deleted = that.editor.remove_sprites_by_layer(that.selected_layer().name());

					if(deleted) {
						var index = that.get_layer_index( that.selected_layer().name() );

						that.layers.splice(index, 1);
						that.editor.game().state.layers.splice(index, 1);

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
			this.editor.game().state.layers = this.layers();
			this.editor.save_game();
		};

		LayersEditor.prototype.show_edit = function(layer) {
			this.selected_layer(layer);

			if(this.selected_layer().name() != 'background') {
				this.edit_value(this.selected_layer().name());
				this.edit_visible(layer);
			}
		};

		LayersEditor.prototype.update_layer = function(form) {
			if(this.edit_value()) {

				if(this.edit_value() != this.selected_layer().name() && this.edit_visible().name() != 'background') {
					var index = this.get_layer_index( this.edit_value() );

					if(index == -1) {
						index = this.get_layer_index( this.edit_visible().name() );

						// create object for update
						var new_layer = new Layer({
							name: this.edit_value(),
							properties: this.layers()[index].properties()
						});

						this.editor.update_sprites_by_layer(this.layers()[index], new_layer);

						this.layers()[index].name(this.edit_value());
						this.editor.game().state.layers[index].name = this.edit_value();

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

		LayersEditor.prototype.add_layer_property = function(layer, item) {
			var index = this.get_layer_index(layer.name());

			if(index != -1) {
				var properties = layer.properties();

				properties.push(item);

				// create object to update sprite of layer change
				var new_layer = new Layer({
					name: layer.name(),
					properties: properties
				});

				this.editor.update_sprites_by_layer(this.layers()[index], new_layer);

				this.layers()[index].properties(properties);
				this.editor.game().state.layers[index].properties = properties;

				this.editor.save_game();
			}
		};

		LayersEditor.prototype.remove_layer_property = function(layer, item) {
			var index = this.get_layer_index(layer.name());

			if(index != -1) {
				var properties = layer.properties(),
					p_index = this.get_property_index(layer, item.name);

				properties.splice(p_index, 1);

				// create object to update sprite of layer change
				var new_layer = new Layer({
					name: layer.name(),
					properties: properties
				});

				this.editor.update_sprites_by_layer(this.layers()[index], new_layer);

				this.layers()[index].properties(properties);
				this.editor.game().state.layers[index].properties = properties;

				this.editor.save_game();
			}
		};

		return LayersEditor;

	}
);