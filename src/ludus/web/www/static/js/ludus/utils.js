define(
	[
		"jquery", "knockout",
		"./model/properties/oscillate",
		"select2", "domready"
	], 
	function($, ko, Oscillate){

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

		function set_grid(grid_size, color, width, height, scale) {
		    // will set the background image of selector to the
		    // dataURL of a canvas grid using color for the lines
		    grid_size = parseInt(grid_size);

		    // defaults
			if(!grid_size){
				grid_size = 16;
			}
			if(!color){
				color = "#eee";
			}
			if(!width){
				width = 30;
			}
			if(!height){
				height = 30;
			}

			// scale width and height
			var w_size = width, 
				h_size = height;

			if(scale === true) {
				w_size = grid_size*width;
				h_size = grid_size*height;
			}

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
		    	i = i+grid_size;
		    };

		    // define verticals
		    for (var i = 0; i < w_size;) {
		    	context.moveTo(i,0);
		    	context.lineTo(i,h_size);
		    	i = i+grid_size;
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
		        var width, height;

		        if(value.width) {
		        	width = ko.unwrap(value.width);
		        }

		        if(value.height) {
		        	height = ko.unwrap(value.height);
		        }

		        if(value.dimensions) {
		        	width = ko.unwrap(value.dimensions).width();
		        	height = ko.unwrap(value.dimensions).height();
		        }

		        var url = set_grid(ko.unwrap(value.grid_size),
    							   ko.unwrap(value.color),
    							   width,
    							   height,
    							   ko.unwrap(value.scale));

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
						appl.selected_sprite(null);
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

						var dragged_rect = { 
							offset_x: final_x, 
							offset_y: final_y, 
							width: final_w, 
							height: final_h 
						}

						$selection.css({
							'top': final_y,
							'left':	final_x,
							'width': final_w + selection_border_width,
							'height': final_h + selection_border_width
						});
					
						appl.selected_sprite(dragged_rect);
					});
				});
		    },
		    update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
		    	// do nothing...
		    }
		};

		function cursor_to_canvas(element, url, x, y, width, height) {
			// setup canvas
			var canvas = $('<canvas width="' + width + '" height="' + height + '">');
			var context = canvas[0].getContext('2d');

			if(element != null) {
				var img = new Image();

				img.onload = function() {
					context.save();
					context.globalAlpha = 0.4;
					context.drawImage(img,x,y,width,height,0,0,width,height);
					context.restore();

				    var cursor = canvas[0].toDataURL();
				    element.attr('src', cursor);
				}

				// start load
				img.src = url;
			}
		};

		ko.bindingHandlers.sudo_cursor = {
			init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
				var $cursor = $(element);
				var $container = $cursor.parent();
				var value = valueAccessor();

				$container.bind('mouseenter', function(e) {
					$cursor.show();
				});

				$container.bind('mouseleave', function(e) {
					$cursor.hide();
				});

				$container.bind('mousemove', function(e) {
					var mouse_x = e.pageX,
						mouse_y = e.pageY;

					var final_x = value.snap_func(mouse_x - $container.offset().left),
						final_y = value.snap_func(mouse_y - $container.offset().top);

					$cursor.css({
						'top': final_y,
						'left':	final_x
					});
				});
			},
			update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
				var $cursor = $(element);
				var value = valueAccessor();

				if(value.visible){

					if(value.sprite && value.sheet) {
						// hide real cursor
						// $cursor.parent().css({
						// 	cursor: 'none'
						// });

						// create sudo cursor
						var url = value.sheet.to_url(),
						x = value.sprite.offset_x(), 
						y = value.sprite.offset_y(),
						width = value.sprite.width(),
						height = value.sprite.height();

						cursor_to_canvas(
							$cursor,
							ko.unwrap(url),
							ko.unwrap(x),
							ko.unwrap(y),
							ko.unwrap(width),
							ko.unwrap(height)
						);
					}
					else {
						// show real cursor
						// $cursor.parent().css({
						// 	cursor: 'pointer'
						// });

						// clear sudo-cursor
						$cursor.attr('src', null);
					}

				}
				else {
					// show real cursor
					// $cursor.parent().css({
					// 	cursor: 'pointer'
					// });

					// clear sudo-cursor
					$cursor.attr('src', null);
				}
		    }
		}

		ko.bindingHandlers.sprite = {
			init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
				var value = valueAccessor();

				if(value.obj.name()) {
					value.obj.to_canvas( ko.unwrap(value.obj.name) );
				}
			},
			update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
				// do nothing...
			}
		}

		ko.bindingHandlers.click_drag = {
			init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
				var $map = $(element);
				var value = valueAccessor();

				var move_func = function(move_evt) {
					// perform action on drag
					value.action(value.data, move_evt);
				};

				var release_func = function(release_evt) {
					// remove bindings
					$map.unbind('mousemove', move_func);
					$map.unbind('mouseup', release_func);

					// final call to commit changes
					value.action(value.data, release_evt);
				};

				// add mouse move and mouse up bindings on click
				$map.bind('mousedown', function(click_evt) {
					// apply bindings
					$map.bind('mousemove', move_func);
					$map.bind('mouseup', release_func);

					// perform action once initially
					value.action(value.data, click_evt);
				});		

				// if mouse leaves map unbind functions
				$map.bind('mouseleave', function(leave_evt) {
					// remove bindings
					$map.unbind('mousemove', move_func);
					$map.unbind('mouseup', release_func);
				});
			},
			update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
				// do nothing...
			}
		}


		function get_property_mapping_options() {
			return {
				key: function(data) {
		            return ko.utils.unwrapObservable(data.id);
		        },
		        create:function(options){
		        	var property = null;

		        	if(options.data.name == 'Oscillate') {
		        		property = new Oscillate(options.data);
		        	}
		        	else if(options.data.name == 'Twoway') {
		        		property = {
							name:"Twoway",
							move_speed:3,
							jump_speed:3
						};
		        	}
		        	else if(options.data.name == 'Fourway') {
		        		property = {
							name:"Fourway",
							move_speed:3
						};
		        	}
		        	else if(options.data.name == 'Stop On') {
		        		property = {
							name:"Stop On",
							what:["Solid"]
						};
		        	}
		        	else if(options.data.name == 'Gravity') {
		        		property = {
							name:"Gravity"
						};
		        	}
		        	else if(options.data.name == 'Solid') {
		        		property = {
							name:"Solid"
						};
		        	}
		        	else if(options.data.name == 'Collector') {
		        		property = {
							name:"Collector",
							to_collect:4,
							on_finish:"End Game"
						};
		        	}
		        	else if(options.data.name == 'Collectable') {
		        		property = {
							name:"Collectable",
							who:["Collector"]
						};
		        	}

		        	return property;
		        }
		    };
		};

		function intersectRect(r1, r2) {
			return !(r2.left > r1.right || 
					 r2.right < r1.left || 
					 r2.top > r1.bottom || 
					 r2.bottom < r1.top);
		};

		var utils = {};

		utils.intersectRect = intersectRect;
		utils.get_property_mapping_options = get_property_mapping_options;

		return utils;
	}
);