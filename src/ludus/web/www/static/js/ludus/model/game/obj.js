define(
	["jquery", "crafty"], 
	function($, Crafty){

		function Obj(data, scale){
			var that = this;
			this.data = data;
			this.scale = scale;
			this.name = this.data.name;

			var loc = {};
			loc[data.name] = [data.offset_x, data.offset_y, data.width, data.height];

			this.sprite = Crafty.sprite("/uploads/"+data.sheet, loc);

			this.e = Crafty.e('2D, DOM, '+ data.layer +', '+ data.name).attr({
				x: data.map_x, 
				y: data.map_y, 
				w: data.width, 
				h: data.height
			});

			this.add_properties(this.data.layer.properties);

	        if(this.data.properties){
	        	this.add_properties(this.data.properties);
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

		Obj.prototype.add_properties = function(list) {
			var that = this;
			var i, item, items = list;

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

				if(item.name == 'Collector') {
					this.collectables = [];
					var trigger = item.on_finish;

					this.collect_binding = Crafty.bind('item_collected', function(collectable){
						that.collectables.push(collectable.name);

						if(that.collectables.length >= item.to_collect){
							that.collectables = [];
							Crafty.unbind('item_collected', that.collect_binding);
							Crafty.trigger(trigger, that);
						}
					});

					Crafty.bind('Start', function(){
						that.collectables = [];
					});
				}

				if(item.name == 'Stop On') {
		        	this.stop_on(item.what);
		        }

				if(item.name == 'Move To') {
		        	this.e.addComponent('Tween');
		        	Crafty.bind(item.trigger, $.proxy(this.move_to, this, item));
		        }

				if(item.name == 'Oscillate') {
					this.e.addComponent('Tween');
        			Crafty.bind(item.trigger, $.proxy(this.oscillate, this, item));
				}

				if(item.name == 'Collectable') {
					this.collectable_by(item.who);
				}
	    	}
		};

		Obj.prototype.stop_on = function(what) {
			this.e.addComponent('Collision');

			var i, item, items = what;

			for (i = 0; i < items.length; i++) {
				item = items[i];

				this.e.onHit(item, function(hit_list){
					this._speed = 0;

			        if (this._movement) {
			            this.x -= this._movement.x;
			            this.y -= this._movement.y;
			        }
				});
			};
		};

		Obj.prototype.move_to = function(item) {
			this.e.tween({x:item.x, y:item.y}, item.duration);
		};

		Obj.prototype.oscillate = function(item) {
			var move_x = this.data.map_x + (parseInt(item.x)*this.scale),
				move_y = this.data.map_y + (parseInt(item.y)*this.scale);

			if(this.e.x == this.data.map_x && this.e.y == this.data.map_y){
				this.e.tween({x:move_x, y:move_y}, item.duration);
			} 
			else {
				this.e.tween({x:this.data.map_x, y:this.data.map_y}, item.duration);
			}

			setTimeout($.proxy(this.oscillate, this, item), parseInt(item.duration) + parseInt(item.timeout));
		};

		Obj.prototype.collectable_by = function(who) {
			var that = this;
			this.e.addComponent('Collision');

			var i, item, items = who;

			for (i = 0; i < items.length; i++) {
				item = items[i];
			
				this.e.onHit(item, function(hit_list) {
					Crafty.trigger('item_collected', that);
					this.destroy();
				});
			};
		};
		
		return Obj;
	}
);