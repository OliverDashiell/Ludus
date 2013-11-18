$(function(){
	var view_model = {
		msg: ko.observable("hello, ludus")
	};
	
	ko.applyBindings(view_model);
});