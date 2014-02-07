define(
	["knockout", "./ws", "./user_panel"], 
	function(ko, Ws, UserPanel){

		function Ludus(){
			this.debug = ko.observable(false);
			this.error = ko.observable();
			this.ws = new Ws();
			this.user = ko.observable();
			this.panel = ko.observable(new UserPanel(this));
		}

		Ludus.prototype.settings = {}; // client settings

		Ludus.prototype.connect = function() {
			this.user(this.settings.user);
			this.ws.connect(this.settings.ws_url, this.panel().load, this.panel());
		};

		return Ludus;
	}
);