define(
	["jquery", "knockout"], 
	function($, ko){

		function SpritesheetEditor(appl){
			this.appl = appl;
			this.game_id = ko.observable();
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

		SpritesheetEditor.prototype.add_player = function(form_element) {
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

		SpritesheetEditor.prototype.remove_player = function() {
			this.appl.send({method:"remove_player", kwargs:{
														game_id:this.game_id(),
														user_id:this.selected_player().id
														}}, function(response) {
				if(response.error) {
					this.appl.error(response.error);
				}
			}, this);
		};

		SpritesheetEditor.prototype.get_player_by_id = function(id) {
			var i, item, items = this.players();

			for(i = 0; i < items.length; i++){
				item = items[i];
				if(item.id == id){
					return item;
				}
			}
		};

		SpritesheetEditor.prototype.lookup_user = function(query) {
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

		SpritesheetEditor.prototype.change_role = function(role) {
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

		return SpritesheetEditor;

	}
);