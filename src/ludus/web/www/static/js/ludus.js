$(function(){
	var view_model = {
		msg: ko.observable("hello, ludus"),
		ws: new Ws()
	};

	view_model.ws.connect();
	ko.applyBindings(view_model);
});