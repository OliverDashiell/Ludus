define(
	["jquery", "knockout"], 
	function($, ko){

		function PropertiesEditor(appl, editor){
			this.appl = appl;
			this.editor = editor;

			this.selected_property = ko.observable(null);
			this.show_property_edit = ko.observable(null);

			this.components = ko.observableArray([
				{
					name:"Gravity"
				},
				{
					name:"Solid"
				}
			]);

			this.actions = ko.observableArray([
				{
					name:"Oscillate",
					y: 0,
	                x: 8*16,
	                trigger: "start",
	                timeout: 100,
	                duration: 1000
				},
				{
					name:"Twoway",
					move_speed:3,
					jump_speed:3
				},
				{
					name:"Fourway",
					move_speed:3
				}
			]);
		}

		PropertiesEditor.prototype.property_exists = function(list, property) {
			var i,item,items = list;

			for (i = 0; i < items.length; i++) {
				item = items[i];

				if(item.name == property.name){
					return true;
				}
			}

			return false;
		};

		PropertiesEditor.prototype.get_property_index = function(list, property) {
			var i,item,items = list;

			for (i = 0; i < items.length; i++) {
				item = items[i];

				if(item == property){
					return i;
				}
			}

			return -1;
		};

		PropertiesEditor.prototype.add_property = function(item) {
			var index = this.editor.get_sprite_index( this.editor.editing_sprite().name() );

			if(index != -1) {
				var objects = this.editor.game().state.objects;

				if(objects[index].properties){
					if(!this.property_exists( objects[index].properties, item)){
						objects[index].properties.push(item);
						this.editor.save_game();
						return item;
					}
					else {
						this.appl.notify("Cannot add the same property more than once.", "warning", 4000);

						// remove item just added
						var p = this.editor.editing_sprite().properties();
						var p_index = this.get_property_index(p, item);
						p.splice(p_index, 1);
					}
				}
				else {
					// if obj has no properties create list and add
					objects[index].properties = new Array();
					objects[index].properties.push(item);
					this.editor.save_game();
					return item;
				}
			}
		};

		PropertiesEditor.prototype.remove_property = function() {
			var item = this.selected_property();
			var index = this.editor.get_sprite_index( this.editor.editing_sprite().name() );

			if(index != -1) {
				var objects = this.editor.game().state.objects;

				if(objects[index].properties && this.property_exists( objects[index].properties, item)){ 
					var p_index = this.get_property_index(objects[index].properties, item);

					objects[index].properties.splice(p_index, 1);
					this.editor.save_game();
				}
			}
		};

		PropertiesEditor.prototype.update_property = function(form) {
			var index = this.editor.get_sprite_index( this.editor.editing_sprite().name() );

			if(index != -1) {
				var objects = this.editor.game().state.objects;

				if(objects[index].properties && this.property_exists( objects[index].properties, form.name)){ 
					var p_index = this.get_property_index(objects[index].properties, form.name);


				}
			}
		};

		return PropertiesEditor;
	}
);