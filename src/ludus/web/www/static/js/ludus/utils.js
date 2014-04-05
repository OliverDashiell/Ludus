define(
	["jquery", "knockout", "select2", "domready"], 
	function($, ko){
		var utils = {};

		// select2 support
		ko.bindingHandlers.select2 = {
		    init: function(element, valueAccessor, allBindingsAccessor) {
		    	var allBindings = allBindingsAccessor();
		    	var update = true;
		        $(element).select2(valueAccessor());
		        $(element).on("change", function(evt){
		        	if(update == true){
		        		update = false;
		        		allBindings.select2Value(evt.val);
		        		update = true;
		        	}
		        });

		        var sub = allBindings.select2Value.subscribe(function(value){
		        	if(update == true){
		        		$(element).select2('val', value);
		        	}
		        });

		        ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
		            $(element).select2('destroy');
		            $(element).off("change");
		            sub.dispose();
		        });
		    },
		    update: function(element, valueAccessor, allBindingsAccessor) {
		        $(element).trigger('change');
		    }
		};
		// end select2 support

		$(document).on('change', '.btn-file :file', function() {
			var input = $(this),
				numFiles = input.get(0).files ? input.get(0).files.length : 1,
				label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
				input.trigger('fileselect', [numFiles, label]);
				
			var display = $(this).parents('.input-group').find(':text'),
				log = numFiles > 1 ? numFiles + ' files selected' : label;

			if( display.length ) {
				display.val(log);
			} else {
				if( log ) alert(log);
			}
		}); 
		// file selector support

		function set_grid(grid, color, width, height){
		    // will set the background image of selector to the
		    // dataURL of a canvas grid using color for the lines
		    grid = parseInt(grid);

			if(!grid){
				grid = 16;
			}
			if(!color){
				color = "#eee";
			}
			if(!width){
				width = 48;
			}
			if(!height){
				height = 33;
			}

			var w_size = grid*width;
			var h_size = grid*height;

			// setup canvas
			var canvas = $('<canvas width="' + w_size + '" height="' + h_size + '">');
			var context = canvas[0].getContext('2d');
		    context.strokeStyle = color;

			// grid lines
		    context.beginPath();
		    context.moveTo(0,0);

		    // define horizontals
		    for (var i = 0; i < h_size;) {
		    	context.moveTo(0,i);
		    	context.lineTo(w_size,i);
		    	i = i+grid;
		    };

		    // define verticals
		    for (var i = 0; i < w_size;) {
		    	context.moveTo(i,0);
		    	context.lineTo(i,h_size);
		    	i = i+grid;
		    };

		    // close the grid
		    context.moveTo(w_size,0);
		    context.lineTo(w_size,h_size);
		    context.moveTo(0,h_size);
		    context.lineTo(w_size,h_size);

		    // draw
		    context.stroke();

			var url = canvas[0].toDataURL();
			return url;
		}

		ko.bindingHandlers.grid = {
		    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
		        // This will be called when the binding is first applied to an element
		        // Set up any initial state, event handlers, etc. here
		    },
		    update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
		        // This will be called once when the binding is first applied to an element,
		        // and again whenever the associated observable changes value.
		        // Update the DOM element based on the supplied values here.
		        var value = valueAccessor();
		        var url = set_grid(ko.unwrap(value.grid),
    							   ko.unwrap(value.color),
    							   ko.unwrap(value.width),
    							   ko.unwrap(value.height));

		        $(element).attr({"src":url});
		    }
		};

		ko.bindingHandlers.drag_rect = {
			init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
				var $container = $(element);
				var $selection = $('<div>').addClass('selection-box');
				var selection_border_width = 1;
				var appl = valueAccessor();

				$selection.attr('draggable', false);

				$container.parent().on('mousedown', function(e) {
					if(e.target !== $container[0]) {
						appl.sheet_drag_rect(null);
						$selection.remove();
						return;
					}
					
					var click_y = e.pageY,
						click_x = e.pageX,
						move_x = 0,
						move_y = 0,
						width = 0,
						height = 0,
						offset_x = click_x - $container.offset().left,
						offset_y = click_y - $container.offset().top;

					$selection.css({
						'top':	appl.snap_to_grid_floor(offset_y),
						'left':	appl.snap_to_grid_floor(offset_x),
						'width': appl.grid_size() + selection_border_width,
						'height': appl.grid_size() + selection_border_width
					});

					$selection.appendTo($container.parent());

					$container.parent().on('mousemove', function(e) {
						move_x = e.pageX;
						move_y = e.pageY;
						var new_x, new_y;

						width = appl.snap_to_grid_width(Math.abs(move_x - click_x), offset_x);
						height = appl.snap_to_grid_height(Math.abs(move_y - click_y), offset_y);

						if( width < appl.grid_size() ) {
							width = appl.grid_size();
						}

						if( height < appl.grid_size() ){
							height = appl.grid_size();
						}
						
						new_x = (move_x < click_x) ? (click_x - width) : click_x;
						new_y = (move_y < click_y) ? (click_y - height) : click_y;
						
						$selection.css({
							'top': appl.snap_to_grid(new_y - $container.offset().top),
							'left': appl.snap_to_grid(new_x - $container.offset().left),
							'width': width + selection_border_width,
							'height': height + selection_border_width
						});
					});

					$container.parent().on('mouseup', function(e) {
						$container.parent().off('mousemove');
						$container.parent().off('mouseup');

						var origin_x = click_x, 
							origin_y = click_y;

						// determine origin from click or move
						if(move_x != 0 && move_x < click_x) {
							origin_x = move_x;
						}
						if(move_x != 0 && move_y < click_y) {
							origin_y = move_y;
						}

						var final_x, final_y, 
							final_w, 
							final_h;
						

						final_w = width;
						final_h = height;

						if( width < appl.grid_size() ) {
							final_w = appl.grid_size();
						}

						if( height < appl.grid_size() ){
							final_h = appl.grid_size();
						}

						if(move_x == 0){
							final_x = appl.snap_to_grid_floor(origin_x - $container.offset().left);
							final_y = appl.snap_to_grid_floor(origin_y - $container.offset().top);
						} else {
							final_x = appl.snap_to_grid(origin_x - $container.offset().left);
							final_y = appl.snap_to_grid(origin_y - $container.offset().top);
						}

						var dragged_rect = [ final_x, final_y, final_w, final_h ]

						$selection.css({
							'top': final_y,
							'left':	final_x,
							'width': final_w + selection_border_width,
							'height': final_h + selection_border_width
						});
					
						appl.sheet_drag_rect(dragged_rect);
					});
				});
		    },
		    update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
		    	// do nothing...
		    }
		};

		return utils;
	}
);