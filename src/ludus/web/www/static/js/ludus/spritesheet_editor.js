define(
	["jquery", "knockout", "jquery-form"], 
	function($, ko){

		function SpriteSheetItem(x,y,width,height){
			this.offset_x = ko.observable(x || 0);
			this.offset_y = ko.observable(y || 0);
			this.width = ko.observable(width || 0);
			this.height = ko.observable(height || 0);
		}

		function SpritesheetEditor(appl, editor){
			this.appl = appl;
			this.editor = editor;
			this.show_sheetgrid = ko.observable(true);

			this.selected_sheet = ko.observable();
			this.selected_sprite = ko.observable();

			this.spritesheets = ko.observableArray();
			
			this.tiles = ko.observableArray();

			this.sheet_width = ko.observable();
			this.sheet_height = ko.observable();
			this.sheet_url = ko.observable();
			this.sprite_items = ko.observableArray();


			this.selected_sheet.subscribe(function(value){
				if(value){
					var that = this;
					var sheet_url = "/uploads/" + value;
					var imageObj = new Image();

					imageObj.onload = function() {
						that.sheet_width( Math.abs(imageObj.width/that.editor.grid_size()) );
						that.sheet_height( Math.abs(imageObj.height/that.editor.grid_size()) );
						that.sheet_url(sheet_url);
					};

					imageObj.src = sheet_url;
				}
			},this);
		}

		SpritesheetEditor.prototype.grid_size = function() {
			return parseInt( this.editor.grid_size() );
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
		    var max = this.snap_to_grid((this.sheet_width()*this.grid_size())-offset);

		    return Math.min(result, max);
		};

		SpritesheetEditor.prototype.snap_to_grid_height = function(val, offset){
		    var result = this.snap_to_grid(val);
		    var max = this.snap_to_grid((this.sheet_height()*this.grid_size())-offset);

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

		SpritesheetEditor.prototype.sheet_drag_rect = function(rect) {
			console.log(rect);
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

			return true;
		};

		SpritesheetEditor.prototype.add_sheet = function() {
			var that = this;
			var modal = $('#upload_dlog').modal();

			var upload_btn = $('#upload_button').click(function() {
				var form = modal.find("form");
				var upload_type = form.find("input:radio[name=upload_type]:checked").val();

				form.ajaxSubmit({
					success: function(response){
						console.log(upload_type,response);

						// get result[0].actual and put it into the game_state
						if(upload_type == 'spritesheet'){
							that.editor.add_spritesheet(response.result[0].actual);
						}
						else {
							that.editor.add_tile(response.result[0].actual);
						}

						modal.modal('hide');
						that.selected_sheet(response.result[0].actual);
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