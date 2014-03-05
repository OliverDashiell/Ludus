define(
	["jquery", "crafty", "./brick", "./floor"], 
	function($, Crafty, Brick, Floor){

		function Game(data, elem){
			var that = this;
			this.data = data;

			Crafty.init(this.data.width || 100,
						this.data.height || 100, 
						elem);
			
			Crafty.background(this.data.background || '#B7F46E');

			this.floors = [];
			var i, item, items = this.data.floors;

			for (i = 0; i < items.length; i++) {
				item = items[i];

				this.floors.push(new Floor(item));
			}

	        this.brick = new Brick(this.data.brick);

	        Crafty.trigger('start');
		}

		Game.prototype.stop = function(clear_state) {
			Crafty.stop(clear_state);
		};
		
		return Game;
	}
);