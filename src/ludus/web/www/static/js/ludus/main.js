define(
	["jquery", "knockout", "./ws", "./games_panel", "./editor_panel", "./account_panel", "bootstrap-notify", "./utils"], 
	function($, ko, Ws, GamesPanel, EditorPanel, AccountPanel){

		function Ludus(){
			this.debug = ko.observable(false);
			this.error = ko.observable();
			this.ws = new Ws();
			this.user = ko.observable();

			this.games_panel = new GamesPanel(this);
			this.editor_panel = new EditorPanel(this);
			this.account_panel = new AccountPanel(this);
			this.about_panel = {template:"about-panel"};
			this.panel = ko.observable(this.games_panel);

			this.error.subscribe(function(value){
				if(value){
					this.notify(value, "error");
				}
			},this);

			this.debug.subscribe(function(value){
				if(value == true){
					this.ws.status.subscribe(function(value){
						if(value){
							this.notify(value, "debug");
						}
					},this);
				}
			},this);
		}

		Ludus.prototype.settings = {}; // client settings

		Ludus.prototype.connect = function() {
			this.user(this.settings.user);
			this.ws.connect(this.settings.ws_url, this.panel().load, this.panel());
		};

		Ludus.prototype.subscribe_to_broadcasts = function(callback, target) {
			return this.ws.ws_msg.subscribe(callback,target);
		};

		Ludus.prototype.unsubscribe_to_broadcasts = function(subscription) {
			this.ws.ws_msg.unsubscribe(subscription);
		};

		Ludus.prototype.send = function(msg, callback, target) {
			return this.ws.send(msg, callback, target);
		};

		Ludus.prototype.edit_game = function(game_id) {
			this.editor_panel.edit_game(game_id);
			this.panel(this.editor_panel);
		};

		Ludus.prototype.delete_game = function(game) {
			var that = this;
			var modal = $('#delete_game_dlog').modal();
			$('#delete_game_name').text(game.name);

			var delete_btn = $('#delete_game_button').click(function() {
				that.send({method:"delete_game", kwargs:{game_id:game.id}}, function(response) {
					if(response.error) {
						this.error(response.error);
					}
					else {
						modal.modal('hide');
					}
				}, that);
			});

			modal.modal('show');

			// must remove event handlers so that closures can be garbage collected
			modal.on('hidden.bs.modal', function(e) {
				modal.off('hidden.bs.modal');
				delete_btn.off('click');
			});
		};

		Ludus.prototype.view_games = function() {
			this.panel(this.games_panel);
		};

		Ludus.prototype.close_editor = function() {
			this.view_games();
		};

		Ludus.prototype.view_account = function() {
			this.panel(this.account_panel);
		};

		Ludus.prototype.about = function() {
			this.panel(this.about_panel);
		};

		Ludus.prototype.notify = function(message, type, duration){
			/*
		     * display an info message
		     * type: info, success, warning, error
		     */
			if(type==='warning'){
				$('.bottom-right').notify({
			    	type: "warning",
			        message: { text: message },
			        fadeOut: { enabled: true, delay: duration || 2000 }
			    }).show();
			} else if (type==='error'){
			    $('.top-right').notify({
			    	type: "danger",
			        message: { text: message },
			        fadeOut: { enabled: true, delay: duration || 2000 }
			    }).show();
			} else if (type==='notify'){
			    $('.top-left').notify({
			    	type: "success",
			        message: { text: message },
			        fadeOut: { enabled: false }
			    }).show();
			}  else if (type==='debug'){
				if(this.debug() === true){
				    $('.bottom-left').notify({
			    		type: "warning",
				        message: { html: "<strong>Debug</strong> " + message },
				        fadeOut: { enabled: true, delay: duration || 1000 }
				    }).show();
				}
			} else {
			    $('.bottom-left').notify({
			    	type: type || 'info',
			        message: { text: message },
			        fadeOut: { enabled: true, delay: duration || 2000 }
			    }).show();
			}
		};

		return Ludus;
	}
);