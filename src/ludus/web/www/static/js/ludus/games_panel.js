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
			}, this);
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

		GamesPanel.prototype.edit_game = function() {
			this.appl.edit_game(this.selected_game().id);
		};

		GamesPanel.prototype.delete_game = function() {
			this.appl.delete_game(this.selected_game());
		};

		return GamesPanel;
	}
);