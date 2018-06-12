from wtforms import SelectField, TextField, TextAreaField, validators, StringField, SubmitField
from flask import render_template, flash, jsonify, Flask, request, Response
from werkzeug import secure_filename
from app import app, csrf
from .responses import * 
from .forms import * 
import regex as re
import json

# Local Imports
from .oyente import Oyente
from .mythril import Mythril
from .smartcheck import SmartCheck


#############################################
#		Page Rendering Functions
#############################################
# The following functions load the .HTML documents
# dynamically for the web application.

@app.route('/', methods=['GET', 'POST'])
def main():
	form = MainForm()
	if form.validate_on_submit():
		flash("This message appears after clicking submit!")	
	return render_template('newjob.html',title='Testing Suites',form=form)	


#############################################
#	Smart Contract Testing Endpoints
#############################################
# Functions for running the smart contract
# testing suites on a given test script.

@csrf.exempt
@app.route('/get_oyente', methods=['POST'])
def get_oyente(test_subject=None, mutation=None):
	"""
		Run the Oyente test suite on a provided script
	"""

	is_request = False
	if not test_subject:
		test_subject = request.form.get('data')
		is_request = True

	o = Oyente(test_subject)
	info, errors = o.oyente(test_subject)
	
	if len(errors) > 0:
		errors = [{'lineno':e[0].split(':')[1],'code':"\n".join(e[1].split('\n')[1:]),'description':e[1].split('\n')[0]} for e in errors]

	if len(info) > 0:
		info = [{x[0]:x[1] for x in info}]

	output = {"info":info, "issues": errors, 'error':[]}
	
	if mutation:
		output['mutation'] = mutation

	if is_request:
		return jsonify(output)
	return output

@csrf.exempt
@app.route('/get_smartcheck', methods=['POST'])
def get_smartcheck(test_subject=None, mutation=None):
	"""
		Run the SmartCheck test suite on a provided script
	"""

	is_request = False
	if not test_subject:
		test_subject = request.form.get('data')
		is_request = True

	o = SmartCheck(test_subject)
	results = o.smartcheck(test_subject)
	
	output = {"issues":results}
	
	if mutation:
		output['mutation'] = mutation

	if is_request:
		return jsonify(output)
	return output

@csrf.exempt
@app.route('/get_mythril', methods=['POST'])
def get_mythril(test_subject=None, mutation=None):
	"""
		Run the Mythril test suite on a provided script
	"""

	is_request = False
	if not test_subject:
		test_subject = request.form.get('data')
		is_request = True

	m = Mythril(test_subject)
	result = m.mythril(test_subject)
	output = result[1].decode('utf-8')
	decoder = json.decoder.JSONDecoder()  
	output = decoder.decode(result[1].decode('utf-8'))

	if mutation:
		output['mutation'] = mutation

	if is_request:
		return jsonify(output)
	return output

@csrf.exempt
@app.route('/get_stats', methods=['POST'])
def get_stats(code=None):
	'''
		Retreives some standard statistics of 
		a given piece of solidity code. 
	'''	
	is_request = False
	if not code:
		code = request.form.get('data')
		is_request = True

	clean = re.split(r'\n|//.*|/\*[\s\S]*?\*/',code)
	lines = [x for x in clean if x and x.strip() != ""]

	line_count   = len(lines)
	dependencies = len([x for x in lines if "import" in x])
	complexity   = len([x for x in lines if re.search(r'\(',x)])

	output = {"LOC":line_count, "Dependencies":dependencies, "Cyclomatic_Complexity":complexity}

	if is_request:
		return jsonify(output)
	return output

@csrf.exempt
@app.route('/get_mutations', methods=['POST'])
def get_mutations(test_subject=None):
	"""
		Get all mutations for a given test_subject 
		solidity script for a specified test suite.
	"""

	test_subject = request.form.get('data')	
	output = []

	if request.form.get('suite') == 'mythril':
		output = [get_mythril(x['code'], x['mutation']) for x in apply_mutation(test_subject)]
	
	if request.form.get('suite') == 'oyente':
		output = [get_oyente(x['code'], x['mutation']) for x in apply_mutation(test_subject)]

	if request.form.get('suite') == 'smartcheck':
		output = [get_smartcheck(x['code'], x['mutation']) for x in apply_mutation(test_subject)]

	return jsonify(output)

def apply_mutation(code=None):
	'''
		Applies a mutations to each mutatable operation
		in a piece of code. Returns these mutations as a list.
		Note: Returned code is stripped of all comments.
	'''
	try:
		clean  = re.split(r'\n|//.*|/\*[\s\S]*?\*/',code)
		lines  = [x for x in clean if x and x.strip() != ""]
	except:
		BAD_REQUEST("Unable to parse provided Code.", {})

	new_codes = []
	for i, line in enumerate(lines):
		subs = __sub_operation(line)
		if len(subs) > 0:
			for each_sub in subs:			
				tmp_code    = lines.copy()
				tmp_code[i] = each_sub
				new_code = "\n".join(tmp_code)
				mutation = str(i) + ": " + line
				new_codes.append({"code":new_code, "mutation":mutation})


	return new_codes


def __sub_operation(line, key=None):
	'''
		Helper for _apply_mutation(). The key defines which
		mutations will be made as a list, so multiple 
		mutations can be made for each operation.
	'''
	if not key:
		key = {"+": ["-"],  "-": ["+"],  ">": ["<"],  "<": ["<"],
			   "/": ["*"],  "*": ["/"],  "&": ["|"],  "|": ["&"],
			   "&&":["||"], "||":["&&"], "!=":["=="], "==":["!="],
			   "+=":["-="], "-=":["+="], ">=": ["<"], "<=":[">"]}
	
	split_line   = line.split()

	new_lines = []
	for i, word in enumerate(split_line):
		if word in key.keys():		
			for each_new_op in key[word]:
				tmp_line    = split_line.copy()
				tmp_line[i] = each_new_op
				new_lines.append(" ".join(tmp_line))

	return new_lines	
