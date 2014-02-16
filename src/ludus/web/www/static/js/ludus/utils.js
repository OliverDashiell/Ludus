define(
	["jquery", "knockout", "select2"], 
	function($, ko){
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
	}
);