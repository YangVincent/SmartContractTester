var editor;
var jsondata;
var output;

var oyente;
var mythril;

var default_contract = "contract ByteExtractor {\n\n    address creator;\n\n    function ByteExtractor() {\n        creator = msg.sender;\n    }\n    \n    function getByteFromByte8(bytes8 _b8, uint8 byteindex) public constant returns(byte) {\n    \tuint numdigits = 16;\n    \tuint buint = uint(_b8);\n    \tuint upperpowervar = 16 ** (numdigits - (byteindex*2)); \t\t// @i=0 upperpowervar=16**64, @i=1 upperpowervar=16**62, @i upperpowervar=16**60\n    \tuint lowerpowervar = 16 ** (numdigits - 2 - (byteindex*2));\t\t// @i=0 upperpowervar=16**62, @i=1 upperpowervar=16**60, @i upperpowervar=16**58\n    \tuint postheadchop = buint % upperpowervar; \t\t\t\t// @i=0 _b32=a1b2c3d4... postheadchop=a1b2c3d4, @i=1 postheadchop=b2c3d4, @i=2 postheadchop=c3d4\n    \tuint remainder = postheadchop % lowerpowervar; \t\t\t// @i=0 remainder=b2c3d4, @i=1 remainder=c3d4, @i=2 remainder=d4\n    \tuint evenedout = postheadchop - remainder; \t\t\t\t// @i=0 evenedout=a1000000, @i=1 remainder=b20000, @i=2 remainder=c300\n    \tuint b = evenedout / lowerpowervar; \t\t\t\t\t// @i=0 b=a1, @i=1 b=b2, @i=2 b=c3\n    \treturn byte(b);\n    }\n    \n    //returns a byte (of the range 0-255) from a bytes32\n    function getByteFromByte32(bytes32 _b32, uint8 byteindex) public constant returns(byte) {\n    \tuint numdigits = 64;\n    \tuint buint = uint(_b32);\n    \tuint upperpowervar = 16 ** (numdigits - (byteindex*2)); \t\t// @i=0 upperpowervar=16**64 (SEE EXCEPTION BELOW), @i=1 upperpowervar=16**62, @i upperpowervar=16**60\n    \tuint lowerpowervar = 16 ** (numdigits - 2 - (byteindex*2));\t\t// @i=0 upperpowervar=16**62, @i=1 upperpowervar=16**60, @i upperpowervar=16**58\n    \tuint postheadchop;\n    \tif(byteindex == 0)\n    \t\tpostheadchop = buint; \t\t\t\t\t\t\t\t//for byteindex 0, buint is just the input number. 16^64 is out of uint range, so this exception has to be made.\n    \telse\n    \t\tpostheadchop = buint % upperpowervar; \t\t\t\t// @i=0 _b32=a1b2c3d4... postheadchop=a1b2c3d4, @i=1 postheadchop=b2c3d4, @i=2 postheadchop=c3d4\n    \tuint remainder = postheadchop % lowerpowervar; \t\t\t// @i=0 remainder=b2c3d4, @i=1 remainder=c3d4, @i=2 remainder=d4\n    \tuint evenedout = postheadchop - remainder; \t\t\t\t// @i=0 evenedout=a1000000, @i=1 remainder=b20000, @i=2 remainder=c300\n    \tuint b = evenedout / lowerpowervar; \t\t\t\t\t// @i=0 b=a1, @i=1 b=b2, @i=2 b=c3\n    \treturn byte(b);\n    }\n    \n    // returns a uint8 of the range 0-255 from a bytes32\n    function getUint8FromByte32(bytes32 _b32, uint8 byteindex) public constant returns(uint8) {\n    \tuint numdigits = 64;\n    \tuint buint = uint(_b32);\n    \tuint upperpowervar = 16 ** (numdigits - (byteindex*2)); \t\t// @i=0 upperpowervar=16**64 (SEE EXCEPTION BELOW), @i=1 upperpowervar=16**62, @i upperpowervar=16**60\n    \tuint lowerpowervar = 16 ** (numdigits - 2 - (byteindex*2));\t\t// @i=0 upperpowervar=16**62, @i=1 upperpowervar=16**60, @i upperpowervar=16**58\n    \tuint postheadchop;\n    \tif(byteindex == 0)\n    \t\tpostheadchop = buint; \t\t\t\t\t\t\t\t//for byteindex 0, buint is just the input number. 16^64 is out of uint range, so this exception has to be made.\n    \telse\n    \t\tpostheadchop = buint % upperpowervar; \t\t\t\t// @i=0 _b32=a1b2c3d4... postheadchop=a1b2c3d4, @i=1 postheadchop=b2c3d4, @i=2 postheadchop=c3d4\n    \tuint remainder = postheadchop % lowerpowervar; \t\t\t// @i=0 remainder=b2c3d4, @i=1 remainder=c3d4, @i=2 remainder=d4\n    \tuint evenedout = postheadchop - remainder; \t\t\t\t// @i=0 evenedout=a1000000, @i=1 remainder=b20000, @i=2 remainder=c300\n    \tuint b = evenedout / lowerpowervar; \t\t\t\t\t// @i=0 b=a1 (to uint), @i=1 b=b2, @i=2 b=c3\n    \treturn uint8(b);\n    }\n    \n    // returns a uint of the range 0-15\n    function getDigitFromByte32(bytes32 _b32, uint8 index) public constant returns(uint) {\n    \tuint numdigits = 64;\n    \tuint buint = uint(_b32);\n    \tuint upperpowervar = 16 ** (numdigits - index); \t\t// @i=0 upperpowervar=16**64, @i=1 upperpowervar=16**63, @i upperpowervar=16**62\n    \tuint lowerpowervar = 16 ** (numdigits - 1 - index);\t\t// @i=0 upperpowervar=16**63, @i=1 upperpowervar=16**62, @i upperpowervar=16**61\n    \tuint postheadchop = buint % upperpowervar; \t\t\t\t// @i=0 _b32=a1b2c3d4... postheadchop=a1b2c3d4, @i=1 postheadchop=b2c3d4, @i=2 postheadchop=c3d4\n    \tuint remainder = postheadchop % lowerpowervar; \t\t\t// @i=0 remainder=b2c3d4, @i=1 remainder=c3d4, @i=2 remainder=d4\n    \tuint evenedout = postheadchop - remainder; \t\t\t\t// @i=0 evenedout=a1000000, @i=1 remainder=b20000, @i=2 remainder=c300\n    \tuint b = evenedout / lowerpowervar; \t\t\t\t\t// @i=0 b=a, @i=1 b=1, @i=2 b=b\n    \treturn b;\n    }\n    \n    // does this work? Doesn't seem quite right. uint256 is much larger than bytes32, why are we guaranteeing 64 digits? Me = confused\n    function getDigitFromUint(uint buint, uint8 index) public constant returns(uint) {\n    \tuint numdigits = 64;\n    \tuint upperpowervar = 10 ** (numdigits - index); \t\t// @i=0 upperpowervar=10**64, @i=1 upperpowervar=10**63, @i upperpowervar=10**62\n    \tuint lowerpowervar = 10 ** (numdigits - 1  -index);\t\t// @i=0 upperpowervar=10**63, @i=1 upperpowervar=10**62, @i upperpowervar=10**61\n    \tuint postheadchop = buint % upperpowervar; \t\t\t\t// @i=0 _b32=a1b2c3d4... postheadchop=a1b2c3d4, @i=1 postheadchop=b2c3d4, @i=2 postheadchop=c3d4\n    \tuint remainder = postheadchop % lowerpowervar; \t\t\t// @i=0 remainder=b2c3d4, @i=1 remainder=c3d4, @i=2 remainder=d4\n    \tuint evenedout = postheadchop - remainder; \t\t\t\t// @i=0 evenedout=a1000000, @i=1 remainder=b20000, @i=2 remainder=c300\n    \tuint b = evenedout / lowerpowervar; \t\t\t\t\t// @i=0 b=a1, @i=1 b=b2, @i=2 b=c3\n    \treturn b;\n    }\n    \n    /**********\n     Standard kill() function to recover funds \n     **********/\n\n    function kill() {\n        if (msg.sender == creator) {\n            suicide(creator); // kills this contract and sends remaining funds back to creator\n        }\n    }\n}\n"

function inject_editor(container) {
	editor = ace.edit(container);
	editor.setTheme("ace/theme/monokai");
	editor.session.setMode("ace/mode/solidity");
	editor.session.setValue(default_contract);
	editor.setOptions({ 'maxLines': 25 });
}

function submit_job() {
	jsondata = {
		data: editor.session.getValue(),
		oyente: $("#tool-oyente")[0].checked,
		mythril: $("#tool-mythril")[0].checked,
		mutants: $("#option-mutants")[0].checked
	};

	d3.selectAll('.results').selectAll('*').remove();
	d3.select('#output').append('h4')
		.attr('id', 'loading')
		.text('Loading... This can take awhile.');


	$.ajax({
		url: '/submit',
		type: 'POST',
		dataType: 'json',
		data: jsondata,
		success:function(json) {
			output = json;
			d3.selectAll('#loading').remove();			
			var current = 1;

			if (output['stats']) {
				var table = d3.select('#stats').append('table').classed('tbl-stats results',true);				
				print_table_header(table, output['stats']);
				print_table_data(table, output['stats']);				
			}

			if (output['oyente']) {
				d3.select("#id-output"+current).text('Oyente').style('display','');
				print_results("#output"+current, output['oyente']);
				oyente = output['oyente']['issues'];
				current = current+1;				
			}

			if (output['oyente_mutations']) {
				// Print oyente mutations
				// which is just a list of 
				// same output returned by get_oyente
			}

			if (output['mythril']) {
				d3.select("#id-output"+current).text('Mythril').style('display','');
				print_results("#output"+current, output['mythril']);
				mythril = output['mythril']['issues'];
				current = current+1;				
			}

			if (output['mythril_mutations']) {
				// Print mythril mutations
				// which is just a list of 
				// same output returned by get_mythril
			}			
		}
	});
}

function print_results(container, results) {

	if (results['issues'] && results['issues'].length > 0){
		$(container).tabulator({
		    height: 200, 
		    selectable:1,
		    placeholder:"Errors",
		    initialSort: [{column:"lineno",dir:"asc"}],    
		    columns:[ //Define Table Columns		        
		        {title:"Line", field:"lineno", align:"right"},
		        {title:"Code",field:"code", align:"left"},
		        {title:"Description",field:"description", align:"left"}
		    ]
		});								
		$(container).tabulator("setData", results['issues']);
	}
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
