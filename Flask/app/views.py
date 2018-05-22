from wtforms import SelectField, TextField, TextAreaField, validators, StringField, SubmitField
from flask import render_template, flash, jsonify, Flask, request, Response
from werkzeug import secure_filename
from app import app, csrf
from .responses import * 
from .forms import * 
import regex as re

########################## 
# OYENTE Imports
from .oyente import Oyente
########################## 

############################
# MYTRHIL Imports
from .mythril import Mythril
############################


#############################################
#		Page Rendering Functions
#############################################

@app.route('/', methods=['GET', 'POST'])
def main():
	form = MainForm()
	if form.validate_on_submit():
		flash("This message appears after clicking submit!")	
	return render_template('newjob.html',title='MainForm',form=form)

@app.route('/home', methods=['GET'])
def home():
	return render_template('home.html',title='Home Page')

@app.route('/build', methods=['GET'])
def newjob():
	return render_template('newjob.html',title='New Job')	

@csrf.exempt
@app.route('/submit', methods=['POST'])
def submit():

	test_subject = request.form.get('data')
	output = {}

	if request.form.get('oyente') == 'true':
		output['oyente'] = get_oyente(test_subject)
	if request.form.get('mythril') == 'true':
		output['mythril'] = get_mythril(test_subject)

	return jsonify(output)

@app.route('/_get_oyente', methods=['POST'])
def get_oyente(test_subject):
	########################## 
	# Put Oyente Function Here
	##########################
	o = Oyente(test_subject)
	info, errors = o.oyente(test_subject)
	output = {"info":info, "errors": errors}
	return output


@app.route('/_get_mythril', methods=['POST'])
def get_mythril(test_subject):
	########################## 
	# Put Mythril Function Here
	##########################
	m = Mythril(test_subject)
	result = m.mythril(test_subject)
	output = result[1].decode('utf-8')
	return output

@app.route('/_get_stats', methods=['GET'])
def _get_stats():
	'''
		Retreives some standard statistics of 
		a given piece of solidity code. 
	'''
	try:
		code  = request.form['code']
		clean = re.split(r'\n|//.*|/\*[\s\S]*?\*/',code)
		lines = [x for x in clean if x and x.strip() != ""]
	except:
		BAD_REQUEST("Unable to parse provided Code.", {})

	line_count   = len(lines)
	dependencies = len([x for x in lines if "import" in x])
	complexity   = len([x for x in lines if re.search(r'\(',x)])

	output = {"LOC":line_count, "Dependencies":dependencies, "Cyclomatic_Complexity":complexity}
	STATUS_OK("Done", output)

@app.route('/_apply_mutation', methods=['POST'])
def _apply_mutation():
	'''
		Applies a mutations to each mutatable operation
		in a piece of code. Returns these mutations as a list.
		Note: Returned code is stripped of all comments.
	'''
	try:
		code   = request.form['code']
		op_key = request.form['op_key']
		clean  = re.split(r'\n|//.*|/\*[\s\S]*?\*/',code)
		lines  = [x for x in clean if x and x.strip() != ""]
	except:
		BAD_REQUEST("Unable to parse provided Code.", {})

	new_codes = []
	for i, line in enumerate(lines):
		subs = sub_operation(line, op_key)
		if len(subs) > 0:
			for each_sub in subs:			
				tmp_code    = lines.copy()
				tmp_code[i] = each_sub
				new_codes.append("\n".join(tmp_code))

	return new_codes


def sub_operation(line, key=None):
	'''
		Helper for _apply_mutation(). The key defines which
		mutations will be made as a list, so multiple 
		mutations can be made for each operation.
	'''
	if not key:
		key = {"+": ["-"],  "-": ["+"],  ">": ["<"],  "<": ["<"],
			   "/": ["*"],  "*": ["/"],  "&": ["|"],  "|": ["&"],
			   "&&":["||"], "||":["&&"], "!=":["=="], "==":["!="]}

	split_line   = line.split()

	new_lines = []
	for i, word in enumerate(split_line):
		if word in key.keys():		
			for each_new_op in key[word]:
				tmp_line    = split_line.copy()
				tmp_line[i] = each_new_op
				new_lines.append(" ".join(tmp_line))

	return new_lines				
