var Keybindings = function(table){
	this.table = table; //hold Tabulator object
	this.watchKeys = null;
	this.pressedKeys = null;
};


Keybindings.prototype.initialize = function(){
	var bindings = this.table.options.keybindings,
	mergedBindings = {};

	this.watchKeys = {};
	this.pressedKeys = [];

	if(bindings !== false){

		for(let key in this.bindings){
			mergedBindings[key] = this.bindings[key];
		}

		if(Object.keys(bindings).length){

			for(let key in bindings){
				mergedBindings[key] = bindings[key];
			}
		}

		this.mapBindings(mergedBindings);
		this.bindEvents();
	}
};

Keybindings.prototype.mapBindings = function(bindings){
	var self = this;

	for(let key in bindings){

		if(this.actions[key]){

			if(bindings[key]){

				if(typeof bindings[key] !== "object"){
					bindings[key] = [bindings[key]];
				}

				bindings[key].forEach(function(binding){
					self.mapBinding(key, binding);
				});
			}

		}else{
			console.warn("Key Binding Error - no such action:", key);
		}
	}
};

Keybindings.prototype.mapBinding = function(action, symbolsList){
	var self = this;

	var binding = {
		action: this.actions[action],
		keys: [],
		ctrl: false,
		shift: false,
	}

	var symbols = symbolsList.toString().toLowerCase().split(" ").join("").split("+");

	symbols.forEach(function(symbol){
		switch(symbol){
			case "ctrl":
			binding.ctrl = true;
			break;

			case "shift":
			binding.shift = true;
			break;

			default:
			symbol = parseInt(symbol);
			binding.keys.push(symbol);

			if(!self.watchKeys[symbol]){
				self.watchKeys[symbol] = [];
			}

			self.watchKeys[symbol].push(binding);
		}
	});
};

Keybindings.prototype.bindEvents = function(){
	var self = this;

	this.table.element.on("keydown", function(e){
		var code = e.keyCode;
		var bindings = self.watchKeys[code];

		if(bindings){

			self.pressedKeys.push(code);

			bindings.forEach(function(binding){
				self.checkBinding(e, binding);
			});
		}
	});

	this.table.element.on("keyup", function(e){
		var code = e.keyCode;
		var bindings = self.watchKeys[code];

		if(bindings){

			var index = self.pressedKeys.indexOf(code);

			if(index > -1){
				self.pressedKeys.splice(index, 1);
			}
		}
	});
};


Keybindings.prototype.checkBinding = function(e, binding){
	var self = this,
	match = true;

	if(e.ctrlKey == binding.ctrl && e.shiftKey == binding.shift){
		binding.keys.forEach(function(key){
			var index = self.pressedKeys.indexOf(key);

			if(index == -1){
				match = false;
			}
		});

		if(match){
			binding.action.call(self, e);
		}

		return true;
	}

	return false;
};

//default bindings
Keybindings.prototype.bindings = {
	navPrev:"shift + 9",
	navNext:9,
	navUp:38,
	navDown:40,
	scrollPageUp:33,
	scrollPageDown:34,
	scrollToStart:36,
	scrollToEnd:35,
	undo:"ctrl + 90",
	redo:"ctrl + 89",
};


//default actions
Keybindings.prototype.actions = {
	keyBlock:function(e){
		e.stopPropagation();
		e.preventDefault();
	},
	scrollPageUp:function(e){
		var rowManager = this.table.rowManager,
		newPos = rowManager.scrollTop - rowManager.height,
		scrollMax = rowManager.element[0].scrollHeight;

		e.preventDefault();

		if(rowManager.displayRowsCount){
			if(newPos >= 0){
				rowManager.element.scrollTop(newPos);
			}else{
				rowManager.scrollToRow(rowManager.displayRows[0]);
			}
		}

		this.table.element.focus();
	},
	scrollPageDown:function(e){
		var rowManager = this.table.rowManager,
		newPos = rowManager.scrollTop + rowManager.height,
		scrollMax = rowManager.element[0].scrollHeight;

		e.preventDefault();

		if(rowManager.displayRowsCount){
			if(newPos <= scrollMax){
				rowManager.element.scrollTop(newPos);
			}else{
				rowManager.scrollToRow(rowManager.displayRows[rowManager.displayRows.length - 1]);
			}
		}

		this.table.element.focus();

	},
	scrollToStart:function(e){
		var rowManager = this.table.rowManager;

		e.preventDefault();

		if(rowManager.displayRowsCount){
			rowManager.scrollToRow(rowManager.displayRows[0]);
		}

		this.table.element.focus();
	},
	scrollToEnd:function(e){
		var rowManager = this.table.rowManager;

		e.preventDefault();

		if(rowManager.displayRowsCount){
			rowManager.scrollToRow(rowManager.displayRows[rowManager.displayRows.length - 1]);
		}

		this.table.element.focus();
	},
	navPrev:function(e){
		var cell = false;

		if(this.table.extExists("edit")){
			cell = this.table.extensions.edit.currentCell;

			if(cell){
				e.preventDefault();
				cell.nav().prev();
			}
		}
	},

	navNext:function(e){
		var cell = false;

		if(this.table.extExists("edit")){
			cell = this.table.extensions.edit.currentCell;

			if(cell){
				e.preventDefault();
				cell.nav().next();
			}
		}
	},

	navLeft:function(e){
		var cell = false;

		if(this.table.extExists("edit")){
			cell = this.table.extensions.edit.currentCell;

			if(cell){
				e.preventDefault();
				cell.nav().left();
			}
		}
	},

	navRight:function(e){
		var cell = false;

		if(this.table.extExists("edit")){
			cell = this.table.extensions.edit.currentCell;

			if(cell){
				e.preventDefault();
				cell.nav().right();
			}
		}
	},

	navUp:function(e){
		var cell = false;

		if(this.table.extExists("edit")){
			cell = this.table.extensions.edit.currentCell;

			if(cell){
				e.preventDefault();
				cell.nav().up();
			}
		}
	},

	navDown:function(e){
		var cell = false;

		if(this.table.extExists("edit")){
			cell = this.table.extensions.edit.currentCell;

			if(cell){
				e.preventDefault();
				cell.nav().down();
			}
		}
	},

	undo:function(e){
		var cell = false;
		if(this.table.options.history && this.table.extExists("history") && this.table.extExists("edit")){

			cell = this.table.extensions.edit.currentCell;

			if(!cell){
				e.preventDefault();
				this.table.extensions.history.undo();
			}
		}
	},

	redo:function(e){
		var cell = false;
		if(this.table.options.history && this.table.extExists("history") && this.table.extExists("edit")){

			cell = this.table.extensions.edit.currentCell;

			if(!cell){
				e.preventDefault();
				this.table.extensions.history.redo();
			}
		}
	},

};


Tabulator.registerExtension("keybindings", Keybindings);