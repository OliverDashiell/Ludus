define(
	["jquery", "knockout", "./model/layer"], 
	function($, ko, Layer){

		function LayersEditor(appl, editor){
			this.appl = appl;
			this.editor = editor;


			//---- Game Layer Variables ----//
			this.id_seed = ko.observable(-1);			// current document id seed
			this.layers = ko.observableArray();			// list holding all current layers

			this.selected_layer = ko.observable(null);	// the current user selected layer

			this.new_layer = ko.observable(null);		// the value of the new layer input
			this.edit_visible = ko.observable(null);	// the layer being edited
			this.edit_value = ko.observable(null);		// the user edit name input value


			//---- Subscriptions ----//
			this.selected_layer.subscribe(function() {
				if(this.selected_layer() != this.edit_visible()){
					this.edit_value(null);
					this.edit_visible(null);
				}
			}, this);
		}

		LayersEditor.prototype._init_ = function() {
			this.id_seed(-1);
			this.layers.removeAll();
			this.selected_layer(null);
			this.new_layer(null);
			this.edit_visible(null);
			this.edit_value(null);
		};

		LayersEditor.prototype.get_mapping_options = function() {
			return {
				key: function(data) {
		            return ko.utils.unwrapObservable(data.id);
		        },
		        create: function(options){
		        	return new Layer(options.data);
		        }
			};
		};

		LayersEditor.prototype.get_seed_id = function() {
			var seed = this.id_seed();

			// increment the seed
			this.id_seed( seed+1 );

			return seed;
		};

		LayersEditor.prototype.update = function(data, seed) {
			this.layers(data);
			this.id_seed = seed;

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

		LayersEditor.prototype.show_hide_layer = function(layer) {
			var visible = true;

			// toggle visibility
			if(layer.visible()) {
				visible = false;
			}

			// get layer index
			index = this.get_layer_index( layer.name() );

			// create object for update
			var new_layer = new Layer({
				id: this.layers()[index].id(),
				name: this.layers()[index].name(),
				properties: this.layers()[index].properties()
			});

			new_layer.visible(visible);

			// update sprite list layers
			this.editor.update_sprites_by_layer(this.layers()[index], new_layer);

			this.layers()[index].visible(visible);
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
				var seed = this.get_seed_id();

				var layer = new Layer({
					id:seed,
					name:this.new_layer()
				});

				this.layers.push( layer );
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
			this.editor.sort_by_layer(this.editor.game().state.objects());
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
							id:this.layers()[index].id(),
							name: this.edit_value(),
							properties: this.layers()[index].properties()
						});

						// update sprite list layers
						this.editor.update_sprites_by_layer(this.layers()[index], new_layer);

						this.layers()[index].name(this.edit_value());
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
				this.layers()[index].properties.push(item);

				// create object to update sprite of layer change
				var new_layer = new Layer({
					id: layer.id(),
					name: layer.name(),
					properties: this.layers()[index].properties()
				});

				// update sprite list layers
				this.editor.update_sprites_by_layer(this.layers()[index], new_layer);

				this.editor.save_game();
			}
		};

		LayersEditor.prototype.remove_layer_property = function(layer, item) {
			var index = this.get_layer_index(layer.name());

			if(index != -1) {
				var p_index = this.get_property_index(layer, item.name);

				this.layers()[index].properties.splice(p_index, 1);

				// create object to update sprite of layer change
				var new_layer = new Layer({
					id: layer.id(),
					name: layer.name(),
					properties: properties
				});

				// update sprite list layers
				this.editor.update_sprites_by_layer(this.layers()[index], new_layer);

				this.editor.save_game();
			}
		};

		return LayersEditor;

	}
);