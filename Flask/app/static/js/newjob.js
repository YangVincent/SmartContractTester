var editor;
var jsondata;
var output;
var Range = require("ace/range").Range;

var oyente = [];
var mythril = [];
var smartcheck = [];

var taggedRows = [];
var taggedRanges = [];
var highlighted = [];
var containers = ["#output1", "#output2", "#output3"];

var default_contract = "contract ByteExtractor {\n\n    address creator;\n\n    function ByteExtractor() {\n        creator = msg.sender;\n    }\n    \n    function getByteFromByte8(bytes8 _b8, uint8 byteindex) public constant returns(byte) {\n    \tuint numdigits = 16;\n    \tuint buint = uint(_b8);\n    \tuint upperpowervar = 16 ** (numdigits - (byteindex*2)); \t\t// @i=0 upperpowervar=16**64, @i=1 upperpowervar=16**62, @i upperpowervar=16**60\n    \tuint lowerpowervar = 16 ** (numdigits - 2 - (byteindex*2));\t\t// @i=0 upperpowervar=16**62, @i=1 upperpowervar=16**60, @i upperpowervar=16**58\n    \tuint postheadchop = buint % upperpowervar; \t\t\t\t// @i=0 _b32=a1b2c3d4... postheadchop=a1b2c3d4, @i=1 postheadchop=b2c3d4, @i=2 postheadchop=c3d4\n    \tuint remainder = postheadchop % lowerpowervar; \t\t\t// @i=0 remainder=b2c3d4, @i=1 remainder=c3d4, @i=2 remainder=d4\n    \tuint evenedout = postheadchop - remainder; \t\t\t\t// @i=0 evenedout=a1000000, @i=1 remainder=b20000, @i=2 remainder=c300\n    \tuint b = evenedout / lowerpowervar; \t\t\t\t\t// @i=0 b=a1, @i=1 b=b2, @i=2 b=c3\n    \treturn byte(b);\n    }\n    \n    //returns a byte (of the range 0-255) from a bytes32\n    function getByteFromByte32(bytes32 _b32, uint8 byteindex) public constant returns(byte) {\n    \tuint numdigits = 64;\n    \tuint buint = uint(_b32);\n    \tuint upperpowervar = 16 ** (numdigits - (byteindex*2)); \t\t// @i=0 upperpowervar=16**64 (SEE EXCEPTION BELOW), @i=1 upperpowervar=16**62, @i upperpowervar=16**60\n    \tuint lowerpowervar = 16 ** (numdigits - 2 - (byteindex*2));\t\t// @i=0 upperpowervar=16**62, @i=1 upperpowervar=16**60, @i upperpowervar=16**58\n    \tuint postheadchop;\n    \tif(byteindex == 0)\n    \t\tpostheadchop = buint; \t\t\t\t\t\t\t\t//for byteindex 0, buint is just the input number. 16^64 is out of uint range, so this exception has to be made.\n    \telse\n    \t\tpostheadchop = buint % upperpowervar; \t\t\t\t// @i=0 _b32=a1b2c3d4... postheadchop=a1b2c3d4, @i=1 postheadchop=b2c3d4, @i=2 postheadchop=c3d4\n    \tuint remainder = postheadchop % lowerpowervar; \t\t\t// @i=0 remainder=b2c3d4, @i=1 remainder=c3d4, @i=2 remainder=d4\n    \tuint evenedout = postheadchop - remainder; \t\t\t\t// @i=0 evenedout=a1000000, @i=1 remainder=b20000, @i=2 remainder=c300\n    \tuint b = evenedout / lowerpowervar; \t\t\t\t\t// @i=0 b=a1, @i=1 b=b2, @i=2 b=c3\n    \treturn byte(b);\n    }\n    \n    // returns a uint8 of the range 0-255 from a bytes32\n    function getUint8FromByte32(bytes32 _b32, uint8 byteindex) public constant returns(uint8) {\n    \tuint numdigits = 64;\n    \tuint buint = uint(_b32);\n    \tuint upperpowervar = 16 ** (numdigits - (byteindex*2)); \t\t// @i=0 upperpowervar=16**64 (SEE EXCEPTION BELOW), @i=1 upperpowervar=16**62, @i upperpowervar=16**60\n    \tuint lowerpowervar = 16 ** (numdigits - 2 - (byteindex*2));\t\t// @i=0 upperpowervar=16**62, @i=1 upperpowervar=16**60, @i upperpowervar=16**58\n    \tuint postheadchop;\n    \tif(byteindex == 0)\n    \t\tpostheadchop = buint; \t\t\t\t\t\t\t\t//for byteindex 0, buint is just the input number. 16^64 is out of uint range, so this exception has to be made.\n    \telse\n    \t\tpostheadchop = buint % upperpowervar; \t\t\t\t// @i=0 _b32=a1b2c3d4... postheadchop=a1b2c3d4, @i=1 postheadchop=b2c3d4, @i=2 postheadchop=c3d4\n    \tuint remainder = postheadchop % lowerpowervar; \t\t\t// @i=0 remainder=b2c3d4, @i=1 remainder=c3d4, @i=2 remainder=d4\n    \tuint evenedout = postheadchop - remainder; \t\t\t\t// @i=0 evenedout=a1000000, @i=1 remainder=b20000, @i=2 remainder=c300\n    \tuint b = evenedout / lowerpowervar; \t\t\t\t\t// @i=0 b=a1 (to uint), @i=1 b=b2, @i=2 b=c3\n    \treturn uint8(b);\n    }\n    \n    // returns a uint of the range 0-15\n    function getDigitFromByte32(bytes32 _b32, uint8 index) public constant returns(uint) {\n    \tuint numdigits = 64;\n    \tuint buint = uint(_b32);\n    \tuint upperpowervar = 16 ** (numdigits - index); \t\t// @i=0 upperpowervar=16**64, @i=1 upperpowervar=16**63, @i upperpowervar=16**62\n    \tuint lowerpowervar = 16 ** (numdigits - 1 - index);\t\t// @i=0 upperpowervar=16**63, @i=1 upperpowervar=16**62, @i upperpowervar=16**61\n    \tuint postheadchop = buint % upperpowervar; \t\t\t\t// @i=0 _b32=a1b2c3d4... postheadchop=a1b2c3d4, @i=1 postheadchop=b2c3d4, @i=2 postheadchop=c3d4\n    \tuint remainder = postheadchop % lowerpowervar; \t\t\t// @i=0 remainder=b2c3d4, @i=1 remainder=c3d4, @i=2 remainder=d4\n    \tuint evenedout = postheadchop - remainder; \t\t\t\t// @i=0 evenedout=a1000000, @i=1 remainder=b20000, @i=2 remainder=c300\n    \tuint b = evenedout / lowerpowervar; \t\t\t\t\t// @i=0 b=a, @i=1 b=1, @i=2 b=b\n    \treturn b;\n    }\n    \n    // does this work? Doesn't seem quite right. uint256 is much larger than bytes32, why are we guaranteeing 64 digits? Me = confused\n    function getDigitFromUint(uint buint, uint8 index) public constant returns(uint) {\n    \tuint numdigits = 64;\n    \tuint upperpowervar = 10 ** (numdigits - index); \t\t// @i=0 upperpowervar=10**64, @i=1 upperpowervar=10**63, @i upperpowervar=10**62\n    \tuint lowerpowervar = 10 ** (numdigits - 1  -index);\t\t// @i=0 upperpowervar=10**63, @i=1 upperpowervar=10**62, @i upperpowervar=10**61\n    \tuint postheadchop = buint % upperpowervar; \t\t\t\t// @i=0 _b32=a1b2c3d4... postheadchop=a1b2c3d4, @i=1 postheadchop=b2c3d4, @i=2 postheadchop=c3d4\n    \tuint remainder = postheadchop % lowerpowervar; \t\t\t// @i=0 remainder=b2c3d4, @i=1 remainder=c3d4, @i=2 remainder=d4\n    \tuint evenedout = postheadchop - remainder; \t\t\t\t// @i=0 evenedout=a1000000, @i=1 remainder=b20000, @i=2 remainder=c300\n    \tuint b = evenedout / lowerpowervar; \t\t\t\t\t// @i=0 b=a1, @i=1 b=b2, @i=2 b=c3\n    \treturn b;\n    }\n    \n    /**********\n     Standard kill() function to recover funds \n     **********/\n\n    function kill() {\n        if (msg.sender == creator) {\n            suicide(creator); // kills this contract and sends remaining funds back to creator\n        }\n    }\n}\n"

function inject_editor(container) {
	editor = ace.edit(container);
	editor.setTheme("ace/theme/monokai");
	editor.session.setMode("ace/mode/solidity");
	editor.session.setValue(default_contract);
	editor.setOptions({ 'maxLines': 33 });
	editor.on("guttermousedown", function(e) {
		var target = e.domEvent.target;
		if (target.className.indexOf("ace_gutter-cell") == -1)
			return;
		if (!editor.isFocused())
			return;
		if (e.clientX > 25 + target.getBoundingClientRect().left)
			return;

		var row = e.getDocumentPosition().row;
		if (taggedRows.includes(row+1))
			e.editor.session.clearBreakpoint(row);
		else
			e.editor.session.setBreakpoint(row);
		e.stop();
	});
	editor.session.on("changeBreakpoint", function(e) {
		taggedRows = [];
		Array.prototype.forEach.call(editor.session.getBreakpoints(), function(d, i) {
			if (d != "") taggedRows.push(i+1);
		});
		if (taggedRows.length % 2 == 0)
			set_tagged_ranges();
	});
	$(window).resize();
}

function submit_job() {
	jsondata = {
		data: editor.session.getValue(),
		oyente: $("#tool-oyente")[0].checked,
		mythril: $("#tool-mythril")[0].checked,
		smartcheck: $("#tool-smartcheck")[0].checked,
		mutants: $("#option-mutants")[0].checked
	};

	d3.select('#stats').selectAll('*').remove();	
	print_results("#output1", []);
	print_results("#output2", []);
	print_results("#output3", []);
	d3.select('#id-output1').selectAll('*').remove();	
	d3.select('#id-output2').selectAll('*').remove();	
	d3.select('#id-output3').selectAll('*').remove();	

	d3.select('#output').append('p').attr('id', 'loading')
		.text('Loading... This can take awhile.');

	// Get Stats
	$.ajax({
		url: '/get_stats',
		type: 'POST',
		dataType: 'json',
		data: jsondata,
		success:function(json) {			
			if (json) {
				var table = d3.select('#stats').append('table').classed('tbl-stats results',true);				
				print_table_header(table, json);
				print_table_data(table, json);				
			}
		}
	});

	if (jsondata.oyente) {
		d3.select('#output').append('p').attr('id', 'loading-oyente')
			.text('Loading Oyente Suite ..........');
		$.ajax({
			url: '/get_oyente',
			type: 'POST',
			dataType: 'json',
			data: jsondata,
			success:function(json) {
				
				if (json) {
					d3.select("#id-output1").text('Oyente').style('display','');
					oyente = json['issues'];
					oyente.map(d=>d['mutant'] = 0);	
					print_results("#output1", oyente);													
				}else{
					print_results("#output1", []);													
				}		
				d3.select("#loading-oyente").remove();			
			}
		});		
	}

	if (jsondata.mythril) {
		d3.select('#output').append('p').attr('id', 'loading-mythril')
			.text('Loading Mythril Suite ..........');
		$.ajax({
			url: '/get_mythril',
			type: 'POST',
			dataType: 'json',
			data: jsondata,
			success:function(json) {
				
				if (json) {
					d3.select("#id-output2").text('Mythril').style('display','');
					mythril = json['issues'];	
					mythril.map(d=>d['mutant'] = 0);	
					print_results("#output2", mythril);				
				}else {
					print_results("#output2", []);
				}
				d3.select("#loading-mythril").remove();			
			}
		});		
	}

	if (jsondata.smartcheck) {
		d3.select('#output').append('p').attr('id', 'loading-smartcheck')
			.text('Loading SmartCheck Suite ..........');
		$.ajax({
			url: '/get_smartcheck',
			type: 'POST',
			dataType: 'json',
			data: jsondata,
			success:function(json) {
				if (json) {
					d3.select("#id-output3").text('SmartCheck').style('display','');
					smartcheck = json['issues'];
					smartcheck.map(d=>d['mutant'] = 0);	
					print_results("#output3", smartcheck);													
				}else{
					print_results("#output3", []);													
				}		
				d3.select("#loading-smartcheck").remove();			
			}
		});		
	}

	if (jsondata.oyente && jsondata.mutants) {
		d3.select('#output').append('p').attr('id', 'loading-oyente-mutations')
			.text('Loading Oyente Mutations ..........');
		jsondata.suite = "oyente";
		$.ajax({
		url: '/get_mutations',
		type: 'POST',
		dataType: 'json',
		data: jsondata,
		success:function(json) {

			if (json) {
				for (i in json){
					errors = json[i]['issues']
					if (errors && errors.length > 0) {
						errors.map(d => d['mutant'] = +(i+1));
						errors.map(d => d['mutation'] = json[i]['mutation']);
						errors.forEach(d=>oyente.push(d));											   
					}					
				}	
				print_results("#output1", oyente);				
			}
			d3.select("#loading-oyente-mutations").remove();			
		  }
		});
	}

	if (jsondata.mythril && jsondata.mutants) {
		d3.select('#output').append('p').attr('id', 'loading-mythril-mutations')
			.text('Loading Mythril Mutations ..........');
		jsondata.suite = "mythril";
		$.ajax({
		url: '/get_mutations',
		type: 'POST',
		dataType: 'json',
		data: jsondata,
		success:function(json) {

			if (json) {
				for (i in json){
					errors = json[i]['issues']
					if (errors && errors.length > 0) {
						errors.map(d => d['mutant'] = +(i+1));
						errors.forEach(d=>mythril.push(d));
					}
				}
				print_results("#output2", mythril);
			}			
			d3.select("#loading-mythril-mutations").remove();
		  }		  		  		  
		});
	}	

	if (jsondata.smartcheck && jsondata.mutants) {
		d3.select('#output').append('p').attr('id', 'loading-smartcheck-mutations')
			.text('Loading SmartCheck Mutations ..........');
		jsondata.suite = "smartcheck";
		$.ajax({
		url: '/get_mutations',
		type: 'POST',
		dataType: 'json',
		data: jsondata,
		success:function(json) {

			if (json) {
				for (i in json){
					errors = json[i]['issues']
					if (errors && errors.length > 0) {
						errors.map(d => d['mutant'] = +(i+1));
						errors.forEach(d=>smartcheck.push(d));
					}
				}
				print_results("#output3", smartcheck);
			}			
			d3.select("#loading-smartcheck-mutations").remove();
		  }		  		  		  
		});
	}	
	d3.select("#loading").remove();			
}

function print_results(container, results) {

	if (results && results.length > 0){		
		if (!$(container).hasClass("tabulator")) {
			$(container).tabulator({
			    height: 130, 
			    layout:"fitColumns",
			    responsiveLayout:true,
			    layoutColumnsOnNewData:true,
			    selectable:100,
			    placeholder:"No Bugs",
			    initialSort: [{column:"lineno",dir:"asc"}, {column:'mutant',dir:"asc"}],    
			    columns: [
					{title:"", field:"mutant", width:5, sorter:"number", align:"right"},
					{title:"Line", field:"lineno",width:70, sorter:"number", align:"right"},
					{title:"Code",field:"code", width:200, align:"left"},
					{title:"Description",field:"description", align:"left"},
					{title:"Mutation",field:"mutation", align:"left"}
				]
			});	
		}									
	}
	if ($(container).hasClass("tabulator"))
		$(container).tabulator("setData", results);	

	taggedRanges.forEach(d=>select_row_in_range(container, d.min, d.max));
}

function print_table_header(table, data) {
	table.append('tr')
		 .selectAll('td')
	 	 .data(Object.keys(data))
	 	 .enter()
	 	   .append('th')		 	 
	 	   .text(d=>d);
}

function print_table_data(table, data) {
	table.append('tr')
		 .selectAll('td')
	 	 .data(Object.keys(data))
	 	 .enter()
	 	   .append('th')		 	 
	 	   .text(d=>data[d]);
}



// Tagging stuff
function clear_highlight(marker) {
    editor.getSession().removeMarker(marker);
}

function highlight_rows(start, end) {
    highlighted.push(editor.getSession().addMarker(new Range(start-1, 0, end-1, 2000), "selected", "fullLine", true));
}

function set_tagged_ranges() {
	
	taggedRanges = [];

	highlighted.forEach(clear_highlight);
	highlighted = [];

	var current_pair = {'min':-1, 'max':-1};
	taggedRows.forEach(function(d,i){
		if (i % 2){
			current_pair.max = d;
			taggedRanges.push(current_pair);
			highlight_rows(current_pair.min, current_pair.max);
			containers.forEach(d=>select_row_in_range(d, current_pair.min, current_pair.max));
			current_pair = {'min':-1, 'max':-1};			
		} else {
			current_pair.min = d;			
		}
	});

}

function select_row_in_range(container, start, end) {
	if ($(container).hasClass("tabulator")){
		var rows = $(container).tabulator("getRows");
		rows.forEach(d => $(container).tabulator("deselectRow", d));
		rows = rows.filter(d=>+d.getData().lineno > start && +d.getData().lineno < end);		
		rows.forEach(d => d.select());
	}
}
// ------------------------------------------

window.onresize = function(){
	if (window.innerWidth <= 990){
		editor.setOptions({ 'maxLines': 20 });
		d3.select("#code-panel").style('height','350px');
	} else {
		editor.setOptions({ 'maxLines': 33 });
		d3.select("#code-panel").style('height','500px');
	}
}