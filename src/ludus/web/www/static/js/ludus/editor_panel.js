define(
	["jquery", "knockout", "./players_editor", "./spritesheet_editor"], 
	function($, ko, PlayersEditor, SpritesheetEditor){

		function EditorPanel(appl){
			this.appl = appl;
			this.template = "editor-panel";
			this.game_id = ko.observable();
			this.game_name = ko.observable();
			this.game_state = ko.observable();
			this.players_editor = new PlayersEditor(appl, this.game_id);
			this.spritesheet_editor = new SpritesheetEditor(appl);

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
			this.game_name(null);
			this.game_state(null);
			this.players_editor.selected_player(null);
			this.players_editor.user_lookup(null);
			this.players_editor.players.removeAll();

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
			var state = $.parseJSON(this.game_state());

			this.appl.send({method:"save_game", kwargs:{
														game_id:this.game_id(),
														name:this.game_name(),
														state:state,
														}}, function(response) {
				if(response.error) {
					this.appl.error(response.error);
				}
			}, this);
		};

		EditorPanel.prototype.play_game = function() {
			this.appl.play({
				id: this.game_id(),
				name: this.game_name(),
				state: $.parseJSON(this.game_state()),
				players: this.players_editor.players()
			});
		};

		EditorPanel.prototype.update_game = function(game) {
			this.game_name(game.name);
			this.game_state(ko.toJSON(game.state));
		};

		return EditorPanel;
	}
);