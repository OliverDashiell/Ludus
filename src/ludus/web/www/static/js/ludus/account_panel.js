define(
	["knockout"], 
	function(ko){

		function AccountPanel(appl){
			this.appl = appl;
			this.template = "account-panel";
			this.user = this.appl.user;
			this.image_url = ko.observable(null);

			this.edit_name = ko.observable(null);
			this.edit_name_visible = ko.observable(null);

			this.user.subscribe(function(value){
				if(this.user().image == null) {
					this.image_url(null);
				}
				else {
					this.image_url( '/uploads/' + this.user().image );
				}

				if(this.user().name){
					this.edit_name(this.user().name);
				}
			}, this);

			$('#username').tooltip();
			$('#email').tooltip();
		}

		AccountPanel.prototype.change_username = function() {
			var value = this.edit_name();

			if(value != '' && value != this.user().name) {
				this.appl.send( {
						method:"update_username", 
						kwargs:{
							user_id: this.user().id,
							name: value
						}
					}, 
					function(response) {
						if(response.error) {
							this.appl.error(response.error);
							this.edit_name(this.user().name);
						}
						else {
							this.appl.user().name = response.result.name;
							this.appl.username(response.result.name);
						}
					}, this
				);
			}

			this.edit_name_visible(false);
		};

		AccountPanel.prototype.change_password = function(old_pass, new_pass) {
			var fail = false;

			if(!old_pass || old_pass == '') {
				fail = true;
				this.appl.notify("Must provide your old password.", "warning", 4000);
			}

			if(!fail && (!new_pass || new_pass == '')) {
				fail = true;
				this.appl.notify("Cannot change password to nothing.", "warning", 4000);
			}

			if(!fail && new_pass == old_pass){
				fail = true;
				this.appl.notify("Old password and new password are the same.", "warning", 4000);
			}

			if(!fail) {
				this.appl.send( {
						method:"update_password", 
						kwargs:{
							user_id: this.user().id,
							old_password: old_pass, 
							password: new_pass
						}
					}, 
					function(response) {
						if(response.error) {
							this.appl.error(response.error);
						}
						else {
							this.appl.notify("Password was successfully changed", "notify", 4000);
						}
					}, this
				);
			}

			return fail;
		};

		AccountPanel.prototype.get_password = function() {
			var that = this;
			var modal = $('#change_password_dlog').modal();
			var old_val = $('#old_val');
			var new_val = $('#new_val');

			var submit_btn = $('#change_password_button').click(function() {
				var fail = that.change_password(old_val[0].value, new_val[0].value);

				if(!fail) {
					modal.modal('hide');
				}
			});

			modal.modal('show');

			// must remove event handlers so that closures can be garbage collected
			modal.on('hidden.bs.modal', function(e) {
				modal.off('hidden.bs.modal');
				submit_btn.off('click');
			});
		};

		AccountPanel.prototype.change_image = function(value) {
			this.appl.send({method:"update_image", kwargs:{
													user_id: this.user().id,
													image: value
													}
				}, function(response) {
					if(response.error) {
						this.appl.error(response.error);
					}
					else {
						this.user().image = response.result.image;
						this.image_url( '/uploads/' + this.user().image );
					}
				}, this
			);
		};

		AccountPanel.prototype.add_image = function() {
			var that = this;
			var modal = $('#upload_user_dlog').modal();

			var upload_btn = $('#upload_user_button').click(function() {
				var form = modal.find("form");

				form.ajaxSubmit({
					success: function(response){
						console.log(response);

						// get result[0].actual and put it into the user info
						that.change_image( response.result[0].actual );

						modal.modal('hide');
					}
				});
			});

			modal.modal('show');

			// must remove event handlers so that closures can be garbage collected
			modal.on('hidden.bs.modal', function(e) {
				modal.off('hidden.bs.modal');
				upload_btn.off('click');
			});
		};

		return AccountPanel;
	}
);