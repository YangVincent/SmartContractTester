var editor;
var jsondata;
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

	$.ajax({
		url: '/submit',
		type: 'POST',
		dataType: 'json',
		data: jsondata,
		success:function(json) {
			alert(json.result);
		}
	});
}