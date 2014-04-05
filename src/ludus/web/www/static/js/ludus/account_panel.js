define(
	["knockout"], 
	function(ko){

		function AccountPanel(appl){
			this.appl = appl;
			this.template = "account-panel";
			this.user = this.appl.user;
			this.image_url = ko.observable(null);
			this.edit_name = ko.observable(null);
			this.edit_old_password = ko.observable(null);
			this.edit_password = ko.observable(null);

			this.user.subscribe(function(value){
				if(this.user().image == null) {
					this.image_url(null);
				}
				else {
					this.image_url( '/uploads/' + this.user().image );
				}
			}, this);

			$('#username').tooltip();
			$('#email').tooltip();
		}

		AccountPanel.prototype.change_username = function(value) {
			this.appl.send({method:"update_username", kwargs:{
														user_id: this.user().id,
														name: value
														}
				}, function(response) {
					if(response.error) {
						this.appl.error(response.error);
					}
					else {
						this.user().name = response.result.name;
					}
				}, this
			);
		};

		AccountPanel.prototype.change_password = function(old_pass, new_pass) {
			this.appl.send({method:"update_password", kwargs:{
														user_id: this.user().id,
														old_password: old_pass, 
														password: new_pass
														}
				}, function(response) {
					if(response.error) {
						this.appl.error(response.error);
					}
					else {
						this.appl.notify("Password was successfully changed", "notify", 4000);
					}
				}, this
			);
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