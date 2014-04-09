define(
	["jquery", "knockout", "./players_editor", "./spritesheet_editor", "./layers_editor", "./model/sprite_list_item"], 
	function($, ko, PlayersEditor, SpritesheetEditor, LayersEditor, SpriteListItem){

		function EditorPanel(appl){
			this.appl = appl;
			this.template = "editor-panel";

			// selected tool
			this.tool = ko.observable('Select');

			// selected sprite
			this.editing_sprite = ko.observable();

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

			// if active sprite is null default to select tool
		    this.spritesheet_editor.active_sprite.subscribe(function(value){
		    	if(!value){
		    		this.tool('Select');
		    	}
		    	else {
		    		this.tool('Draw');
		    	}
		    }, this);

		    // if sprite list is empty default to select tool
		    this.sprite_list.subscribe(function(value){
		    	if(value.length == 0){
		    		this.tool('Select');
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

					// default to background layer
					if(this.layers_editor.selected_layer() == null) {
						this.layers_editor.selected_layer(this.layers_editor.layers()[0]);
					}
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
				this.appl.notify("Another user has saved over your changes, try again.", "warning", 4000);
			}

			this.game_sync(true);

			// add sprite list items
			if(game.state.objects) {
				this.sprite_list.removeAll();

				var i,item,items = game.state.objects;

				for (i = 0; i < items.length; i++) {
					item = items[i];

					this.sprite_list.push( new SpriteListItem(item) );
				};
			}

			this.grid_size( game.state.map.scale );
			this.map_width( game.state.map.width );
			this.map_height( game.state.map.height );

			this.spritesheet_editor.set_game(game);

			this.layers_editor.layers(game.state.layers);
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
			if(!this.game().state.objects) {
				return;
			}

			var i,item,items = this.game().state.objects;

			for (i = 0; i < items.length; i++) {
				item = items[i];

				if(item.name == name) {
					return i; 
				}
			};
		};

		EditorPanel.prototype.get_overlapping_sprite = function(x,y,width,height,layer) {
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

				if(item.overlaps(r) && item.layer() == layer) {
					return item; 
				}
			};
		};

		EditorPanel.prototype.get_sprite_clicked = function(x,y,layer) {
			var i,item,items = this.sprite_list();

			for (i = 0; i < items.length; i++) {
				item = items[i];

				if(item.contains(x,y) && item.layer() == layer) {
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

			var item = this.get_overlapping_sprite(x,y,width,height,this.layers_editor.selected_layer());

			if(!item){
				var name = 'object_'+ (new Date()).getTime();

				// create item
				item = new SpriteListItem({
					name: name,
					layer: this.layers_editor.selected_layer(),
					map_x: x,
					map_y: y,

					sheet: this.spritesheet_editor.selected_sheet().sheet(),
					offset_x: this.spritesheet_editor.active_sprite().offset_x(),
					offset_y: this.spritesheet_editor.active_sprite().offset_y(),
					width: width,
					height: height
				});

				this.sprite_list.push(item);

				// if default objects list is null on game state create the list
				if(this.game().state.objects) {
					this.game().state.objects.push(item);
				}
				else {
					this.game().state.objects = new Array();
					this.game().state.objects.push(item);
				}

				this.game_sync(false);
			}
		};

		EditorPanel.prototype.remove_sprite_list_item = function(x,y) {
			var item = this.get_sprite_clicked(x,y,this.layers_editor.selected_layer());

			if(item) {
				var index = this.get_sprite_index(item.name());
				this.game().state.objects.splice(index, 1);
				this.sprite_list.splice(index, 1);

				this.game_sync(false);
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
				this.editing_sprite( this.get_sprite_clicked(x,y,this.layers_editor.selected_layer()) );
			}
		};

		return EditorPanel;
	}
);