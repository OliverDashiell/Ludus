define(
	["jquery", "knockout"], 
	function($, ko){

		function PropertiesEditor(appl, editor){
			this.appl = appl;
			this.editor = editor;

			this.selected_property = ko.observable(null);
			this.selected_layer_property = ko.observable(null);
			this.show_property_edit = ko.observable(null);

			this.components = ko.observableArray([
				{
					name:"Gravity"
				},
				{
					name:"Solid"
				},
				{
					name:"Collector",
					to_collect:4,
					on_finish:"End Game"
				},
				{
					name:"Collectable",
					who:["Collector"]
				}
			]);

			this.actions = ko.observableArray([
				{
					name:"Oscillate",
					y: 0,
	                x: 8*16,
	                trigger: "Start",
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
				},
				{
					name:"Stop On",
					what:["Solid"]
				}
			]);

			this.editor.editing_sprite.subscribe(function(value) {
				this.selected_property(null);
				this.selected_layer_property(null);
			}, this);

			this.selected_property.subscribe(function(value) {
				if(value) {
					this.selected_layer_property(null);
				}
			}, this);

			this.selected_layer_property.subscribe(function(value) {
				if(value) {
					this.selected_property(null);
				}
			}, this);
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

		PropertiesEditor.prototype.add_layer_property = function(item) {
			if( this.editor.editing_sprite() ) {
				var layer = this.editor.editing_sprite().layer();
				var properties = layer.properties();

				if(!this.property_exists( properties, item)) {
					// pass off update to function on layers editor
					this.editor.add_layer_property(layer, item);
				}
				else {
					this.appl.notify("Cannot add the same property more than once.", "warning", 4000);

					// remove item just added
					var index = this.get_property_index(properties, item);
					properties.splice(index, 1);
				}
			}
		};

		PropertiesEditor.prototype.remove_property = function() {
			var item = this.selected_property();

			if(item) {
				var index = this.editor.get_sprite_index( this.editor.editing_sprite().name() );

				if(index != -1) {
					var objects = this.editor.game().state.objects;

					if(objects[index].properties && this.property_exists( objects[index].properties, item)){ 
						var p_index = this.get_property_index(objects[index].properties, item);

						objects[index].properties.splice(p_index, 1);
						this.editor.save_game();
					}
				}
			}
			else {
				item = this.selected_layer_property();

				if(item) {
					var layer = this.editor.editing_sprite().layer();

					this.editor.remove_layer_property(layer, item);
				}
			}			
		};

		PropertiesEditor.prototype.update_property = function(form) {
			var index = this.editor.get_sprite_index( this.editor.editing_sprite().name() );

			if(index != -1) {
				var objects = this.editor.game().state.objects;

				if(objects[index].properties && this.property_exists( objects[index].properties, form.name)){ 
					var p_index = this.get_property_index(objects[index].properties, form.name);

					// update at p_index
				}
			}
		};

		return PropertiesEditor;
	}
);