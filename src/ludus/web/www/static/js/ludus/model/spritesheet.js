define(
	["knockout", "knockout-mapping", "./spritesheet_item"],
	function(ko, mapping, SpriteSheetItem){
		function SpriteSheet(options){
			this.id = ko.observable(-1);
			this.sheet = ko.observable(null);
		    this.width = ko.observable(0);
		    this.height = ko.observable(0);
			this.sprite_items = ko.observableArray();
		    // this.image = null;

			this.update(options);
		}

		SpriteSheet.prototype.get_mapping_options = function() {
			return {
		        key: function(data) {
		            return ko.utils.unwrapObservable(data.id);
		        },
		        create: function(options) {
		        	return new SpriteSheetItem(options.data);
		        }
		    };
		};

		SpriteSheet.prototype.update = function(options) {
			this.id(options.id || -1);
			this.sheet(options.sheet || null);
			this.width(options.width || 0);
			this.height(options.height || 0);
			// this.image = options.image || null;

			// update mapped sprite items
			if(options.sprite_items && options.sprite_items.length > 0) {
				this.sprite_items = mapping.fromJS(options.sprite_items, this.get_mapping_options());
			}

			// if this image isnt being created (id will be -1) then preload the image
			// if(!this.image && this.id() != -1){
			// 	this.image = new Image();
			// 	this.image.src = this.to_url();
			// }
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