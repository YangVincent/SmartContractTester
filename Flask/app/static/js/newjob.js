var editor;
var jsondata;
var output;

function inject_editor(container) {
	editor = ace.edit(container);
	editor.setTheme("ace/theme/monokai");
	editor.session.setMode("ace/mode/solidity");
	editor.session.setValue("//SAMPLE CONTRACT\ncontract HoneyPot {\n\tmapping (address => uint) public balances;\n\tfunction HoneyPot() payable {\n\t\tput();\n\t}\n\tfunction put() payable {\n\t\tbalances[msg.sender] = msg.value;\n\t}\n\tfunction get() {\n\t\tif (!msg.sender.call.value(balances[msg.sender])()) {\n\t\t\tthrow;\n\t\t}\n\t\tbalances[msg.sender] = 0;\n\t}\n\tfunction() {\n\t\tthrow;\n\t}\n}\n");
}

function submit_job() {
	jsondata = {
		data: editor.session.getValue(),
		oyente: $("#tool-oyente")[0].checked,
		mythril: $("#tool-mythril")[0].checked,
		mutants: $("#option-mutants")[0].checked
	};

	d3.selectAll('#result').remove();
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
			alert(JSON.stringify(json));
			d3.selectAll('#loading').remove();
			var container = d3.select('#output').append('div').attr('id', 'result');

			if (output['oyente'] != null) {

				container.append('hr');
				container.append('h4').text('Oyente');
				container.append('hr');

				var table = container.append('table');

				var herror = table.append('tr');
				herror.append('th').text("Errors");
				herror.append('th').text("");

				for (var i in output['oyente']['errors']) {
					var row = table.append('tr');
					row.append('td').text(output['oyente']['errors'][i][0]);
					row.append('td').text(output['oyente']['errors'][i][1]);
				}
				if (output['oyente']['errors'].length == 0) {
					var row = table.append('tr');
					row.append('td').text("No Errors");
					row.append('td').text("");
				}


				var hinfo = table.append('tr');
				hinfo.append('th').text("Info");
				hinfo.append('th').text("");

				for (var i in output['oyente']['info']) {
					var row = table.append('tr');
					row.append('td').text(output['oyente']['info'][i][0]);
					row.append('td').text(output['oyente']['info'][i][1]);
				}
				if (output['oyente']['info'].length == 0) {
					var row = table.append('tr');
					row.append('td').text("No Info");
					row.append('td').text("");
				}
			}

			if (output['mythril'] != null) {
				var mjson = JSON.parse(output['mythril']);
				container.append('hr').attr('id','output');
				container.append('h4').text('Mythril');
				container.append('hr');

				var table = container.append('table');

				for(var i in mjson) {
					var d = mjson[i];

					var type = table.append('tr');
					type.append('th').text(d['type']);
					type.append('th').text('');

					var title = table.append('tr');
					title.append('td').text('Title:');
					title.append('td').text(d['title']);

					var func = table.append('tr');
					func.append('td').text('Function:');
					func.append('td').text(d['function']);

					var addr = table.append('tr');
					addr.append('td').text('Address:');
					addr.append('td').text(d['address']);

					var desc = table.append('tr');
					desc.append('td').text('Description:');
					desc.append('td').text(d['description']);
				}
			}

			if (output['oyente_mutations']) {
				// Print oyente mutations
				// which is just a list of 
				// same output returned by get_oyente
			}

			if (output['mythril_mutations']) {
				// Print mythril mutations
				// which is just a list of 
				// same output returned by get_mythril
			}

			if (output['stats']) {
				// Prints stats for the script
				// Which is a dictionary of the form
				// {"LOC":line_count, "Dependencies":dependencies, "Cyclomatic_Complexity":complexity}
			}
		}
	});
}