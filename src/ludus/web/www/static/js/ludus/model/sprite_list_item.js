define(
	["jquery", "knockout", "../utils"],
	function($, ko, utils){

		function SpriteListItem(options){
			this.name = ko.observable('object');
			this.layer = ko.observable('background');
			this.map_x = ko.observable(0);
			this.map_y = ko.observable(0);

			this.sheet = ko.observable(null);
			this.offset_x = ko.observable(0);
			this.offset_y = ko.observable(0);
			this.width = ko.observable(0);
			this.height = ko.observable(0);

			this.update(options);
		}

		SpriteListItem.prototype.update = function(options) {
			this.name(options.name || 'object');
			this.layer(options.layer || 'background');
			this.map_x(options.map_x || 0);
			this.map_y(options.map_y || 0);

			this.sheet(options.sheet || null);
			this.offset_x(options.offset_x || 0);
			this.offset_y(options.offset_y || 0);
			this.width(options.width || 0);
			this.height(options.height || 0);
		};

		SpriteListItem.prototype.r = function() {
			return {
				top:this.map_y(),
				left:this.map_x(),
				bottom:this.map_y()+this.height(),
				right:this.map_x()+this.width()
			};
		};

		SpriteListItem.prototype.overlaps = function(r) {
			if(utils.intersectRect(this.r(), r)) {
				return this;
			}
		};

		SpriteListItem.prototype.contains = function(x,y){
			var r = this.r();
			return (x >= r.left && 
					x < r.right &&
				    y >= r.top && 
				    y < r.bottom);
		};

		SpriteListItem.prototype.to_style = function(){
			return { top: this.map_y() + "px",
					 left: this.map_x() + "px",
					 width: this.width() + "px",
					 height: this.height() + "px"}
		};

		SpriteListItem.prototype.to_canvas = function(accessor) {
			var x = this.offset_x(),
				y = this.offset_y(),
				width = this.width(),
				height = this.height();

			var sprite = document.getElementById(accessor);

			if(sprite != null) {
				// setup canvas
				var canvas = $('<canvas width="' + width + '" height="' + height + '">');
				var context = canvas[0].getContext('2d');
				var img = new Image();

				img.onload = function() {
					context.drawImage(img,x,y,width,height,0,0,width,height);

				    sprite.src = canvas[0].toDataURL();
				};

				// start load
				img.src = this.to_url();
			}
		};

		SpriteListItem.prototype.to_url = function() {
			return '/uploads/' + this.sheet();
		};

		return SpriteListItem;
	}
);