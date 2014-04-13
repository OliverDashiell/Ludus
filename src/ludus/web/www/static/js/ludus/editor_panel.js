define(
	["jquery", "knockout", "./players_editor", "./spritesheet_editor", "./layers_editor", "./properties_editor", "./model/sprite_list_item"], 
	function($, ko, PlayersEditor, SpritesheetEditor, LayersEditor, PropertiesEditor, SpriteListItem){

		function EditorPanel(appl){
			this.appl = appl;
			this.template = "editor-panel";

			// selected tool
			this.tool = ko.observable('Select');

			// selected sprite
			this.editing_sprite = ko.observable(null);

			// sprite name editing
			this.edit_name_visible = ko.observable(null);
			this.edit_name_value = ko.observable(null);

			// game state
			this.game = ko.observable();
			this.game_id = ko.observable();
			this.game_sync = ko.observable();

			// sprites
			this.sprite_list = ko.observableArray();
			
			// grid variables
			this.grid_size = ko.observable(16);
			this.map_width = ko.observable(48);
			this.map_height = ko.observable(33);
			this.show_mapgrid = ko.observable(true);

			// panels
			this.players_editor = new PlayersEditor(appl, this.game_id);
			this.spritesheet_editor = new SpritesheetEditor(appl, this);
			this.layers_editor = new LayersEditor(appl, this);
			this.properties_editor = new PropertiesEditor(appl, this);

			this.game_name = ko.computed({
		        read: function () {
		        	if(this.game()) {
		        		return this.game().name;
		        	}
		        	return 'no name';
		        },
		        write: function (value) {
		            if (this.game()) { 
		            	this.game().name = value;
		            }
		        },
		        owner: this
		    });

			this.game_state = ko.computed({
		        read: function () {
		        	if(this.game()) {
		        		return ko.toJSON(this.game().state, null, 4);
		        	}
		        	return '{}';
		        },
		        write: function (value) {
		            if (this.game()) { 
		            	this.game().state = $.parseJSON(value);
		            }
		        },
		        owner: this
		    });

		    this.editing_sprite.subscribe(function() {
				if(this.editing_sprite() != this.edit_name_visible()){
					this.edit_name_value(null);
					this.edit_name_visible(null);
				}
			}, this);

			this.sprite_list.subscribe(function() {
				if(this.editing_sprite() && this.get_sprite_index( this.editing_sprite().name() ) == -1){
					this.editing_sprite(null);
				}
			}, this);

			// if active sprite is null default to select tool
		    this.spritesheet_editor.active_sprite.subscribe(function(value){
		    	if(!value){
		    		if(this.tool() == 'Draw' || this.tool() == 'Fill'){
		    			this.tool('Select');
		    		}
		    	}
		    }, this);

		    this.grid_size.subscribe(function(value){
		    	this.game().state.map.scale = parseInt(value);
		    	this.save_game();
		    }, this);

			this.map_width.subscribe(function(value){
				this.game().state.map.width = parseInt(value);
				this.save_game();
			}, this);

			this.map_height.subscribe(function(value){
				this.game().state.map.height = parseInt(value);
				this.save_game();
			}, this);

			this.appl.subscribe_to_broadcasts(function(msg){
				if(msg.signal == 'deleted_game'){
					if(this.game_id() == msg.message){
						this.appl.close_editor();
					}
				}
				else if(msg.signal == 'saved_game'){
					if(this.game_id() == msg.message.id) {
						this.update_game(msg.message);
					}
				}
			}, this);
		}

		EditorPanel.prototype.edit_game = function(id) {
			this.game_id(id);
			this.game(null);
			this.game_sync(true);

			this.sprite_list.removeAll();
			this.editing_sprite(null);

			this.players_editor.selected_player(null);
			this.players_editor.user_lookup(null);
			this.players_editor.players.removeAll();

			this.spritesheet_editor.selected_sheet(null);
			this.spritesheet_editor.selected_sprite(null);

			this.appl.send({method:"get_game", kwargs:{game_id:id}}, function(response) {
				if(response.error) {
					this.appl.error(response.error);
				}
				else {
					this.update_game(response.result);
					this.players_editor.players(response.result.players);
				}
			}, this);
		};

		EditorPanel.prototype.save_game = function() {
			this.game_sync(true);

			this.appl.send({method:"save_game", kwargs:{
														game_id:this.game_id(),
														name:this.game_name(),
														state:this.game().state,
														}}, 
				function(response) {
					if(response.error) {
						this.appl.error(response.error);
					}
				}, this
			);
		};

		EditorPanel.prototype.play_game = function() {
			this.appl.play({
				id: this.game_id(),
				name: this.game().name,
				state: this.game().state,
				players: this.players_editor.players()
			});
		};

		EditorPanel.prototype.update_game = function(game) {
			this.game(game);

			if(this.game_sync() == false) {
				// alert user - game desyncronised updating with other user changes
				this.appl.notify("Another user has saved over your changes, try again.", "error", 4000);
			}

			this.game_sync(true);

			// add sprite list items
			if(game.state.objects) {
				this.sprite_list.removeAll();

				var i,item,items = game.state.objects;

				for (i = 0; i < items.length; i++) {
					item = items[i];

					var sprite = new SpriteListItem(item);

					this.sprite_list.push(sprite);

					if(this.editing_sprite() && sprite.name() == this.editing_sprite().name()) {
						this.editing_sprite(sprite);
					}
				};
			}

			this.grid_size( game.state.map.scale );
			this.map_width( game.state.map.width );
			this.map_height( game.state.map.height );

			this.spritesheet_editor.set_game(game);

			this.layers_editor.set_game(game.state.layers);
		};

		EditorPanel.prototype.update_sprite_name = function(form) {
			if(this.edit_name_value()) {

				if(this.edit_name_value() != this.editing_sprite().name()) {
					var index = this.get_sprite_index( this.edit_name_value() );

					if(index == -1) {
						index = this.get_sprite_index( this.edit_name_visible().name() );

						this.game().state.objects[index].name = this.edit_name_value();
						this.save_game();

						this.sprite_list()[index].name( this.edit_name_value() );
						this.editing_sprite( this.sprite_list()[index] );
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
					var l_index = layers_list.indexOf(ko.unwrap(l.layer.name));
			        var r_index = layers_list.indexOf(ko.unwrap(r.layer.name));
			        
			        return l_index - r_index;
				});
			}
		};

		EditorPanel.prototype.get_sheet_by_name = function(name) { 
			var i,item,items = this.game().state.sheets.spritesheets;

			for (i = 0; i < items.length; i++) {
				item = items[i];

				if(item.sheet == name) {
					return item; 
				}
			};

			i,item,items = this.game().state.sheets.tiles;

			for (i = 0; i < items.length; i++) {
				item = items[i];

				if(item.sheet == name) {
					return item; 
				}
			};
		};

		EditorPanel.prototype.get_sprite_index = function(name) {
			if(!this.game() || !this.game().state.objects) {
				return -1;
			}

			var i,item,items = this.game().state.objects;

			for (i = 0; i < items.length; i++) {
				item = items[i];

				if(item.name == name) {
					return i; 
				}
			};

			return -1;
		};

		EditorPanel.prototype.remove_sprite_by_index = function(index) {
			if(index != -1 && index < this.game().state.objects.length) {
				this.game().state.objects.splice(index, 1);
				this.sprite_list.splice(index, 1);

				return true;
			}
			return false;
		};

		EditorPanel.prototype.remove_sprites_by_layer = function(layer) {
			var deleted = true;

			if(this.game().state.objects) {
				var i,item,items = this.game().state.objects;

				for (i = items.length-1; i > -1; i--) {
					item = items[i];

					if(item.layer.name() == layer) {
						deleted = this.remove_sprite_by_index(i);

						if(!deleted) {
							// roll back
							this.game().state.objects = items;
							return deleted;
						}
					}
				};
			}

			return deleted;
		};

		EditorPanel.prototype.get_overlapping_sprite = function(x,y,width,height,layer,name) {
			var i,item,items = this.sprite_list();

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
			var i,item,items = this.sprite_list();

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
				var name = 'object_'+ x + y + this.layers_editor.selected_layer().name();

				var item_layer = {
					name: this.layers_editor.selected_layer().name(),
					properties: this.layers_editor.selected_layer().properties()
				}

				// create item
				item = new SpriteListItem({
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

				this.sprite_list.push(item);
				this.sort_by_layer(this.sprite_list);

				// if default objects list is null on game state create the list
				if(this.game().state.objects) {
					this.game().state.objects.push(item);
					this.sort_by_layer(this.game().state.objects);
				}
				else {
					this.game().state.objects = new Array();
					this.game().state.objects.push(item);
				}

				this.game_sync(false);
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

				var item = this.get_overlapping_sprite(x,y,width,height,layer.name(), name);

				if(!item){
					var index = this.get_sprite_index(name);

					if(index != -1) {
						// update name if user has not changed it to keep it unique
						var name_check = new RegExp('^object_');

						if(name_check.test(name)) {
							name = 'object_'+ x + y + layer.name();

							this.game().state.objects[index].name = name;
							this.sprite_list()[index].name(name);
						}

						// update x and y coords of object
						this.game().state.objects[index].map_x = x;
						this.game().state.objects[index].map_y = y;

						this.sprite_list()[index].map_x(x);
						this.sprite_list()[index].map_y(y);

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