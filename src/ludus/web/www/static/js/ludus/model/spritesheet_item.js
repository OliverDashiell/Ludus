define(
	["knockout", "../utils"],
	function(ko, utils){
		function SpriteSheetItem(options){
			this.offset_x = ko.observable(0);
			this.offset_y = ko.observable(0);
			this.width = ko.observable(0);
			this.height = ko.observable(0);

			this.update(options);
		}

		SpriteSheetItem.prototype.update = function(options) {
			this.offset_x(options.offset_x || 0);
			this.offset_y(options.offset_y || 0);
			this.width(options.width || 0);
			this.height(options.height || 0);
		};

		SpriteSheetItem.prototype.r = function() {
			return {
				top:this.offset_y(),
				left:this.offset_x(),
				bottom:this.offset_y()+this.height(),
				right:this.offset_x()+this.width()
			};
		};

		SpriteSheetItem.prototype.overlaps = function(r) {
			if(utils.intersectRect(this.r(), r)) {
				return true;
			}
			else {
				return false;
			}
		};

		SpriteSheetItem.prototype.to_style = function(padding){
		    if(!padding){
		        padding = 1; 
		    }
			return { top: this.offset_y() + "px",
					 left: this.offset_x() + "px",
					 width: (this.width()+padding) + "px",
					 height: (this.height()+padding) + "px" }
		};

		SpriteSheetItem.prototype.serialise = function() {
			return {
				offset_x: this.offset_x(),
				offset_y: this.offset_y(),
				width: this.width(),
				height: this.height()
			};
		};

		return SpriteSheetItem;
	}
);