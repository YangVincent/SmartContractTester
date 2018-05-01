from flask import jsonify, request, Response
import json

_STATUS_OK = 200
_BAD_REQUEST = 400
_UNAUTHORIZED = 401
_FORBIDDEN = 403
_NOT_FOUND = 404
_METHOD_NOT_ALLOWED = 405
_INTERNAL_SERVER_ERROR = 500
_BAD_GATEWAY = 502
_SERVICE_UNAVAILABLE = 503
_GATEWAY_TIMEOUT = 504
# More at https://developer.mozilla.org/en-US/docs/Web/HTTP/Status

def STATUS_OK(msg,dic={},mimetype='application/json'):
	dic.update({'msg':msg,'status':_STATUS_OK})	
	return Response(json.dumps(dic),mimetype=mimetype)

def BAD_REQUEST(msg,dic={},mimetype='application/json'):
	dic.update({'msg':msg,'status':_BAD_REQUEST})	
	return Response(json.dumps(dic),mimetype=mimetype)

def UNAUTHORIZED(msg,dic={},mimetype='application/json'):
	dic.update({'msg':msg,'status':_UNAUTHORIZED})	
	return Response(json.dumps(dic),mimetype=mimetype)

def FORBIDDEN(msg,dic={},mimetype='application/json'):
	dic.update({'msg':msg,'status':_FORBIDDEN})	
	return Response(json.dumps(dic),mimetype=mimetype)

def METHOD_NOT_ALLOWED(msg,dic={},mimetype='application/json'):
	dic.update({'msg':msg,'status':_METHOD_NOT_ALLOWED})	
	return Response(json.dumps(dic),mimetype=mimetype)

def BAD_GATEWAY(msg,dic={},mimetype='application/json'):
	dic.update({'msg':msg,'status':_BAD_GATEWAY})	
	return Response(json.dumps(dic),mimetype=mimetype)
