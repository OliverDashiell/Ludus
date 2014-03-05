define(
	["jquery", "crafty"], 
	function($, Crafty){

		function Floor(data){
			var that = this;
			this.data = data;

			this.e = Crafty.e('2D, DOM, Color')
	                       .attr({x: data.x, y: data.y, w: data.w, h: data.h})
	                       .color(data.color);

	        if(this.data.types){
	        	var i, item, items = this.data.types;

				for (i = 0; i < items.length; i++) {
					item = items[i];

					that.e.addComponent(item);
		    	}
	    	}

	        if(data.move_to){
	        	this.e.addComponent('Tween');
	        	Crafty.bind(data.move_to.trigger, $.proxy(this.move_to, this));
	        }

	        if(data.oscillate){
	        	this.e.addComponent('Tween');
	        	Crafty.bind(data.oscillate.trigger, $.proxy(this.oscillate, this));
	        }

	        this.e._doTween = function(props, v){
				for (var name in props){
					if(name == 'x'){
						that.e._dx = that.e.x;

						that.e[name] = (1-v) * that.e.tweenStart[name] + v * props[name];

						that.e._dx -= that.e.x;
					}
					else if(name == 'y'){
						that.e._dy = that.e.y;

						that.e[name] = (1-v) * that.e.tweenStart[name] + v * props[name];

						that.e._dy -= that.e.y;
					}
					else {
						that.e[name] = (1-v) * that.e.tweenStart[name] + v * props[name];
					}
				}

			};
		}

		Floor.prototype.move_to = function() {
			this.e.tween({x:this.data.move_to.x, y:this.data.move_to.y}, this.data.move_to.ms);
		};

		Floor.prototype.oscillate = function() {
			if(this.e.x == this.data.x){
				this.e.tween({x:this.data.oscillate.x, y:this.data.oscillate.y}, this.data.oscillate.ms);
			} 
			else {
				this.e.tween({x:this.data.x, y:this.data.y}, this.data.oscillate.ms);
			}

			setTimeout($.proxy(this.oscillate, this),
			 		   this.data.oscillate.ms + this.data.oscillate.timeout);
		};
		
		return Floor;
	}
);