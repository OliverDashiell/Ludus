define(
	["jquery", "knockout"], 
	function($, ko){

		function PlayersEditor(appl, game_id_obs){
			this.appl = appl;
			this.game_id = game_id_obs;
			this.players = ko.observableArray();
			this.selected_player = ko.observable();
			this.user_lookup = ko.observable();

			this.appl.subscribe_to_broadcasts(function(msg){
				if(msg.signal == 'added_player'){
					if(this.game_id() == msg.message.game.id) {
						this.players.push(msg.message.player);
					}
				}
				else if(msg.signal == 'removed_player'){
					if(this.appl.user().id == msg.message.user_id && this.appl.panel() == this.appl.editor_panel){
						this.appl.view_games("kicked");
					}

					if(this.game_id() == msg.message.game_id) {
						var player = this.get_player_by_id(msg.message.user_id)
						if(player){
							this.players.remove(player);
							this.selected_player(null);
						}
					}
				}
				else if(msg.signal == 'changed_role'){
					if(this.appl.user().id == msg.message.user_id && this.appl.panel() == this.appl.editor_panel){
						this.appl.view_games("stop_build");
					}

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

		PlayersEditor.prototype.add_player = function(form_element) {
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

		PlayersEditor.prototype.remove_player = function(selected_player) {
			this.appl.send({method:"remove_player", kwargs:{
														game_id:this.game_id(),
														user_id:selected_player.id
														}}, function(response) {
				if(response.error) {
					this.appl.error(response.error);
				}
			}, this);
		};

		PlayersEditor.prototype.get_player_by_id = function(id) {
			var i, item, items = this.players();

			for(i = 0; i < items.length; i++){
				item = items[i];
				if(item.id == id){
					return item;
				}
			}
		};

		PlayersEditor.prototype.lookup_user = function(query) {
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

		PlayersEditor.prototype.change_role = function(role, selected_player) {
			if(selected_player.role != role){
				this.appl.send({method:"change_role", kwargs:{
														game_id:this.game_id(),
														user_id:selected_player.id,
														role:role
														}}, function(response) {
				if(response.error) {
					this.appl.error(response.error);
				}
			}, this);
			}
		};

		return PlayersEditor;

	}
);