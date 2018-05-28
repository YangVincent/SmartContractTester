var RowManager = function(table){

	this.table = table;
	this.element = $("<div class='tabulator-tableHolder' tabindex='0'></div>"); //containing element
	this.tableElement = $("<div class='tabulator-table'></div>"); //table element
	this.columnManager = null; //hold column manager object
	this.height = 0; //hold height of table element

	this.firstRender = false; //handle first render
	this.renderMode = "classic"; //current rendering mode

	this.rows = []; //hold row data objects
	this.activeRows = []; //rows currently available to on display in the table
	this.activeRowsCount = 0; //count of active rows

	this.displayRows = []; //rows currently on display in the table
	this.displayRowsCount = 0; //count of display rows

	this.scrollTop = 0;
	this.scrollLeft = 0;

	this.vDomRowHeight = 20; //approximation of row heights for padding

	this.vDomTop = 0; //hold position for first rendered row in the virtual DOM
	this.vDomBottom = 0; //hold possition for last rendered row in the virtual DOM

	this.vDomScrollPosTop = 0; //last scroll position of the vDom top;
	this.vDomScrollPosBottom = 0; //last scroll position of the vDom bottom;

	this.vDomTopPad = 0; //hold value of padding for top of virtual DOM
	this.vDomBottomPad = 0; //hold value of padding for bottom of virtual DOM

	this.vDomMaxRenderChain = 90; //the maximum number of dom elements that can be rendered in 1 go

	this.vDomWindowBuffer = 0; //window row buffer before removing elements, to smooth scrolling

	this.vDomWindowMinTotalRows = 20; //minimum number of rows to be generated in virtual dom (prevent buffering issues on tables with tall rows)
	this.vDomWindowMinMarginRows = 5; //minimum number of rows to be generated in virtual dom margin

	this.vDomTopNewRows = []; //rows to normalize after appending to optimize render speed
	this.vDomBottomNewRows = []; //rows to normalize after appending to optimize render speed
};

//////////////// Setup Functions /////////////////

//return containing element
RowManager.prototype.getElement = function(){
	return this.element;
};

//return table element
RowManager.prototype.getTableElement = function(){
	return this.tableElement;
};

//return position of row in table
RowManager.prototype.getRowPosition = function(row, active){
	if(active){
		return this.activeRows.indexOf(row);
	}else{
		return this.rows.indexOf(row);
	}
};


//link to column manager
RowManager.prototype.setColumnManager = function(manager){
	this.columnManager = manager;
};

RowManager.prototype.initialize = function(){
	var self = this;

	self.setRenderMode();

	//initialize manager
	self.element.append(self.tableElement);

	self.firstRender = true;

	//scroll header along with table body
	self.element.scroll(function(){
		var left = self.element[0].scrollLeft;

		//handle horizontal scrolling
		if(self.scrollLeft != left){
			self.columnManager.scrollHorizontal(left);

			if(self.table.options.groupBy){
				self.table.extensions.groupRows.scrollHeaders(left);
			}

			if(self.table.extExists("columnCalcs")){
				self.table.extensions.columnCalcs.scrollHorizontal(left);
			}
		}

		self.scrollLeft = left;
	});

	//handle virtual dom scrolling
	if(this.renderMode === "virtual"){

		self.element.scroll(function(){
			var top = self.element[0].scrollTop;
			var dir = self.scrollTop > top;

			//handle verical scrolling
			if(self.scrollTop != top){
				self.scrollTop = top;
				self.scrollVertical(dir);
			}else{
				self.scrollTop = top;
			}

		});
	}
};


////////////////// Row Manipulation //////////////////

RowManager.prototype.findRow = function(subject){
	var self = this;

	if(typeof subject == "object"){

		if(subject instanceof Row){
			//subject is row element
			return subject;
		}else if(subject instanceof RowComponent){
			//subject is public row component
			return subject._getSelf() || false;
		}else if(subject instanceof jQuery){
			//subject is a jquery element of the row
			let match = self.rows.find(function(row){
				return row.element === subject;
			});

			return match || false;
		}

	}else{
		//subject should be treated as the index of the row
		let match = self.rows.find(function(row){
			return row.data[self.table.options.index] == subject;
		});

		return match || false;
	}

	//catch all for any other type of input

	return false;
};

RowManager.prototype.getRowFromPosition = function(position, active){
	if(active){
		return this.activeRows[position];
	}else{
		return this.rows[position];
	}
}

RowManager.prototype.scrollToRow = function(row){
	var rowIndex = this.displayRows.indexOf(row);

	if(rowIndex > -1){
		switch(this.renderMode){
			case"classic":
			this.element.scrollTop(row.element.offset().top - this.element.offset().top + this.element.scrollTop());
			break;
			case"virtual":
			this._virtualRenderFill(rowIndex, true);
			break;
		}
	}else{
		console.warn("Scroll Error - Row not visible");
	}
};


////////////////// Data Handling //////////////////

RowManager.prototype.setData = function(data){
	var self = this;

	self.table.options.dataLoading(data);

	self.rows.forEach(function(row){
		row.wipe();
	});

	self.rows = [];

	if(this.table.options.history && this.table.extExists("history")){
		this.table.extensions.history.clear();
	}

	if(Array.isArray(data)){

		if(this.table.extExists("selectRow")){
			this.table.extensions.selectRow.clearSelectionData();
		}

		data.forEach(function(def, i){
			var row = new Row(def, self);

			self.rows.push(row);
		});

		self.table.options.dataLoaded(data);

		self.refreshActiveData(true);
	}else{
		console.error("Data Loading Error - Unable to process data due to invalid data type \nExpecting: array \nReceived: ", typeof data, "\nData:     ", data);
	}
};

RowManager.prototype.deleteRow = function(row){
	var allIndex = this.rows.indexOf(row),
	activeIndex = this.activeRows.indexOf(row),
	displayIndex = this.displayRows.indexOf(row);

	if(displayIndex > -1){
		this.displayRows.splice(displayIndex, 1);
	}

	if(activeIndex > -1){
		this.activeRows.splice(activeIndex, 1);
	}

	if(allIndex > -1){
		this.rows.splice(allIndex, 1);
	}

	this.setActiveRows(this.activeRows);

	this.setDisplayRows(this.displayRows);

	this.table.options.rowDeleted(row.getComponent());

	this.table.options.dataEdited(this.getData());

	if(this.table.options.pagination && this.table.extExists("page")){
		this.refreshActiveData()
	}else{
		if(this.table.options.groupBy && this.table.extExists("groupRows")){
			this.table.extensions.groupRows.updateGroupRows(true);
		}else{
			this.reRenderInPosition();
		}
	}
};

RowManager.prototype.addRow = function(data, pos, index, blockRedraw){

	var row = this.addRowActual(data, pos, index, blockRedraw);

	if(this.table.options.history && this.table.extExists("history")){
		this.table.extensions.history.action("rowAdd", row, {data:data, pos:pos, index:index});
	};

	return row;
};

//add multiple rows
RowManager.prototype.addRows = function(data, pos, index){
	var self = this,
	length = 0,
	rows = [];

	pos = this.findAddRowPos(pos);


	if(!Array.isArray(data)){
		data = [data];
	}

	length = data.length - 1;

	if((typeof index == "undefined" && pos) || (typeof index !== "undefined" && !pos)){
		data.reverse();
	}

	data.forEach(function(item, i){
		var row = self.addRow(item, pos, index, true);
		rows.push(row);
	});

	if(this.table.options.groupBy && this.table.extExists("groupRows")){
		this.table.extensions.groupRows.updateGroupRows(true);
	}else{
		this.reRenderInPosition();
	}

	//recalc column calculations if present
	if(this.table.extExists("columnCalcs")){
		this.table.extensions.columnCalcs.recalc(this.table.rowManager.displayRows);
	}

	return rows;
};

RowManager.prototype.findAddRowPos = function(pos){

	if(typeof pos === "undefined"){
		pos = this.table.options.addRowPos;
	}

	if(pos === "pos"){
		pos = true;
	}

	if(pos === "bottom"){
		pos = false;
	}

	return pos;
};


RowManager.prototype.addRowActual = function(data, pos, index, blockRedraw){
	var row = new Row(data || {}, this),
	top = this.findAddRowPos(pos);

	if(index){
		index = this.findRow(index);
	}

	if(this.table.options.groupBy && this.table.extExists("groupRows")){
		this.table.extensions.groupRows.assignRowToGroup(row);

		var groupRows = row.getGroup().rows;

		if(groupRows.length > 1){

			if(!index || (index && groupRows.indexOf(index) == -1)){
				if(top){
					if(groupRows[0] !== row){
						index = groupRows[0];
						this._moveRowInArray(row.getGroup().rows, row, index, top);
					}
				}else{
					if(groupRows[groupRows.length -1] !== row){
						index = groupRows[groupRows.length -1];
						this._moveRowInArray(row.getGroup().rows, row, index, top);
					}
				}
			}else{
				this._moveRowInArray(row.getGroup().rows, row, index, top);
			}
		}
	};

	if(index){
		let allIndex = this.rows.indexOf(index),
		activeIndex = this.activeRows.indexOf(index),
		displayIndex = this.displayRows.indexOf(index);

		if(displayIndex > -1){
			this.displayRows.splice((top ? displayIndex : displayIndex + 1), 0, row);
		}

		if(activeIndex > -1){
			this.activeRows.splice((top ? activeIndex : activeIndex + 1), 0, row);
		}

		if(allIndex > -1){
			this.rows.splice((top ? allIndex : allIndex + 1), 0, row);
		}

	}else{
		if(top){
			this.displayRows.unshift(row);
			this.activeRows.unshift(row);
			this.rows.unshift(row);
		}else{
			this.displayRows.push(row);
			this.activeRows.push(row);
			this.rows.push(row);
		}
	}

	this.setDisplayRows(this.displayRows)

	this.setActiveRows(this.activeRows);

	this.table.options.rowAdded(row.getComponent());

	this.table.options.dataEdited(this.getData());

	if(!blockRedraw){
		this.reRenderInPosition();
	}

	return row;
};

RowManager.prototype.moveRow = function(from, to, after){
	if(this.table.options.history && this.table.extExists("history")){
		this.table.extensions.history.action("rowMove", from, {pos:this.getRowPosition(from), to:to, after:after});
	};

	this.moveRowActual(from, to, after);

	this.table.options.rowMoved(from.getComponent());
};


RowManager.prototype.moveRowActual = function(from, to, after){
	this._moveRowInArray(this.rows, from, to, after);
	this._moveRowInArray(this.activeRows, from, to, after);
	this._moveRowInArray(this.displayRows, from, to, after);

	if(this.table.options.groupBy && this.table.extExists("groupRows")){
		var toGroup = to.getGroup();
		var fromGroup = from.getGroup();

		if(toGroup === fromGroup){
			this._moveRowInArray(toGroup.rows, from, to, after);
		}else{
			if(fromGroup){
				fromGroup.removeRow(from);
			}

			toGroup.insertRow(from, to, after);
		}
	}
};


RowManager.prototype._moveRowInArray = function(rows, from, to, after){
	var	fromIndex, toIndex, start, end;

	if(from !== to){

		fromIndex = rows.indexOf(from);

		if (fromIndex > -1) {

			rows.splice(fromIndex, 1);

			toIndex = rows.indexOf(to);

			if (toIndex > -1) {

				if(after){
					rows.splice(toIndex+1, 0, from);
				}else{
					rows.splice(toIndex, 0, from);
				}

			}else{
				rows.splice(fromIndex, 0, from);
			}
		}

		//restyle rows
		if(rows === this.displayRows){

			start = fromIndex < toIndex ? fromIndex : toIndex;
			end = toIndex > fromIndex ? toIndex : fromIndex +1;

			for(let i = start; i <= end; i++){
				if(rows[i]){
					this.styleRow(rows[i], i);
				}
			}
		}
	}
};

RowManager.prototype.clearData = function(){
	this.setData([]);
};

RowManager.prototype.getRowIndex = function(row){
	return this.findRowIndex(row, this.rows);
};


RowManager.prototype.getDisplayRowIndex = function(row){
	return this.findRowIndex(row, this.displayRows);
};

RowManager.prototype.nextDisplayRow = function(row){
	var index = this.getDisplayRowIndex(row),
	nextRow = false;

	if(index !== false && index < this.displayRowsCount -1){
		nextRow = this.displayRows[index+1];
	}

	return nextRow;
};

RowManager.prototype.prevDisplayRow = function(row){
	var index = this.getDisplayRowIndex(row),
	prevRow = false;

	if(index){
		prevRow = this.displayRows[index-1];
	}

	return prevRow;
};

RowManager.prototype.findRowIndex = function(row, list){
	var rowIndex;

	row = this.findRow(row);

	if(row){
		rowIndex = list.indexOf(row);

		if(rowIndex > -1){
			return rowIndex;
		}
	}

	return false;
};


RowManager.prototype.getData = function(active){
	var self = this,
	output = [];

	var rows = active ? self.activeRows : self.rows;

	rows.forEach(function(row){
		output.push(row.getData(true));
	});

	return output;
};

RowManager.prototype.getHtml = function(active){
	var data = this.getData(active),
	columns = this.table.columnManager.getComponents(),
	header = "",
	body = "",
	table = "";

		//build header row
		columns.forEach(function(column){
			var def = column.getDefinition();

			if(column.getVisibility() && !def.hideInHtml){
				header += `<th>${(def.title || "")}</th>`;
			}
		})


		//build body rows
		data.forEach(function(rowData){
			var row = "";

			columns.forEach(function(column){
				var value = typeof rowData[column.getField()] === "undefined" ? "" : rowData[column.getField()] ;

				if(column.getVisibility()){
					row += `<td>${value}</td>`;
				}
			});

			body += `<tr>${row}</tr>`;
		});


		//build table
		table = `<table>
		<thead>
		<tr>${header}</tr>
		</thead>
		<tbody>${body}</tbody>
		</table>`;

		return table;
	};

	RowManager.prototype.getComponents = function(active){
		var self = this,
		output = [];

		var rows = active ? self.activeRows : self.rows;

		rows.forEach(function(row){
			output.push(row.getComponent());
		});

		return output;
	}

	RowManager.prototype.getDataCount = function(active){
		return active ? this.rows.length : this.activeRows.length;
	};

	RowManager.prototype._genRemoteRequest = function(){
		var self = this,
		table = self.table,
		options = table.options,
		params = {};

		if(table.extExists("page")){
		//set sort data if defined
		if(options.ajaxSorting){
			let sorters = self.table.extensions.sort.getSort();

			sorters.forEach(function(item){
				delete item.column;
			});

			params[self.table.extensions.page.paginationDataSentNames.sorters] = sorters;
		}

		//set filter data if defined
		if(options.ajaxFiltering){
			let filters = self.table.extensions.filter.getFilters(true, true);

			params[self.table.extensions.page.paginationDataSentNames.filters] = filters;
		}


		self.table.extensions.ajax.setParams(params, true);
	}

	table.extensions.ajax.sendRequest(function(data){
		self.setData(data);
	});
};

//choose the path to refresh data after a filter update
RowManager.prototype.filterRefresh = function(){
	var table = this.table,
	options = table.options,
	left = this.scrollLeft;

	if(options.ajaxFiltering){
		if(options.pagination == "remote" && table.extExists("page")){
			table.extensions.page.reset(true);
			table.extensions.page.setPage(1);
		}else{
			//assume data is url, make ajax call to url to get data
			this._genRemoteRequest();
		}
	}else{
		this.refreshActiveData();
	}

	this.scrollHorizontal(left);
};

//choose the path to refresh data after a sorter update
RowManager.prototype.sorterRefresh = function(){
	var table = this.table,
	options = this.table.options,
	left = this.scrollLeft;

	if(options.ajaxSorting){
		if(options.pagination == "remote" && table.extExists("page")){
			table.extensions.page.reset(true);
			table.extensions.page.setPage(1);
		}else{
			//assume data is url, make ajax call to url to get data
			this._genRemoteRequest();
		}
	}else{
		this.refreshActiveData();
	}

	this.scrollHorizontal(left);
};

RowManager.prototype.scrollHorizontal = function(left){
	this.scrollLeft = left;
	this.element.scrollLeft(left);
};

//set active data set
RowManager.prototype.refreshActiveData = function(dataChanged){
	var self = this,
	table = this.table;

	if(table.options.selectable && !table.options.selectablePersistence && table.extExists("selectRow")){
		table.extensions.selectRow.deselectRows();
	}

	//filter data
	if(table.extExists("filter")){
		if(table.extensions.filter.hasChanged() || dataChanged){
			self.setActiveRows(table.extensions.filter.filter(self.rows));

			dataChanged = true;
		}
	}else{
		self.setActiveRows(self.rows.slice(0));
	}

	//sort data
	if(table.extExists("sort")){
		if(table.extensions.sort.hasChanged() || dataChanged){
			table.extensions.sort.sort();

			dataChanged = true;
		}
	}

	//group data
	if(table.options.groupBy && table.extExists("groupRows")){
		self.setDisplayRows(table.extensions.groupRows.getRows(this.activeRows, dataChanged));

		if(table.options.pagination){
			console.warn("Invalid Setup Combination - Pagination and Row Grouping cannot be enabled at the same time");
		}
	}else{

		//paginate data
		if(table.options.pagination && table.extExists("page")){
			if(table.extensions.page.getMode() == "local"){
				if(dataChanged){
					table.extensions.page.reset();
				}
				table.extensions.page.setMaxRows(this.activeRows.length);
			}
			self.setDisplayRows(table.extensions.page.getRows(this.activeRows));
		}else{
			self.setDisplayRows(self.activeRows.slice(0));
		}
	}

	if(self.element.is(":visible")){
		self.renderTable();
		if(table.options.layoutColumnsOnNewData){
			self.table.columnManager.redraw(true);
		}
	}

	if(table.extExists("columnCalcs")){
		table.extensions.columnCalcs.recalc(this.displayRows);
	}
};

RowManager.prototype.setActiveRows = function(activeRows){
	this.activeRows = activeRows;
	this.activeRowsCount = this.activeRows.length;
};

RowManager.prototype.setDisplayRows = function(displayRows){
	this.displayRows = displayRows;

	if(this.table.extExists("frozenRows")){
		this.table.extensions.frozenRows.filterFrozenRows();
	}

	this.displayRowsCount = this.displayRows.length;
};

//return only actual rows (not group headers etc)
RowManager.prototype.getRows = function(){
	return this.rows;
};

///////////////// Table Rendering /////////////////

//trigger rerender of table in current position
RowManager.prototype.reRenderInPosition = function(){
	if(this.getRenderMode() == "virtual"){

		var scrollTop = this.element.scrollTop();
		var topRow = false;
		var topOffset = false;

		for(var i = this.vDomTop; i <= this.vDomBottom; i++){

			if(this.displayRows[i]){
				var diff = scrollTop - this.displayRows[i].getElement().position().top;

				if(topOffset === false || Math.abs(diff) < topOffset){
					topOffset = diff;
					topRow = i;
				}
			}
		}

		this._virtualRenderFill((topRow === false ? this.displayRows.length - 1 : topRow), true, topOffset || 0);
	}else{
		this.renderTable();
	}
};

RowManager.prototype.setRenderMode = function(){
	if((this.table.element.innerHeight() || this.table.options.height) && this.table.options.virtualDom && !this.table.options.pagination){
		this.renderMode = "virtual";
	}else{
		this.renderMode = "classic";
	}
}


RowManager.prototype.getRenderMode = function(){
	return this.renderMode;
};

RowManager.prototype.renderTable = function(){
	var self = this;

	self.table.options.renderStarted();

	self.element.scrollTop(0);

	switch(self.renderMode){
		case "classic":
		self._simpleRender();
		break;

		case "virtual":
		self._virtualRenderFill();
		break;
	}

	if(self.firstRender){
		if(self.displayRowsCount){
			self.firstRender = false;
			self.table.extensions.layout.layout();
		}else{
			self.renderEmptyScroll();
		}
	}

	if(self.table.extExists("frozenColumns")){
		self.table.extensions.frozenColumns.layout();
	}


	if(!self.displayRowsCount){
		if(self.table.options.placeholder){
			self.getElement().append(self.table.options.placeholder);
		}
	}

	self.table.options.renderComplete();
};

//simple render on heightless table
RowManager.prototype._simpleRender = function(){
	var self = this,
	element = this.tableElement;

	self._clearVirtualDom();

	if(self.displayRowsCount){
		self.displayRows.forEach(function(row, index){
			self.styleRow(row, index);
			element.append(row.getElement());
			row.initialize(true);
		});
	}else{
		self.renderEmptyScroll();
	}
};

//show scrollbars on empty table div
RowManager.prototype.renderEmptyScroll = function(){
	var self = this;
	self.tableElement.css({
		"min-width":self.table.columnManager.getWidth(),
		"min-height":"1px",
		"visibility":"hidden",
	});
};

RowManager.prototype._clearVirtualDom = function(){
	var element = this.tableElement;

	if(this.table.options.placeholder){
		this.table.options.placeholder.detach();
	}

	element.children().detach();

	element.css({
		"padding-top":"",
		"padding-bottom":"",
		"min-width":"",
		"min-height":"",
		"visibility":"",
	});

	this.scrollTop = 0;
	this.scrollLeft = 0;
	this.vDomTop = 0;
	this.vDomBottom = 0;
	this.vDomTopPad = 0;
	this.vDomBottomPad = 0;
};

RowManager.prototype.styleRow = function(row, index){
	if(index % 2){
		row.element.addClass("tabulator-row-even").removeClass("tabulator-row-odd");
	}else{
		row.element.addClass("tabulator-row-odd").removeClass("tabulator-row-even");
	}
};

//full virtual render
RowManager.prototype._virtualRenderFill = function(position, forceMove, offset){
	var self = this,
	element = self.tableElement,
	holder = self.element,
	topPad = 0,
	rowsHeight = 0,
	topPadHeight = 0,
	i = 0;

	position = position || 0;

	offset = offset || 0;

	if(!position){
		self._clearVirtualDom();
	}else{
		element.children().detach();

		//check if position is too close to bottom of table
		let heightOccpied = (self.displayRowsCount - position + 1) * self.vDomRowHeight

		if(heightOccpied < self.height){
			position -= Math.ceil((self.height - heightOccpied) / self.vDomRowHeight);

			if(position < 0){
				position = 0;
			}
		}

		//calculate initial pad
		topPad = Math.min(Math.max(Math.floor(self.vDomWindowBuffer / self.vDomRowHeight),  self.vDomWindowMinMarginRows), position);
		position -= topPad;
	}


	if(self.displayRowsCount && self.element.is(":visible")){

		self.vDomTop = position;

		self.vDomBottom = position -1;

		while ((rowsHeight <= self.height + self.vDomWindowBuffer || i < self.vDomWindowMinTotalRows) && self.vDomBottom < self.displayRowsCount -1){
			var index = self.vDomBottom + 1,
			row = self.displayRows[index];

			self.styleRow(row, index);

			element.append(row.getElement());
			if(!row.initialized){
				row.initialize(true);
			}else{
				if(!row.heightInitialized){
					row.normalizeHeight(true);
				}
			}

			if(i < topPad){
				topPadHeight += row.getHeight();
			}else{
				rowsHeight += row.getHeight();
			}

			self.vDomBottom ++;
			i++;
		}

		if(!position){
			this.vDomTopPad = 0;
			//adjust rowheight to match average of rendered elements
			self.vDomRowHeight = Math.floor((rowsHeight + topPadHeight) / i);
			self.vDomBottomPad = self.vDomRowHeight * (self.displayRowsCount - self.vDomBottom -1);

			self.vDomScrollHeight = topPadHeight + rowsHeight + self.vDomBottomPad - self.height;
		}else{
			self.vDomTopPad = !forceMove ? self.scrollTop - topPadHeight : (self.vDomRowHeight * this.vDomTop) + offset;
			self.vDomBottomPad = self.vDomBottom == self.displayRowsCount-1 ? 0 : Math.max(self.vDomScrollHeight - self.vDomTopPad - rowsHeight - topPadHeight, 0);
		}

		element[0].style.paddingTop = self.vDomTopPad + "px";
		element[0].style.paddingBottom = self.vDomBottomPad + "px";

		if(forceMove){
			this.scrollTop = self.vDomTopPad + (topPadHeight) + offset;
		}

		this.scrollTop = Math.min(this.scrollTop, this.element[0].scrollHeight - this.height);

		//adjust for horizontal scrollbar if present
		if(this.element[0].scrollWidth > this.element[0].offsetWidt){
			this.scrollTop += this.element[0].offsetHeight - this.element[0].clientHeight;
		}

		this.vDomScrollPosTop = this.scrollTop;
		this.vDomScrollPosBottom = this.scrollTop;

		holder.scrollTop(this.scrollTop);

		if(self.table.options.groupBy){
			if(self.table.extensions.layout.getMode() != "fitDataFill" && self.displayRowsCount == self.table.extensions.groupRows.countGroups()){

				self.tableElement.css({
					"min-width":self.table.columnManager.getWidth(),
				});
			}
		}

	}else{
		this.renderEmptyScroll();
	}
};

//handle vertical scrolling
RowManager.prototype.scrollVertical = function(dir){
	var topDiff = this.scrollTop - this.vDomScrollPosTop;
	var bottomDiff = this.scrollTop - this.vDomScrollPosBottom;
	var margin = this.vDomWindowBuffer * 2;

	if(-topDiff > margin || bottomDiff > margin){
		//if big scroll redraw table;
		this._virtualRenderFill(Math.floor((this.element[0].scrollTop / this.element[0].scrollHeight) * this.displayRowsCount));
	}else{

		if(dir){
			//scrolling up
			if(topDiff < 0){
				this._addTopRow(-topDiff)
			}

			if(topDiff < 0){

				//hide bottom row if needed
				if(this.vDomScrollHeight - this.scrollTop > this.vDomWindowBuffer){
					this._removeBottomRow(-bottomDiff);
				}
			}
		}else{
			//scrolling down
			if(topDiff >= 0){

				//hide top row if needed
				if(this.scrollTop > this.vDomWindowBuffer){
					this._removeTopRow(topDiff);
				}
			}

			if(bottomDiff >= 0){
				this._addBottomRow(bottomDiff);
			}
		}
	}
};

RowManager.prototype._addTopRow = function(topDiff, i=0){
	var table = this.tableElement;

	if(this.vDomTop){
		let index = this.vDomTop -1,
		topRow = this.displayRows[index],
		topRowHeight = topRow.getHeight() || this.vDomRowHeight;

		//hide top row if needed
		if(topDiff >= topRowHeight){
			this.styleRow(topRow, index);
			table.prepend(topRow.getElement());
			if(!topRow.initialized || !topRow.heightInitialized){
				this.vDomTopNewRows.push(topRow);

				if(!topRow.heightInitialized){
					topRow.clearCellHeight();
				}
			}
			topRow.initialize();

			this.vDomTopPad -= topRowHeight;

			if(this.vDomTopPad < 0){
				this.vDomTopPad = index * this.vDomRowHeight;
			}

			if(!index){
				this.vDomTopPad = 0;
			}

			table[0].style.paddingTop = this.vDomTopPad + "px";
			this.vDomScrollPosTop -= topRowHeight;
			this.vDomTop--;
		}

		topDiff = -(this.scrollTop - this.vDomScrollPosTop);

		if(i < this.vDomMaxRenderChain && this.vDomTop && topDiff >= (this.displayRows[this.vDomTop -1].getHeight() || this.vDomRowHeight)){
			this._addTopRow(topDiff, i+1);
		}else{
			this._quickNormalizeRowHeight(this.vDomTopNewRows);
		}

	}

};

RowManager.prototype._removeTopRow = function(topDiff){
	var table = this.tableElement,
	topRow = this.displayRows[this.vDomTop],
	topRowHeight = topRow.getHeight() || this.vDomRowHeight;

	if(topDiff >= topRowHeight){

		topRow.element.detach();

		this.vDomTopPad += topRowHeight;
		table[0].style.paddingTop = this.vDomTopPad + "px";
		this.vDomScrollPosTop += this.vDomTop ? topRowHeight : topRowHeight + this.vDomWindowBuffer;
		this.vDomTop++;

		topDiff = this.scrollTop - this.vDomScrollPosTop;

		this._removeTopRow(topDiff);
	}

};

RowManager.prototype._addBottomRow = function(bottomDiff, i=0){
	var table = this.tableElement;

	if(this.vDomBottom < this.displayRowsCount -1){
		let index = this.vDomBottom + 1,
		bottomRow = this.displayRows[index],
		bottomRowHeight = bottomRow.getHeight() || this.vDomRowHeight;

		//hide bottom row if needed
		if(bottomDiff >= bottomRowHeight){
			this.styleRow(bottomRow, index);
			table.append(bottomRow.getElement());

			if(!bottomRow.initialized || !bottomRow.heightInitialized){
				this.vDomBottomNewRows.push(bottomRow);

				if(!bottomRow.heightInitialized){
					bottomRow.clearCellHeight();
				}
			}

			bottomRow.initialize();

			this.vDomBottomPad -= bottomRowHeight;

			if(this.vDomBottomPad < 0 || index == this.displayRowsCount -1){
				this.vDomBottomPad = 0;
			}

			table[0].style.paddingBottom = this.vDomBottomPad + "px";
			this.vDomScrollPosBottom += bottomRowHeight;
			this.vDomBottom++;
		}

		bottomDiff = this.scrollTop - this.vDomScrollPosBottom;

		if(i < this.vDomMaxRenderChain && this.vDomBottom < this.displayRowsCount -1 && bottomDiff >= (this.displayRows[this.vDomBottom + 1].getHeight() || this.vDomRowHeight)){
			this._addBottomRow(bottomDiff, i+1);
		}else{
			this._quickNormalizeRowHeight(this.vDomBottomNewRows);
		}
	}
};

RowManager.prototype._removeBottomRow = function(bottomDiff){
	var table = this.tableElement,
	bottomRow = this.displayRows[this.vDomBottom],
	bottomRowHeight = bottomRow.getHeight() || this.vDomRowHeight;

	if(bottomDiff >= bottomRowHeight){

		bottomRow.element.detach();

		this.vDomBottomPad += bottomRowHeight;

		if(this.vDomBottomPad < 0){
			this.vDomBottomPad == 0;
		}

		table[0].style.paddingBottom = this.vDomBottomPad + "px";
		this.vDomScrollPosBottom -= bottomRowHeight;
		this.vDomBottom--;

		bottomDiff = -(this.scrollTop - this.vDomScrollPosBottom);

		this._removeBottomRow(bottomDiff);
	}
};

RowManager.prototype._quickNormalizeRowHeight = function(rows){
	rows.forEach(function(row){
		row.calcHeight();
	});

	rows.forEach(function(row){
		row.setCellHeight();
	});

	rows.length = 0;
};

//normalize height of active rows
RowManager.prototype.normalizeHeight = function(){
	var self = this;

	self.displayRows.forEach(function(row){
		row.normalizeHeight();
	});
};

//adjust the height of the table holder to fit in the Tabulator element
RowManager.prototype.adjustTableSize = function(){
	var self = this;

	if(this.renderMode === "virtual"){

		let otherHeight = self.columnManager.getElement().outerHeight() + (self.table.footerManager ? self.table.footerManager.getElement().outerHeight() : 0);

		self.element.css({
			"min-height":"calc(100% - " + otherHeight + "px)",
			"height":"calc(100% - " + otherHeight + "px)",
			"max-height":"calc(100% - " + otherHeight + "px)",
		});

		self.height = self.element.innerHeight();
		self.vDomWindowBuffer = self.table.options.virtualDomBuffer || self.height;
	}
};

//renitialize all rows
RowManager.prototype.reinitialize = function(){
	this.rows.forEach(function(row){
		row.reinitialize();
	});
};


//redraw table
RowManager.prototype.redraw = function (force){
	var pos = 0,
	left = this.scrollLeft;

	this.adjustTableSize();

	if(!force){

		if(self.renderMode == "simple"){
			this._simpleRender();
		}else{
			this.reRenderInPosition();
			this.scrollHorizontal(left);
		}

		if(!this.displayRowsCount){
			if(this.table.options.placeholder){
				this.getElement().append(this.table.options.placeholder);
			}
		}

	}else{
		this.renderTable();
	}
};

RowManager.prototype.resetScroll = function(){
	this.element.scrollLeft(0);
	this.element.scrollTop(0);
	this.element.scroll();
};