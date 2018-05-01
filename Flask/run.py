#!/usr/bin/python
from app import app

# debug=True means app will reload when changes appear
debug = True

app.run(port=5000,host='0.0.0.0',debug=debug)
