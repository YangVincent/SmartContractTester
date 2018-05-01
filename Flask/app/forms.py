from flask_wtf import FlaskForm
from flask_wtf.file import FileField, FileRequired, FileAllowed
from wtforms import StringField, BooleanField, DecimalField, SelectField, RadioField, DateField, SubmitField, FieldList, FormField, HiddenField, validators
from wtforms.validators import DataRequired, required, NoneOf
from wtforms.fields.html5 import IntegerField

''' 
Components:
    SelectField: Drop-Down box
    RadioField: Radio Buttons
    StringField: TextBoxes
    BooleanField: CheckBoxes
    FileField: File Browser Field
    DateField: Date/Time Field
'''

class MainForm(FlaskForm):
    '''
    Builds the Main Form
    '''
