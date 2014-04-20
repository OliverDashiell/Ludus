define(
	["jquery", "knockout", "knockout-mapping",
	 "./players_editor", "./spritesheet_editor", "./layers_editor", "./properties_editor", "./model/sprite_list_item"], 
	function($, ko, mapping, PlayersEditor, SpritesheetEditor, LayersEditor, PropertiesEditor, SpriteListItem){

		function EditorPanel(appl){
			this.appl = appl;
			this.template = "editor-panel";


			//---- Game State Variables ----//
			this.game = ko.observable(null);				// view model (ko.mapping)
			this.game_raw = null;							// raw data
			this.game_sync = ko.observable(false);			// changes flag
			this.game_state = ko.observable(null);			// raw panel game state
			

			//---- Map Panel Variables ----//
			this.show_mapgrid = ko.observable(true);		// map grid visible flag
			this.tool = ko.observable('Select'); 			// selected tool
			this.editing_sprite = ko.observable(null);		// selected sprite
			this.edit_name_visible = ko.observable(null); 	// sprite name editing
			this.edit_name_value = ko.observable(null);		// input value


			//---- Sub panels ----//
			this.players_editor = new PlayersEditor(appl, this);
			this.spritesheet_editor = new SpritesheetEditor(appl, this);
			this.layers_editor = new LayersEditor(appl, this);
			this.properties_editor = new PropertiesEditor(appl, this);


			//---- Computed Values ----//
			this.game_name = ko.computed({
		        read: function () {
		        	if( this.game() ) {
		        		return this.game().name();
		        	}
		        	return 'no name';
		        },
		        write: function (value) {
		            if ( this.game() ) { 
		            	this.game().name(value);
		            }
		        },
		        owner: this,
		        deferEvaluation: true
		    });

			this.grid_size = ko.computed({
				read: function () {
		        	if( this.game() ) {
		        		return this.game().state.map.scale();
		        	}
		        	return 16;
		        },
		        write: function (value) {
		            if ( this.game() ) { 
		            	this.game().state.map.scale( parseInt(value) );
		            	this.save_game();
		            }
		        },
		        owner: this,
		        deferEvaluation: true
		    });

			this.map_width = ko.computed({
				read: function () {
		        	if( this.game() ) {
		        		return this.game().state.map.width();
		        	}
		        	return 49;
		        },
		        write: function (value) {
		            if ( this.game() ) { 
		            	this.game().state.map.width( parseInt(value) );
		            	this.save_game();
		            }
		        },
		        owner: this,
		        deferEvaluation: true
		    });

			this.map_height = ko.computed({
				read: function () {
		        	if( this.game() ) {
		        		return this.game().state.map.height();
		        	}
		        	return 33;
		        },
		        write: function (value) {
		            if ( this.game() ) { 
		            	this.game().state.map.height( parseInt(value) );
		            	this.save_game();
		            }
		        },
		        owner: this,
		        deferEvaluation: true
		    });


			//---- Subscriptions ----//
		    this.editing_sprite.subscribe(function() {
				if(this.editing_sprite() != this.edit_name_visible()){
					this.edit_name_value(null);
					this.edit_name_visible(null);
				}
			}, this);

		    this.spritesheet_editor.active_sprite.subscribe(function(value){
		    	// if active sprite is null default to select tool
		    	if(!value){
		    		if(this.tool() == 'Draw' || this.tool() == 'Fill'){
		    			this.tool('Select');
		    		}
		    	}
		    }, this);

		    this.tool.subscribe(function() {
		    	// switch cursor icon
		    	if(this.tool() == 'Erase'){
	    			$('#map').css({
						cursor: 'url(static/images/erase_cur.png),url(static/images/erase_cur.cur),pointer'
					});
	    		}
	    		else if(this.tool() == 'Draw'){
	    			$('#map').css({
						cursor: 'url(static/images/draw_cur.cur),url(static/images/draw_cur.png),pointer'
					});
	    		}
	    		else {
	    			$('#map').css({
						cursor: 'url(static/images/select_cur.cur),url(static/images/select_cur.png),pointer'
					});
	    		}
		    }, this);


		    //---- Websocket broadcast handling ----//
			this.appl.subscribe_to_broadcasts(function(msg){
				if(msg.signal == 'deleted_game'){
					if(this.game() && this.game().id() == msg.message){
						this.appl.close_editor();
					}
				}
				else if(msg.signal == 'saved_game'){
					if(this.game() && this.game().id() == msg.message.id) {
						this.update_game(msg.message);
					}
				}
			}, this);
		}

		EditorPanel.prototype.get_mapping_options = function() {
			var player_mapping = this.players_editor.get_mapping_options(),
				layers_mapping = this.layers_editor.get_mapping_options(),
				sheets_mapping = this.spritesheet_editor.get_sheet_mapping_options(),
				sprite_mapping = this.spritesheet_editor.get_sprite_mapping_options(),
				property_mapping = this.properties_editor.get_mapping_options();

			var object_mapping = {
				key: function(data) {
		            return ko.utils.unwrapObservable(data.id);
		        },
		        create:function(options){
		        	return new SpriteListItem(options.data);
		        }
			}

			var mapping = {
			    key: function(data) {
		            return ko.utils.unwrapObservable(data.id);
		        },
		        'players': player_mapping,
		        'layers': layers_mapping,
		        'layer': layers_mapping,
		        'spritesheets': sheets_mapping,
		        'tiles': sheets_mapping,
		        'sprite_items': sprite_mapping,
		        'objects': object_mapping,
		        'properties': property_mapping,
		        'ignore': ["image", "visible", "template"]
			};

			return mapping;
		};

		EditorPanel.prototype.edit_game = function(id) {
			// clear editor state
			this.game(null);
			this.game_raw = null;
			this.game_sync(true);

			this.show_mapgrid(true);
			this.tool('Select');
			this.editing_sprite(null);
			this.edit_name_visible(null);
			this.edit_name_value(null);

			// clear sub panel state
			this.players_editor._init_();
			this.spritesheet_editor._init_();
			this.layers_editor._init_();
			this.properties_editor._init_();

			// request game info from server
			this.appl.send({method:"get_game", kwargs:{game_id:id}}, function(response) {
				if(response.error) {
					this.appl.error(response.error);
				}
				else {
					// apply view model mapping
					this.game( mapping.fromJS(response.result, this.get_mapping_options()) );

					// update views
					this.update_game(response.result);
				}
			}, this);
		};

		EditorPanel.prototype.update_game = function(game) {
			// if game update comes in before changes have been saved
			if(this.game_sync() == false) {
				// alert user - game desyncronised updating with other user changes
				this.appl.notify("Another user has saved over your changes, try again.", "error", 4000);
			}
			this.game_sync(true);

			// update raw
			this.game_raw = game;

			// update raw panel observable
			// this.game_state( ko.toJSON(this.game_raw.state, null, 4) );

			// update mapping
			mapping.fromJS(game, this.get_mapping_options(), this.game());

			// update players view with new data
			this.players_editor.players( this.game().players() );

			// update layers view with new data
			this.layers_editor.update( this.game().state.layers(), this.game().state.layers_seed );

			// update sprite sheet view with new data
			this.spritesheet_editor.update( this.game().state.sheets, this.game().state.sheets_seed );

			// update property view with new data
			this.properties_editor.id_seed = this.game().state.properties_seed;

			if( this.editing_sprite() && !this.get_sprite_by_name( this.editing_sprite().name() ) ){
				this.editing_sprite(null);
			}
		};

		EditorPanel.prototype.save_game = function() {
			this.game_sync(true);

			this.game_raw = mapping.toJS( this.game() );

			this.appl.send(
				{
					method:"save_game", 
					kwargs:{
						game_id:this.game().id(),
						name:this.game_name(),
						state:this.game_raw.state,
					}
				}, 
				function(response) {
					if(response.error) {
						this.appl.error(response.error);
					}
				}, this
			);
		};

		EditorPanel.prototype.play_game = function() {
			this.appl.play(mapping.toJS( this.game() ));
		};

		EditorPanel.prototype.show_name_edit = function(obj) {
			this.editing_sprite(obj);
			this.edit_name_visible(obj);
			this.edit_name_value(obj.name());
		};

		EditorPanel.prototype.mapgrid_show_hide = function() {
			var btn = $('#show_mapgrid_btn');

			if(btn.hasClass('active')) {
				this.show_mapgrid(false);
				btn.removeClass('active');
				btn.addClass('btn-custom-inactive');
			}
			else {
				this.show_mapgrid(true);
				btn.removeClass('btn-custom-inactive');
				btn.addClass('active');
			}

			// remove focus
			btn.blur();

			return true;
		};

		EditorPanel.prototype.show_property_editor = function() {
			$('#editor-tabs-right a[href="#properties"]').tab('show') // Show the properties tab
		};

		EditorPanel.prototype.get_object_seed_id = function() {
			var seed = this.game().state.objects_seed();

			// increment the seed
			this.game().state.objects_seed( seed+1 );

			return seed;
		};

		EditorPanel.prototype.snap_to_grid_width = function(val){
		    var snap_size = this.grid_size();
		    var max = this.map_width()*this.grid_size();

		    var snap = snap_size * Math.floor(val/snap_size);
		    if (snap >= snap_size) {
		        return Math.min(snap, max);
		    }
		    else {
		        return 0;
		    }
		};

		EditorPanel.prototype.snap_to_grid_height = function(val){
		    var snap_size = this.grid_size();
		    var max = this.map_height()*this.grid_size();

		    var snap = snap_size * Math.floor(val/snap_size);
		    if (snap >= snap_size) {
		        return Math.min(snap, max);
		    }
		    else {
		        return 0;
		    }
		};

		EditorPanel.prototype.sort_by_layer = function(list){
			if(list) {
				var layers_list = this.layers_editor.sorted_layers();

				list.sort(function(l,r) {
					var l_index = layers_list.indexOf( ko.unwrap( ko.unwrap(l.layer).name) );
			        var r_index = layers_list.indexOf( ko.unwrap( ko.unwrap(r.layer).name) );
			        
			        return l_index - r_index;
				});
			}
		};

		EditorPanel.prototype.get_sprite_index = function(name) {
			if(!this.game() || !this.game().state.objects()) {
				return -1;
			}

			var i,item,items = this.game().state.objects();

			for (i = 0; i < items.length; i++) {
				item = items[i];

				if(item.name() == name) {
					return i; 
				}
			};

			return -1;
		};

		EditorPanel.prototype.get_sprite_by_name = function(name) {
			if(!this.game() || !this.game().state.objects()) {
				return null;
			}

			var i,item,items = this.game().state.objects();

			for (i = 0; i < items.length; i++) {
				item = items[i];

				if(item.name() == name) {
					return item; 
				}
			};

			return null;
		};

		EditorPanel.prototype.remove_sprite_by_index = function(index) {
			if(index != -1 && index < this.game().state.objects().length) {
				this.game().state.objects.splice(index, 1);
				return true;
			}
			return false;
		};

		EditorPanel.prototype.remove_sprites_by_layer = function(layer) {
			var deleted = true;
			var removed = [];

			var i,item,items = this.game().state.objects();

			for (i = items.length-1; i > -1; i--) {
				item = items[i];

				if(item.layer().name() == layer) {
					deleted = this.remove_sprite_by_index(i);

					if(!deleted) {
						// roll back
						var j,rollback_item,rollback_items = removed;

						for (j = rollback_items.length-1; j > -1; j--) { 
							rollback_item = rollback_items[i];

							this.game().state.objects.push(rollback_item);
							this.sort_by_layer( this.game().state.objects );
						}

						return deleted;
					}
					else {
						removed.push(item);
					}
				}
			};

			return deleted;
		};

		EditorPanel.prototype.update_sprites_by_layer = function(orig_layer, new_layer) {
			var i,item,items = this.game().state.objects();

			for (i = items.length-1; i > -1; i--) {
				item = items[i];

				if(item.layer().name() == orig_layer.name()) {
					item.layer().name( new_layer.name() );
					item.layer().properties( new_layer.properties() );

					// update name if user has not changed it to keep it unique
					var name_check = new RegExp('^object_');

					if(name_check.test( item.name() )) {
						var name = 'object_'+ item.map_x() + item.map_y() + new_layer.name();

						item.name(name);
					}

					if(!new_layer.visible()){
						item.layer().visible(false);

						// if item is selected, deselect as it will become hidden
						if(this.editing_sprite() && item.name() == this.editing_sprite().name()){
							this.editing_sprite(null);
						}
					}
					else {
						item.layer().visible(true);
					}
				}
			};
		};

		EditorPanel.prototype.add_layer_property = function(layer, item) {
			// pass through to funtion on layers editor
			this.layers_editor.add_layer_property(layer, item);
		};

		EditorPanel.prototype.update_layer_property = function(layer, item) {
			// pass through to funtion on layers editor
			this.layers_editor.update_layer_property(layer, item);
		};

		EditorPanel.prototype.remove_layer_property = function(layer, item) {
			// pass through to funtion on layers editor
			this.layers_editor.remove_layer_property(layer, item);
		};

		EditorPanel.prototype.get_overlapping_sprite = function(x,y,width,height,layer,name) {
			var i,item,items = this.game().state.objects();

			for (i = 0; i < items.length; i++) {
				item = items[i];

				// inset by border to prevent false result with bordering squares
				var r = {
					top: y+1,
					left: x+1,
					bottom: y+height-1,
					right: x+width-1
				};

				if(item.overlaps(r) && item.layer().name() == layer) {
					// ignore yourself in list
					if(name && item.name() == name) {
						continue;
					}
					
					return item;
				}
			};
		};

		EditorPanel.prototype.get_sprite_clicked = function(x,y,layer) {
			var i,item,items = this.game().state.objects();

			for (i = 0; i < items.length; i++) {
				item = items[i];

				if(item.contains(x,y) && item.layer().name() == layer) {
					return item; 
				}
			};
		};

		EditorPanel.prototype.add_sprite_list_item = function(x,y) {
			//check for item already on this layer
			var width = this.spritesheet_editor.active_sprite().width(),
				height = this.spritesheet_editor.active_sprite().height();

			// snap x and y to grid
			x = this.snap_to_grid_width(x);
			y = this.snap_to_grid_height(y);

			// x and y adjustments to snap within grid bounds
			if(x+width > this.grid_size()*this.map_width()) {
				x = this.grid_size()*this.map_width() - width;
			}
			if(y+height > this.grid_size()*this.map_height()) {
				y = this.grid_size()*this.map_height() - height;
			}

			var item = this.get_overlapping_sprite(x,y,width,height,this.layers_editor.selected_layer().name());

			if(!item){
				var seed = this.get_object_seed_id();

				var name = 'object_'+ x + y + this.layers_editor.selected_layer().name();

				var item_layer = {
					id: this.layers_editor.selected_layer().id(),
					name: this.layers_editor.selected_layer().name(),
					properties: this.layers_editor.selected_layer().properties()
				}

				// create item
				item = new SpriteListItem({
					id: seed,
					name: name,
					layer: item_layer,
					map_x: x,
					map_y: y,

					sheet: this.spritesheet_editor.selected_sheet().sheet(),
					offset_x: this.spritesheet_editor.active_sprite().offset_x(),
					offset_y: this.spritesheet_editor.active_sprite().offset_y(),
					width: width,
					height: height
				});

				this.game().state.objects.push(item);
				this.sort_by_layer(this.game().state.objects);

				this.game_sync(false);
			}
		};

		EditorPanel.prototype.update_sprite_name = function(form) {
			if(this.edit_name_value()) {

				if(this.edit_name_value() != this.editing_sprite().name()) {
					var index = this.get_sprite_index( this.edit_name_value() );

					if(index == -1) {
						index = this.get_sprite_index( this.edit_name_visible().name() );

						this.game().state.objects()[index].name( this.edit_name_value() );
						this.save_game();
					}
					else {
						this.appl.notify("A object with that name already exists", "warning", 4000);
					}
				}

			}
			else {
				this.appl.notify("Cannot change object name to nothing", "warning", 4000);
			}
			
			this.edit_name_value(null);
			this.edit_name_visible(null);
		};

		EditorPanel.prototype.remove_selected_sprite = function() {
			if(this.editing_sprite()) {
				var index = this.get_sprite_index( this.editing_sprite().name() );

				var deleted = this.remove_sprite_by_index( index );

				if(deleted) {
					this.save_game();
					this.editing_sprite(null);
				}
			}
		};

		EditorPanel.prototype.move_sprite_list_item = function(x,y) {
			if(this.editing_sprite()) {
				//check for item already on this layer
				var width = this.editing_sprite().width(),
					height = this.editing_sprite().height(),
					layer = this.editing_sprite().layer(),
					name = this.editing_sprite().name();

				// snap x and y to grid
				x = this.snap_to_grid_width(x);
				y = this.snap_to_grid_height(y);

				// x and y adjustments to snap within grid bounds
				if(x+width > this.grid_size()*this.map_width()) {
					x = this.grid_size()*this.map_width() - width;
				}
				if(y+height > this.grid_size()*this.map_height()) {
					y = this.grid_size()*this.map_height() - height;
				}

				var item = this.get_overlapping_sprite(x,y,width,height,layer.name(),name);

				if(!item){
					var index = this.get_sprite_index(name);

					if(index != -1) {
						// update name if user has not changed it to keep it unique
						var name_check = new RegExp('^object_');

						if(name_check.test(name)) {
							name = 'object_'+ x + y + layer.name();

							this.game().state.objects()[index].name(name);
						}

						// update x and y coords of object
						this.game().state.objects()[index].map_x(x);
						this.game().state.objects()[index].map_y(y);

						this.game_sync(false);
					}
				}
			}
		};

		EditorPanel.prototype.remove_sprite_list_item = function(x,y) {
			var item = this.get_sprite_clicked(x,y,this.layers_editor.selected_layer().name());

			if(item) {
				var index = this.get_sprite_index(item.name());

				var deleted = this.remove_sprite_by_index(index);

				if(deleted) {
					this.game_sync(false);
				}
			}
		};

		EditorPanel.prototype.do_action = function(data, evt) {
			// get map
			var map = $('#map');

			// offset click
			var x = evt.pageX - map.offset().left,
				y = evt.pageY - map.offset().top;
			
			if(this.tool() == 'Draw') {
				if(evt.type == 'mouseup'){
					if(this.game_sync() === false) {
						this.save_game();
					}
				} else {
					this.add_sprite_list_item(x,y);
				}
			}
			else if(this.tool() == 'Erase') {
				if(evt.type == 'mouseup'){
					if(this.game_sync() === false) {
						this.save_game();
					}
				} else {
					this.remove_sprite_list_item(x,y);
				}
			}
			else if(this.tool() == 'Select') {
				if(evt.type == 'mousedown'){
					this.editing_sprite( this.get_sprite_clicked(x,y,this.layers_editor.selected_layer().name()) );
				}
				else if(evt.type == 'mousemove') {
					this.move_sprite_list_item(x,y);
				}
				else {
					if(this.game_sync() === false) {
						this.save_game();
					}
				}
			}
		};

		return EditorPanel;
	}
);