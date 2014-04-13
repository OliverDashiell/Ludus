define(
	["jquery", "crafty", "./obj", "./player"], 
	function($, Crafty, Obj, Player){

		function Game(data, elem){
			var that = this;
			this.data = data;
			this.map = this.data.map

			Crafty.init((this.map.width*this.map.scale) || (16*49),
						(this.map.height*this.map.scale) || (16*33), 
						elem);
			
			Crafty.background(this.data.background || '#F2F2F2');

			if(this.data.objects) {
				this.objects = [];
				var i, item, items = this.data.objects;

				for (i = 0; i < items.length; i++) {
					item = items[i];

					this.objects.push(new Obj(item));
				}
			}

	        // this.player = new Player(this.data.player);

	        Crafty.trigger('start');
		}

		Game.prototype.stop = function(clear_state) {
			Crafty.stop(clear_state);
		};

		return Game;
	}
);