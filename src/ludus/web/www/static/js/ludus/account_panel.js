define(
	["knockout"], 
	function(ko){

		function AccountPanel(appl){
			this.appl = appl;
			this.template = "account-panel";
			this.user = this.appl.user;
		}

		return AccountPanel;
	}
);