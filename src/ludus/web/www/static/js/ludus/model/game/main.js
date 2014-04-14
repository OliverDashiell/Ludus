define(
	["jquery", "crafty", "./obj", "./player"], 
	function($, Crafty, Obj, Player){

		function Game(data, elem){
			var that = this;
			this.data = data;
			this.map = this.data.map

			// set up global crafty settings
			Crafty.init((this.map.width*this.map.scale) || (16*49),
						(this.map.height*this.map.scale) || (16*33), 
						elem);
			
			Crafty.background(this.data.background || '#F2F2F2');

			// Define In Play Scene
			Crafty.scene('Game', function() {

				if(that.data.objects) {
					that.objects = [];
					var i, item, items = that.data.objects;

					for (i = 0; i < items.length; i++) {
						item = items[i];

						that.objects.push(new Obj(item));
					}
				}

				this.end_game = this.bind('End Game', function(data){
		        	Crafty.scene('Game Over');
		        });

			}, 
			function() {
				this.unbind('End Game', this.end_game);
			});

			// Define End Game Scene
			Crafty.scene('Game Over', function() {

				var y = (that.map.height*that.map.scale)/2,
					w = that.map.width*that.map.scale

				Crafty.e('2D, DOM, Text')
					  .attr({ x: 0, y: y - 24, w: w })
					  .text('GAME OVER');

				Crafty.e('2D, DOM, Text')
					  .attr({ x: 0, y: y, w: w })
					  .text('- press any key to restart -');

				this.restart_game = this.bind('KeyDown', function() {
					Crafty.scene('Game');
				});

			}, 
			function() {
				this.unbind('KeyDown', this.restart_game);
			});

			// start the game
			Crafty.scene('Game');
	        Crafty.trigger('Start');
		}

		Game.prototype.stop = function(clear_state) {
			Crafty.stop(clear_state);
		};

		return Game;
	}
);