define(
	["jquery", "knockout", "select2"], 
	function($, ko){
		// select2 support
		ko.bindingHandlers.select2 = {
		    init: function(element, valueAccessor) {
		        $(element).select2(valueAccessor());

		        ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
		            $(element).select2('destroy');
		        });
		    },
		    update: function(element, valueAccessor, allBindingsAccessor) {
		        var allBindings = allBindingsAccessor(),
		            value = ko.utils.unwrapObservable(allBindings.value || allBindings.selectedOptions);
		        if (value) {
		            $(element).select2('val', value);
		        }
		    }
		};
		// end select2 support
	}
);