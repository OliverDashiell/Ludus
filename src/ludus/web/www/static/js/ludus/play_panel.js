define(
	["jquery", "knockout", "./model/game/main"], 
	function($, ko, Game){

		function PlayPanel(appl){
			this.appl = appl;
			this.template = "play-panel";
			this.user = this.appl.user;
			this.game = ko.observable();
			this.preview = null;
			this.is_running = false;
		}

		PlayPanel.prototype.set_game = function(game) {
			this.game(game);
		};

		PlayPanel.prototype.hide = function() {
			if(this.is_running === true) {
				this.stop();
			}
		};

		PlayPanel.prototype.show = function() {
			if(this.is_running === true) {
				this.stop();
			}	

			this.start();
		};

		PlayPanel.prototype.start = function() {
			var game = this.game();
			if(game){
				this.preview = new Game(this.game().state, $('#cr-stage')[0]);
				this.is_running = true;
			}
		};

		PlayPanel.prototype.stop = function() {
			if(this.is_running === true) {
				this.preview.stop(false);
				$("#cr-stage").remove();
				$("#game-panel").append('<div id="cr-stage" class="center-block"></div>');
			}
		};

		PlayPanel.prototype.restart = function() {
			this.stop();
			this.start();
		};

		PlayPanel.prototype.edit_game = function() {
			this.stop();
			this.appl.edit_game(this.game().id);
		};

		return PlayPanel;
	}
);