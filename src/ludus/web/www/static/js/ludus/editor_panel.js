define(
	["jquery", "knockout"], 
	function($, ko){

		function EditorPanel(appl){
			this.appl = appl;
			this.template = "editor-panel";
			this.game_id = ko.observable();
			this.game_name = ko.observable();
			this.game_state = ko.observable();
			this.players = ko.observableArray();
			this.selected_player = ko.observable();
			this.user_lookup = ko.observable();

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
				else if(msg.signal == 'added_player'){
					if(this.game_id() == msg.message.game.id) {
						this.players.push(msg.message.player);
					}
				}
				else if(msg.signal == 'removed_player'){
					// what if i've been removed??
					if(this.game_id() == msg.message.game_id) {
						var player = this.get_player_by_id(msg.message.user_id)
						if(player){
							this.players.remove(player);
							this.selected_player(null);
						}
					}
				}
				else if(msg.signal == 'changed_role'){
					// what if my role has changed??
					if(this.game_id() == msg.message.game_id) {
						var player = this.get_player_by_id(msg.message.user_id)
						if(player){
							player.role = msg.message.role;
							
							var index = this.players.indexOf(player);
							this.players.splice(index, 1);
							this.players.splice(index, 0, player);

							if(this.selected_player() == player){
								this.selected_player(null);
								this.selected_player(player);
							}
						}
					}
				}
			}, this);

			this.is_owner = ko.computed(function(){
				var i, item, items = this.players();

				for (i=0; i < items.length; i++) {
					item = items[i];
					if(item.role == 'owner' && item.id == this.appl.user().id){
						return true;
					}
				}
				return false;
			}, this);

			this.can_remove_player = ko.computed(function(){
				if(this.selected_player() && this.selected_player().role != 'owner' && this.is_owner()){
					return true;
				}
				return false;
			}, this);
		}

		EditorPanel.prototype.edit_game = function(id) {
			this.game_id(id);
			this.game_name(null);
			this.game_state(null);
			this.selected_player(null);
			this.user_lookup(null);
			this.players.removeAll();

			this.appl.send({method:"get_game", kwargs:{game_id:id}}, function(response) {
				if(response.error) {
					this.appl.error(response.error);
				}
				else {
					this.update_game(response.result);
					this.players(response.result.players);
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
				players: this.players()
			});
		};

		EditorPanel.prototype.update_game = function(game) {
			this.game_name(game.name);
			this.game_state(ko.toJSON(game.state));
		};

		EditorPanel.prototype.add_player = function(form_element) {
			this.appl.send({method:"add_player", kwargs:{
														game_id:this.game_id(),
														email:this.user_lookup()
														}}, function(response) {
				if(response.error) {
					this.appl.error(response.error);
				}
				else {
					this.user_lookup(null);
				}
			}, this);
		};

		EditorPanel.prototype.remove_player = function() {
			this.appl.send({method:"remove_player", kwargs:{
														game_id:this.game_id(),
														user_id:this.selected_player().id
														}}, function(response) {
				if(response.error) {
					this.appl.error(response.error);
				}
			}, this);
		};

		EditorPanel.prototype.get_player_by_id = function(id) {
			var i, item, items = this.players();

			for(i = 0; i < items.length; i++){
				item = items[i];
				if(item.id == id){
					return item;
				}
			}
		};

		EditorPanel.prototype.lookup_user = function(query) {
			this.appl.send({method:"lookup_user", kwargs:{
														name:query.term
														}}, function(response) {
				if(response.error) {
					this.appl.error(response.error);
				}
				else{
					query.callback({results:response.result});
				}
			}, this);
		};

		EditorPanel.prototype.change_role = function(role) {
			if(this.selected_player().role != role){
				this.appl.send({method:"change_role", kwargs:{
														game_id:this.game_id(),
														user_id:this.selected_player().id,
														role:role
														}}, function(response) {
				if(response.error) {
					this.appl.error(response.error);
				}
			}, this);
			}
		};

		return EditorPanel;
	}
);