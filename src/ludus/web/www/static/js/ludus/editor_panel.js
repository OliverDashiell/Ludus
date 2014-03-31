define(
	["jquery", "knockout", "./players_editor", "./spritesheet_editor", "./layers_editor"], 
	function($, ko, PlayersEditor, SpritesheetEditor, LayersEditor){

		function EditorPanel(appl){
			this.appl = appl;
			this.template = "editor-panel";
			this.game = ko.observable();
			this.game_id = ko.observable();
			this.sprite_list = ko.observableArray();
			this.grid_size = ko.observable(16);
			this.players_editor = new PlayersEditor(appl, this.game_id);
			this.spritesheet_editor = new SpritesheetEditor(appl, this);
			this.layers_editor = new LayersEditor(appl);

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

					if(this.spritesheet_editor.selected_sheet() == null) {
						if(this.spritesheet_editor.spritesheets()[0]) {
							this.spritesheet_editor.selected_sheet(this.spritesheet_editor.spritesheets()[0]);
						}
						else if(this.spritesheet_editor.tiles()[0]) {
							this.spritesheet_editor.selected_sheet(this.spritesheet_editor.tiles()[0]);
						}
					}
				}
			}, this);
		};

		EditorPanel.prototype.save_game = function() {
			this.appl.send({method:"save_game", kwargs:{
														game_id:this.game_id(),
														name:this.game_name(),
														state:this.game().state,
														}}, function(response) {
				if(response.error) {
					this.appl.error(response.error);
				}
			}, this);
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

			if(game.state.sheets == undefined){
				game.state.sheets = {spritesheets:[],tiles:[]}; // init with empty lists
			}

			this.spritesheet_editor.spritesheets(game.state.sheets.spritesheets);
			this.spritesheet_editor.tiles(game.state.sheets.tiles);
		};

		EditorPanel.prototype.add_spritesheet = function(name) {
			this.game().state.sheets.spritesheets.push(name);
			this.save_game();
		};

		EditorPanel.prototype.add_tile = function(name) {
			this.game().state.sheets.tiles.push(name);
			this.save_game();
		};

		return EditorPanel;
	}
);