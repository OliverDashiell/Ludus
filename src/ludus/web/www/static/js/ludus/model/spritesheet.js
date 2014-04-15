define(
	["knockout", "./spritesheet_item"],
	function(ko, SpriteSheetItem){
		function SpriteSheet(options){
			this.sheet = ko.observable(null);
		    this.width = ko.observable(0);
		    this.height = ko.observable(0);
			this.sprite_items = ko.observableArray();
			this.image = new Image();
			this.image_loaded = ko.observable(false);

			this.update(options);
		}


		SpriteSheet.prototype.update = function(options) {
			this.sheet(options.sheet || null);
			this.width(options.width || 0);
			this.height(options.height || 0);

			this.sprite_items.removeAll();
			if(options.sprite_items) {
				var i,item,items = options.sprite_items;

				for (var i = 0; i < items.length; i++) {
					item = items[i];

					var sheet_item = new SpriteSheetItem(item);
					this.sprite_items().push(sheet_item);
				};
			}

			if(options.image){
				this.image = options.image;
				this.image_loaded(true);
			}
		};

		SpriteSheet.prototype.item_within = function(x,y,width,height) {
			var i,item,items = this.sprite_items();

			// inset by border to prevent false result with bordering squares
			var r = {
				top:y+1,
				left:x+1,
				bottom:y+height-1,
				right:x+width-1
			};

			for (i = 0; i < items.length; i++) {
				item = items[i];
				if(item.overlaps(r)) {
					return item;
				}
			};
		};

		SpriteSheet.prototype.index_of = function(sprite) {
			if(!sprite) {
				return -1;
			}

			var i,item,items = this.sprite_items();

			// inset by border to prevent false result with bordering squares
			var r = {
				top:sprite.offset_y()+1,
				left:sprite.offset_x()+1,
				bottom:sprite.offset_y()+sprite.height()-1,
				right:sprite.offset_x()+sprite.width()-1
			};

			for (i = 0; i < items.length; i++) {
				item = items[i];
				if(item.overlaps(r)) {
					return i;
				}
			};

			return -1;
		};

		SpriteSheet.prototype.to_url = function() {
			return '/uploads/' + this.sheet();
		};

		SpriteSheet.prototype.serialise = function() {
			var sprites = [];
			var i,item,items = this.sprite_items();

			for (var i = 0; i < items.length; i++) {
				item = items[i];

				sprites[i] = item.serialise();
			};

			return {
				sheet: this.sheet(),
			    width: this.width(),
			    height: this.height(),
				sprite_items: sprites
			};
		};

		return SpriteSheet;
	}
);