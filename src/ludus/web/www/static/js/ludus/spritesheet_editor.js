define(
	["jquery", "knockout", "./model/spritesheet", "./model/spritesheet_item", "jquery-form"], 
	function($, ko, SpriteSheet, SpriteSheetItem){

		function SpritesheetEditor(appl, editor){
			this.appl = appl;
			this.editor = editor;


			//---- Sheet Variables ----//
			this.id_seed = ko.observable(-1);			// current document sheet id seed
			this.sprite_id_seed = ko.observable(-1);	// current document sprite item id seed
			this.spritesheets = ko.observableArray();	// list of sprite sheets
			this.tiles = ko.observableArray();			// list of tile sheets

			this.show_sheetgrid = ko.observable(true);	// flag for showing/hiding the grid overlay
			this.selected_sheet = ko.observable(null);	// the current user selected sheet
			this.selected_sprite = ko.observable(null);	// the current user selected sprite/tile (to be added)
			this.active_sprite = ko.observable(null);	// the current user selected sprite/tile (in sprite item list)
		}

		SpritesheetEditor.prototype._init_ = function() {
			this.id_seed(-1);
			this.sprite_id_seed(-1);
			this.spritesheets.removeAll();
			this.tiles.removeAll();

			this.show_sheetgrid(true);
			this.selected_sheet(null);
			this.selected_sprite(null);
			this.active_sprite(null);
		};

		SpritesheetEditor.prototype.get_sheet_mapping_options = function() {
			return {
				key: function(data) {
		            return ko.utils.unwrapObservable(data.id);
		        },
		        create: function(options) {
		        	return new SpriteSheet(options.data);
		        }
		    };
		};

		SpritesheetEditor.prototype.get_sprite_mapping_options = function() {
			return {
		        key: function(data) {
		            return ko.utils.unwrapObservable(data.id);
		        },
		        create: function(options) {
		        	return new SpriteSheetItem(options.data);
		        }
		    };
		};

		SpritesheetEditor.prototype.get_seed_id = function() {
			var seed = this.id_seed();

			// increment the seed
			this.id_seed( seed+1 );

			return seed;
		};

		SpritesheetEditor.prototype.get_sprite_seed_id = function() {
			var seed = this.sprite_id_seed();

			// increment the seed
			this.sprite_id_seed( seed+1 );

			return seed;
		};

		SpritesheetEditor.prototype.update = function(sheets, seed) {
			this.id_seed = seed;
			this.sprite_id_seed = sheets.sprite_seed;
			this.spritesheets( sheets.spritesheets() );
			this.tiles( sheets.tiles() );

			// set selected sheet
			if(this.selected_sheet() && this.get_sheet_by_name( this.selected_sheet().sheet() )) {
				var sheet = this.get_sheet_by_name( this.selected_sheet().sheet() );
				this.set_sheet(sheet);
			}
			else {
				// default to first available sheet if one wasnt previously selected
				if(this.tiles()[0]) {
					this.set_sheet(this.tiles()[0]);
				}
				else if(this.spritesheets()[0]) {
					this.set_sheet(this.spritesheets()[0]);
				}
			}

			// set active sprite
			if(this.active_sprite() && this.selected_sheet()) {
				var item = this.selected_sheet().item_within(
					this.active_sprite().offset_x(), 
					this.active_sprite().offset_y(), 
					this.active_sprite().width(), 
					this.active_sprite().height()
				);

				// set to item from update
				if(item) {
					this.active_sprite(item);
				}
				else {
					this.active_sprite(null);
				}
			}
		};

		SpritesheetEditor.prototype.clear_selection = function() {
			// clear selection
			this.selected_sprite(null);
			$('.selection-box').remove();
		};

		SpritesheetEditor.prototype.set_sheet = function(sheet) {
			this.clear_selection();
			// set sheet
			this.selected_sheet(sheet);
		};

		SpritesheetEditor.prototype.grid_size = function() {
			return this.editor.grid_size();
		};


		SpritesheetEditor.prototype.sheetgrid_show_hide = function() {
			var btn = $('#show_sheetgrid_btn');

			if(btn.hasClass('active')) {
				this.show_sheetgrid(false);
				btn.removeClass('active');
				btn.addClass('btn-custom-inactive');
			}
			else {
				this.show_sheetgrid(true);
				btn.removeClass('btn-custom-inactive');
				btn.addClass('active');
			}

			// remove focus
			btn.blur();

			return true;
		};

		SpritesheetEditor.prototype.get_sheet_by_name = function(name) {
			for (var i = 0; i < this.spritesheets().length; i++) {
				if(this.spritesheets()[i].sheet() == name) {
					return this.spritesheets()[i];
				}
			};

			for (var i = 0; i < this.tiles().length; i++) {
				if(this.tiles()[i].sheet() == name) {
					return this.tiles()[i];
				}
			};
		};

		SpritesheetEditor.prototype.add_sheet_item = function() {
			if(this.selected_sheet() && this.selected_sprite()) {
				// dont add duplicates
				var item = this.selected_sheet().item_within(
					this.selected_sprite().offset_x, 
					this.selected_sprite().offset_y, 
					this.selected_sprite().width, 
					this.selected_sprite().height
				);

				if(item) {
					this.active_sprite(item);
				}
				else {
					var seed = this.get_sprite_seed_id();

					this.selected_sprite().id = seed;
					item = new SpriteSheetItem(this.selected_sprite());

					this.selected_sheet().sprite_items.push(item);
					this.editor.save_game();
					this.active_sprite(item);
				}
			}

			this.clear_selection();
		};

		SpritesheetEditor.prototype.remove_sheet_item = function() {
			// remove active sprite from lists
			var index = this.selected_sheet().index_of( this.active_sprite() );

			if(index > -1){
				this.selected_sheet().sprite_items.splice(index, 1);
				this.editor.save_game();
			}

			this.active_sprite(null);
		};

		SpritesheetEditor.prototype.snap_to_grid = function(val){
		    var snap_size = this.grid_size();
		    var snap = snap_size * Math.round(val/snap_size);
		    if (snap >= snap_size) {
		        return snap;
		    }
		    else {
		        return 0;
		    }
		};

		SpritesheetEditor.prototype.snap_to_grid_width = function(val, offset){
		    var result = this.snap_to_grid(val);
		    var max = this.snap_to_grid(this.selected_sheet().width()-offset);

		    return Math.min(result, max);
		};

		SpritesheetEditor.prototype.snap_to_grid_height = function(val, offset){
		    var result = this.snap_to_grid(val);
		    var max = this.snap_to_grid(this.selected_sheet().height()-offset);

		    return Math.min(result, max);
		};

		SpritesheetEditor.prototype.snap_to_grid_floor = function(val){
		    var snap_size = this.grid_size();
		    var snap = snap_size * Math.floor(val/snap_size);
		    if (snap >= snap_size) {
		        return snap;
		    }
		    else {
		        return 0;
		    }
		};

		SpritesheetEditor.prototype.add_sheet = function(name, list) {
			//construct spritesheet object
			var that = this;
			var seed = this.get_seed_id();
			var sheet = new SpriteSheet({sheet:name});
			var url = sheet.to_url();
			var imageObj = new Image();

			imageObj.onload = function() {
				// set width and height
				sheet.update({
					id:seed,
					sheet:name,
					width:imageObj.width,
					height:imageObj.height,
					image:imageObj
				});

				// save new sheet
				list.push(sheet);
				that.editor.save_game();
				that.selected_sheet(sheet);
			};

			// start load
			imageObj.src = url;
		};

		SpritesheetEditor.prototype.upload_sheet = function() {
			var that = this;
			var modal = $('#upload_dlog').modal();

			var upload_btn = $('#upload_button').click(function() {
				var form = modal.find("form");
				var upload_type = form.find("input:radio[name=upload_type]:checked").val();

				form.ajaxSubmit({
					success: function(response){
						// console.log(upload_type,response);

						if(response.result[0]) {
							// get result[0].actual and put it into the game_state
							if(upload_type == 'spritesheet') {
								that.add_sheet(response.result[0].actual, that.spritesheets);
							}
							else {
								that.add_sheet(response.result[0].actual, that.tiles);
							}

							modal.modal('hide');
						}
						else {
							that.appl.notify("Could not upload that image, try again.", "error", 4000);
						}
					}
				});
			});

			modal.modal('show');

			// must remove event handlers so that closures can be garbage collected
			modal.on('hidden.bs.modal', function(e) {
				modal.off('hidden.bs.modal');
				upload_btn.off('click');
			});
		};

		return SpritesheetEditor;

	}
);