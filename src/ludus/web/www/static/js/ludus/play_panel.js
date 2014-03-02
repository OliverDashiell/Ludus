define(
	["jquery", "knockout", "./game_bits/game", "./game_bits/components", "./game_bits/scenes"], 
	function($, ko, Game, build_components, build_scenes){

		function PlayPanel(appl){
			this.appl = appl;
			this.template = "play-panel";
			this.user = this.appl.user;
			this.game = ko.observable();
			this.is_running = false;
		}

		PlayPanel.prototype.set_game = function(game) {
			this.game(game);
		};

		PlayPanel.prototype.hide = function() {
			if(this.is_running === true){
				Game.stop();
			}
		};

		PlayPanel.prototype.show = function() {
			var game = this.game();
			if(game){
				$.extend(Game, game.state);
				build_components();
				build_scenes();
				this.is_running = Game.start();
			}
		};

		return PlayPanel;
	}
);