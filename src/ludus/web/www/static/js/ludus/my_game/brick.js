define(
	["jquery", "crafty"], 
	function($, Crafty){

		function Brick(data){
			var that = this;
			this.data = data;

	        this.e = Crafty.e('Brick, 2D, DOM, Color, Fourway')
	                          .attr({x: 0, y: 0, w: this.data.w, h: this.data.h})
	                          .color(this.data.color)
	                          .fourway(this.data.speed);

	        if(this.data.types){
	        	var i, item, items = this.data.types;

				for (i = 0; i < items.length; i++) {
					item = items[i];

					that.e.addComponent(item);
		    	}
	    	}

	    	if(this.data.sprite){
	    		this.load_sprite(data.sprite);
	    	}

	        if(data.bounce_on){
	        	this.bounce_on(this.data.bounce_on);
	        }

	        if(data.stop_on){
	        	this.stop_on(this.data.stop_on);
	        }

	        if(this.data.on_hit){
	        	this.add_collision_bindings(this.data.on_hit);
	        }
		}

		Brick.prototype.load_sprite = function(sprite) {
			var _sprite = {};
			_sprite[sprite.name] = sprite.loc;

			Crafty.sprite(sprite.url, _sprite);
			this.e.addComponent(sprite.name);
		};

		Brick.prototype.add_collision_bindings = function(bindings) {
			this.e.addComponent('Collision');
			var i, item, items = bindings;

			for (i = 0; i < items.length; i++) {
				item = items[i];

	        	if(typeof this[item.action] === 'function'){
	        		var t, target, targets = item.targets;

					for (t = 0; t < targets.length; t++) {
						target = targets[i];

						this.e.onHit(target, function(hit_list){
							
						});

						this[item.action].apply(this, item.args);
					}
	        	}
	        	else {
	        		// exception - bad config
	        	}
        	}
		};

		Brick.prototype.bounce_on = function(what) {
			this.e.addComponent('Gravity');
			var i, item, items = what;

			for (i = 0; i < items.length; i++) {
				item = items[i];

				this.e.gravity(item);
			}
		};

		Brick.prototype.stop_on = function(what) {
			this.e.addComponent('Collision');

			this.e.onHit(what, function(hit_list){
				this._speed = 0;
		        if (this._movement) {
		            this.x -= this._movement.x;
		            this.y -= this._movement.y;
		        }
			});
		};

		Brick.prototype.set_color = function(what) {
			this.e.addComponent('Color');

			this.e.color(what);
		};
		
		return Brick;
	}
);