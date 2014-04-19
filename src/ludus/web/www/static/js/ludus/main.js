define(
	["jquery", "knockout", "./ws", "./games_panel", "./editor_panel", "./account_panel", "./play_panel", "bootstrap-notify"], 
	function($, ko, Ws, GamesPanel, EditorPanel, AccountPanel, PlayPanel){

		function Ludus(){
			this.debug = ko.observable(false);
			this.error = ko.observable();
			this.ws = new Ws();
			this.user = ko.observable();
			this.username = ko.observable(null);

			this.panel = ko.observable();
			this.games_panel = new GamesPanel(this);
			this.editor_panel = new EditorPanel(this);
			this.account_panel = new AccountPanel(this);
			this.play_panel = new PlayPanel(this);
			this.about_panel = {template:"about-panel"};

			this.show_panel(this.games_panel);

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

			this.user.subscribe(function(value){
				if(this.user().name != this.username()){
					this.username(this.user().name);
				}
			},this);
		}

		Ludus.prototype.settings = {}; // client settings

		Ludus.prototype.show_panel = function(value) {
			if(this.panel() && this.panel().hide){
				this.panel().hide();
			}
			this.panel(value);
			if(this.panel() && this.panel().show){
				this.panel().show();
			}
		};

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
			this.show_panel(this.editor_panel);
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

		Ludus.prototype.view_games = function(data) {
			this.show_panel(this.games_panel);

			if(data == "kicked"){
				var modal = $('#kicked_dlog').modal();
				modal.modal('show');
			}
			else if(data == "stop_build"){
				var modal = $('#stop_build_dlog').modal();
				modal.modal('show');
			}
		};

		Ludus.prototype.close_editor = function() {
			this.view_games();
		};

		Ludus.prototype.view_account = function() {
			this.show_panel(this.account_panel);
		};

		Ludus.prototype.about = function() {
			this.show_panel(this.about_panel);
		};

		Ludus.prototype.play = function(game) {
			this.play_panel.set_game(game);
			this.show_panel(this.play_panel);
		};

		Ludus.prototype.notify = function(message, type, duration){
			/*
		     * display an info message
		     * type: info, success, warning, error
		     */
			if(type==='warning'){
				$('.bottom-right').notify({
			    	type: "warning",
			        message: { html: "<strong>Warning</strong> " + message },
			        fadeOut: { enabled: true, delay: duration || 2000 }
			    }).show();
			} else if (type==='error'){
			    $('.top-right').notify({
			    	type: "danger",
			        message: { html: "<strong>Error</strong> " + message },
			        fadeOut: { enabled: true, delay: duration || 2000 }
			    }).show();
			} else if (type==='notify'){
			    $('.top-left').notify({
			    	type: "success",
			        message: { html: "<strong>Success</strong> " + message },
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
				if(type == null) {
					type = 'info';
				}

			    $('.bottom-left').notify({
			    	type: type,
			        message: { html: "<strong>" + type + "</strong> " + message },
			        fadeOut: { enabled: true, delay: duration || 2000 }
			    }).show();
			}
		};

		return Ludus;
	}
);