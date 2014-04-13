define(
	["jquery", "crafty"], 
	function($, Crafty){

		function Obj(data){
			var that = this;
			this.data = data;

			var loc = {};
			loc[data.name] = [data.offset_x, data.offset_y, data.width, data.height];

			this.sprite = Crafty.sprite("/uploads/"+data.sheet, loc);

			this.e = Crafty.e('2D, DOM, '+ data.layer +', '+ data.name).attr({
				x: data.map_x, 
				y: data.map_y, 
				w: data.width, 
				h: data.height
			});

	        if(this.data.properties){
	        	var i, item, items = this.data.properties;

				for (i = 0; i < items.length; i++) {
					item = items[i];

					this.e.addComponent(item.name);

					if(item.name == 'Gravity') {
						this.e.gravity('Solid');
					}

					if(item.name == 'Twoway') {
						this.e.twoway(item.move_speed || 3, 
									  item.jump_speed || 3);
					}

					if(item.name == 'Fourway') {
						this.e.fourway(item.move_speed || 3);
					}

					if(item.name == 'Move To'){
			        	this.e.addComponent('Tween');
			        	Crafty.bind(item.trigger, $.proxy(this.move_to, this, item));
			        }

					if(item.name == 'Oscillate') {
						this.e.addComponent('Tween');
	        			Crafty.bind(item.trigger, $.proxy(this.oscillate, this, item));
					}
		    	}
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

		Obj.prototype.move_to = function(item) {
			this.e.tween({x:item.x, y:item.y}, item.duration);
		};

		Obj.prototype.oscillate = function(item) {
			var move_x = this.data.map_x + item.x,
				move_y = this.data.map_y + item.y;

			if(this.e.x == this.data.map_x && this.e.y == this.data.map_y){
				this.e.tween({x:move_x, y:move_y}, item.duration);
			} 
			else {
				this.e.tween({x:this.data.map_x, y:this.data.map_y}, item.duration);
			}

			setTimeout($.proxy(this.oscillate, this, item), item.duration + item.timeout);
		};
		
		return Obj;
	}
);