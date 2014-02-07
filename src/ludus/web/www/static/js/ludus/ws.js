define(
	["jquery",
	 "knockout"], 
	function($, ko){

		function Ws(){
			this._reconnect_time_default_ = 3;
			this._reconnect_time_ = this._reconnect_time_default_;
			this._reconnect_timeout_ = null;
			this._connection_attempts_ = 1;
			this.status = ko.observable("disconnected");
			this.status_ = ko.observable("disconnected");
			this.error_msg = ko.observable();
			
			this.ws = null;
			this.ws_url = '/websocket';
			this.ws_msg = ko.observable();
			this.callbacks = {};
			this.next_request_id = 0;
		}

		Ws.prototype.send = function(msg, callback, target){
			if(callback){
				this.next_request_id = this.next_request_id + 1;
				msg.request_id = this.next_request_id;
				this.callbacks[this.next_request_id] = [callback, target];
			}
			this.ws.send(ko.toJSON(msg));
			console.log(msg);
		};

		Ws.prototype.connect = function(ws_url, callback, target){

			if(ws_url !== undefined){
				this.ws_url = ws_url;
			}
			
			var that = this;
			var protocol = document.location.protocol == "https:"? "wss://" : "ws://";
			var ws = new WebSocket(protocol + document.domain + ":" + document.location.port + this.ws_url);
			
			ws.onopen = function() {
				that._reconnect_time_ = that._reconnect_time_default_;
				that._connection_attempts_ = 1;
				that.ws = ws;
				that.status("connected");
				that.status_("connected");

				if(callback) {
					callback.call(target || that);
				}
			};
			
			ws.onmessage = function(evt) {
				console.log(evt.data);
				var msg = $.parseJSON(evt.data);
				if(msg.request_id){
					var callback = that.callbacks[msg.request_id];
					
					if(callback){
						delete that.callbacks[msg.request_id];
						callback[0].call(callback[1], msg);
					}
				}
				else{
					that.ws_msg(msg);
					
					if(msg.signal == "value"){
						that.value(msg.value);
					}
					else if(msg.signal == "locked"){
						that.lock(-1);
					}
					else if(msg.signal == "unlocked"){
						that.lock(0);
					}
				}
			};
			
			ws.onerror = function(err) {
				that.error_msg(err.message);
			};
			
			ws.onclose = function() {
				//that.status("disconnected");
				that.disconnected();
			};
		};

		Ws.prototype.disconnected = function(){
			this.ws = null;
			var that = this;
			
			if(this._reconnect_time_ > 0){
				this._reconnect_timeout_ = setTimeout(function(){ 
					that._reconnect_time_ -= 1;
					that.status('reconnecting in ' + that._reconnect_time_ + ' secs ' + 
								'(attempt number ' + that._connection_attempts_ + ')');
					that.status_("connecting");
					
					that._reconnect_timeout_ = null;
					that.disconnected();
				}, 1000);
			}
			else{
				if(this._connection_attempts_ < 10){
					this.connect();
					this._connection_attempts_ += 1;
					this._reconnect_time_ = this._reconnect_time_default_ * this._connection_attempts_;
				}
				else{
					that.status('Could not reconnect after ' + that._connection_attempts_ + ' attempts, please try again later');
					that.status_("disconnected");
				}
				
			}
		};

		return Ws;
	}
);