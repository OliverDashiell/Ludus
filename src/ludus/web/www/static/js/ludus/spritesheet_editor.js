define(
	["jquery", "knockout", "jquery-form"], 
	function($, ko){

		function SpritesheetEditor(appl, editor){
			this.appl = appl;
			this.editor = editor;
			this.selected_sheet = ko.observable();
			this.selected_sprite = ko.observable();
			this.spritesheets = ko.observableArray();
			this.tiles = ko.observableArray();
			this.sheet_width = ko.observable();
			this.sheet_height = ko.observable();
			this.sheet_url = ko.observable();
			this.show_sheetgrid = ko.observable(true);

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