from wtforms import SelectField, TextField, TextAreaField, validators, StringField, SubmitField
from flask import render_template, flash, jsonify, Flask, request, Response
from werkzeug import secure_filename
from app import app, csrf
from .responses import * 
from .forms import * 

########################## 
# OYENTE Imports
from .oyente import Oyente
########################## 


#############################################
#		Page Rendering Functions
#############################################

@app.route('/', methods=['GET', 'POST'])
def main():
	form = MainForm()
	if form.validate_on_submit():
		flash("This message appears after clicking submit!")	
	return render_template('index.html',title='MainForm',form=form)	


@app.route('/_get_oyente', methods=['POST'])
def get_oyente():
	########################## 
	# Put Oyente Function Here
	##########################
	o = Oyente(request.form['code'])
	info, errors = o.oyente(o.s)
	output = {"info":info, "errors": errors}
	return STATUS_OK("Done",output)


@app.route('/_get_mythril', methods=['GET'])
def _get_mythril():
	########################## 
	# Put Oyente Function Here
	##########################
	output = {"Var1":0}
	return STATUS_OK("Done",output)
