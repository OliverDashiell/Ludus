define(
	["knockout"], 
	function(ko){

		function UserPanel(appl){
			this.appl = appl;
			this.template = "user-panel";
			this.games = ko.observableArray();
		}

		UserPanel.prototype.load = function() {
			this.appl.ws.send({method:"get_games", kwargs:{owner_id:this.appl.user().id}}, function(response) {
				if(response.error) {
					this.appl.error(response.error);
				}
				else {
					this.games(response.result);
				}
			}, this);
		};

		return UserPanel;
	}
);