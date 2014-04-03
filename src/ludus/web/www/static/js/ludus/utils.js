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

		        $(element).attr({"src":url});;
		    }
		};

		return utils;
	}
);