define(
	["knockout"], 
	function(ko){

		function GamesPanel(appl){
			this.appl = appl;
			this.template = "games-panel";
			this.games = ko.observableArray();
			this.new_game = ko.observable();
			this.selected_game = ko.observable();
			
			this.appl.subscribe_to_broadcasts(function(msg){
				if(msg.signal == 'added_game'){
					this.games.push(msg.message);
				}
				else if(msg.signal == 'deleted_game'){
					var game = this.get_game_by_id(msg.message);

					if(game){
						if(this.selected_game() == game){
							this.selected_game(null);
						}
						this.games.remove(game);
					}
				}
				else if(msg.signal == 'added_player'){
					if(this.appl.user().id == msg.message.player.id){
						this.games.push(msg.message.game);	
					}
				}
				else if(msg.signal == 'removed_player'){
					if(this.appl.user().id == msg.message.user_id){
						var game = this.get_game_by_id(msg.message.game_id);

						if(game){
							if(this.selected_game() == game){
								this.selected_game(null);
							}
							this.games.remove(game);
						}
					}
				}
				else if(msg.signal == 'changed_role'){
					if(this.appl.user().id == msg.message.user_id){
						var game = this.get_game_by_id(msg.message.game_id)

						if(game){
							var player = this.get_player_by_id(msg.message.user_id, game)
							
							if(player){
								player.role = msg.message.role;

								var index = this.games.indexOf(game);
								this.games.splice(index, 1);
								this.games.splice(index, 0, game);

								if(this.selected_game() == game){
									this.selected_game(null);
									this.selected_game(game);
								}
							}
						}
					}
				}
			}, this);

			this.can_edit = ko.computed(this._can_edit, this);
			this.can_delete = ko.computed(this._can_delete, this);
		}

		GamesPanel.prototype.load = function() {
			this.appl.send({method:"get_games", kwargs:{owner_id:this.appl.user().id}}, function(response) {
				if(response.error) {
					this.appl.error(response.error);
				}
				else {
					this.games(response.result);
				}
			}, this);
		};

		GamesPanel.prototype.create_game = function(form_element) {
			this.appl.send({method:"add_game", kwargs:{owner_id:this.appl.user().id, name:this.new_game()}}, function(response) {
				if(response.error) {
					this.appl.error(response.error);
				}
				else {
					// game expected through broadcast
					// response contains id
					this.new_game(null);
					this.appl.edit_game(response.result);
				}
			}, this);
		};

		GamesPanel.prototype.get_game_by_id = function(id) {
			var i, item, items = this.games();

			for(i = 0; i < items.length; i++){
				item = items[i];
				if(item.id == id){
					return item;
				}
			}
		};

		GamesPanel.prototype.get_player_by_id = function(id, game) {
			var i, item, items = game.players;

			for(i = 0; i < items.length; i++){
				item = items[i];
				if(item.id == id){
					return item;
				}
			}
		};

		GamesPanel.prototype.edit_game = function() {
			this.appl.edit_game(this.selected_game().id);
		};

		GamesPanel.prototype.delete_game = function() {
			this.appl.delete_game(this.selected_game());
		};

		GamesPanel.prototype._can_edit = function() {
			if(!this.selected_game()) return;

			var player = this.get_player_by_id(this.appl.user().id, this.selected_game());

			if(player.role == 'owner' || player.role == 'builder'){
				return true;
			}

			return false;
		};

		GamesPanel.prototype._can_delete = function() {
			if(!this.selected_game()) return;

			var player = this.get_player_by_id(this.appl.user().id, this.selected_game());

			if(player.role == 'owner'){
				return true;
			}

			return false;
		};

		return GamesPanel;
	}
);