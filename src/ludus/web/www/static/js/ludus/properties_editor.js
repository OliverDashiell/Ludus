define(
	["jquery", "knockout", "./utils", "./model/properties/oscillate", "./model/properties/collector"], 
	function($, ko, utils, Oscillate, Collector){

		function PropertiesEditor(appl, editor){
			this.appl = appl;
			this.editor = editor;


			//---- Property Variables ----//
			this.id_seed = ko.observable(-1);
			this.selected_property = ko.observable(null);
			this.selected_layer_property = ko.observable(null);
			this.show_property_edit = ko.observable(null);


			//---- Prototype Component Objects ----//
			this.components = ko.observableArray([
				new Collector({}),
				{
					id:-1,
					name:"Collectable",
					who:["Collector"]
				},
				{
					id:-1,
					name:"Gravity"
				},
				{
					id:-1,
					name:"Solid"
				},
				{
					id:-1,
					name:"Deadly"
				}
			]);


			//---- Prototype Action Objects ----//
			this.actions = ko.observableArray([
				new Oscillate({}),
				{
					id:-1,
					name:"Twoway",
					move_speed:3,
					jump_speed:3
				},
				{
					id:-1,
					name:"Fourway",
					move_speed:3
				},
				{
					id:-1,
					name:"Stop On",
					what:["Solid"]
				},
				{
					id:-1,
					name:"Die On",
					what:["Deadly"],
					on_death:"End Game"
				}
			]);


			//---- Subscriptions ----//
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

		PropertiesEditor.prototype._init_ = function() {
			this.selected_property(null);
			this.selected_layer_property(null);
			this.show_property_edit(null);
		};

		PropertiesEditor.prototype.get_mapping_options = function() {
			return utils.get_property_mapping_options();
		};

		PropertiesEditor.prototype.get_seed_id = function() {
			var seed = this.id_seed();

			// increment the seed
			this.id_seed( seed+1 );

			return seed;
		};

		PropertiesEditor.prototype.show_edit = function(property) {
			if(property.visible){

				if(property.visible()){
					property.visible(false);
				}
				else {
					property.visible(true);
				}
				
			}
		};

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

				if(item.name == property.name){
					return i;
				}
			}

			return -1;
		};

		PropertiesEditor.prototype.add_property = function(item) {
			var index = this.editor.get_sprite_index( this.editor.editing_sprite().name() );

			if(index != -1) {
				var objects = this.editor.game().state.objects();

				if(!this.property_exists( objects[index].properties(), item)){

					var layer_properties = this.editor.editing_sprite().layer().properties();

					if(!this.property_exists( layer_properties, item)) {
						var id = this.get_seed_id();
						item.id = id;

						objects[index].properties.push(item);
						this.editor.save_game();
						return item;
					}
					else {
						this.appl.notify("This property already exsists on the layer.", "warning", 4000);
					}
				}
				else {
					this.appl.notify("Cannot add the same property more than once.", "warning", 4000);
				}
			}
		};

		PropertiesEditor.prototype.add_layer_property = function(item) {
			if( this.editor.editing_sprite() ) {
				var layer = this.editor.editing_sprite().layer();
				var properties = layer.properties();

				if(!this.property_exists( properties, item)) {
					var id = this.get_seed_id();
					item.id = id;

					// pass off update to function on layers editor
					this.editor.add_layer_property(layer, item);
				}
				else {
					this.appl.notify("Cannot add the same property more than once.", "warning", 4000);
				}
			}
		};

		PropertiesEditor.prototype.remove_property = function() {
			var item = this.selected_property();

			if(item) {
				var index = this.editor.get_sprite_index( this.editor.editing_sprite().name() );

				if(index != -1) {
					var objects = this.editor.game().state.objects();

					if(objects[index].properties && this.property_exists( objects[index].properties(), item)){ 
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
					// pass off update to function on layers editor
					this.editor.remove_layer_property(layer, item);
				}
			}			
		};

		PropertiesEditor.prototype.update_property = function(property) {
			var index = this.editor.get_sprite_index( this.editor.editing_sprite().name() );

			if(index != -1) {
				var objects = this.editor.game().state.objects();

				if(objects[index].properties && this.property_exists( objects[index].properties(), property )){ 
					// save property change
					this.editor.save_game();
				}
				else if(objects[index].layer().properties && this.property_exists( objects[index].layer().properties(), property )) {
					var layer = objects[index].layer();

					// pass off update to function on layers editor
					this.editor.update_layer_property(layer, property);
				}
			}
		};

		PropertiesEditor.prototype.before_obj_move = function(arg) {
			var obj_properties = this.editor.editing_sprite().properties;
			var layer_properties = this.editor.editing_sprite().layer().properties;

			if(arg.sourceParent == obj_properties) {
				if(arg.targetParent != obj_properties) {
					// remove from this list
					this.selected_property(arg.item);
					this.remove_property();
				}
			}
			else {
				if(arg.sourceParent == layer_properties) {
					// remove from layer list
					this.selected_layer_property(arg.item);
					this.remove_property();
				}

				if(arg.targetParent == obj_properties) {
					// add item to this list
					this.add_property(arg.item);
				}
			}
		};

		PropertiesEditor.prototype.before_layer_move = function(arg) {
			var obj_properties = this.editor.editing_sprite().properties;
			var layer_properties = this.editor.editing_sprite().layer().properties;

			if(arg.sourceParent == layer_properties) {
				if(arg.targetParent != layer_properties) {
					// remove from this list
					this.selected_layer_property(arg.item);
					this.remove_property();
				}
			}
			else {
				if(arg.sourceParent != layer_properties) {
					// remove from obj list
					this.selected_property(arg.item);
					this.remove_property();
				}

				if(arg.targetParent == layer_properties) {
					// add item to this list
					this.add_layer_property(arg.item);
				}
			}
		};

		return PropertiesEditor;
	}
);