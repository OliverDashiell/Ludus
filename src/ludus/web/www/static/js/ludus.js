window.Ludus = {settings:{}}; // client settings

$(function(){
	var view_model = {
		debug: ko.observable(Ludus.settings.debug),
		msg: ko.observable("hello, ludus"),
		ws: new Ws(Ludus.settings.ws_url),
		user: ko.observable(Ludus.settings.user)
	};

	if(Ludus.settings.debug === true){
		Ludus.view_model = view_model;
	}

	view_model.ws.connect();
	ko.applyBindings(view_model);
});