// Response Statuses
var STATUS_OK = 200;
var BAD_REQUEST = 400;
var UNAUTHORIZED = 401;
var FORBIDDEN = 403;
var NOT_FOUND = 404;
var METHOD_NOT_ALLOWED = 405;
var INTERNAL_SERVER_ERROR = 500;
var BAD_GATEWAY = 502;
var SERVICE_UNAVAILABLE = 503;
var GATEWAY_TIMEOUT = 504;


/* HTTP Client
1) GET:- Used when the client is requesting a resource on the Web server.
2) HEAD:- Used when the client is requesting some information about a resource but not requesting the resource itself.
3) POST:- Used when the client is sending information or data to the server—for example, filling out an online form (i.e. Sends a large amount of complex data to the Web Server).
4) PUT:- Used when the client is sending a replacement document or uploading a new document to the Web server under the request URL.
5) DELETE:- Used when the client is trying to delete a document from the Web server, identified by the request URL.
6) TRACE:- Used when the client is asking the available proxies or intermediate servers changing the request to announce themselves.
7) OPTIONS:- Used when the client wants to determine other available methods to retrieve or process a document on the Web server.
8) CONNECT:- Used when the client wants to establish a transparent connection to a remote host, usually to facilitate SSL-encrypted communication (HTTPS) through an HTTP proxy.
*/
var HttpClient = function() {	
    this.get = function(aUrl, aCallback) {
        var anHttpRequest = new XMLHttpRequest();
        anHttpRequest.onreadystatechange = function() { 
            if (anHttpRequest.readyState == 4 && anHttpRequest.status == STATUS_OK)
                aCallback(anHttpRequest.responseText);
        }
        anHttpRequest.open( "GET", aUrl, true );            
        anHttpRequest.send( null );
    };
    this.head = function(aUrl, aCallback) {
        var anHttpRequest = new XMLHttpRequest();
        anHttpRequest.onreadystatechange = function() { 
            if (anHttpRequest.readyState == 4 && anHttpRequest.status == STATUS_OK)
                aCallback(anHttpRequest.responseText);
        }
        anHttpRequest.open( "GET", aUrl, true );            
        anHttpRequest.send( null );
    };
    this.set = function(aUrl, data, aCallback) {
        $.ajax({
            url: aUrl,
            headers: {
                'X_CSRF_TOKEN':$("#csrf_token").val(),
                'Content-Type':'application/json'
            },
            method: 'SET',
            dataType: 'json',
            data: JSON.stringify(data),
            success: aCallback
          });
    };
    this.post = function(aUrl, data, aCallback) {
        $.ajax({
            url: aUrl,
            headers: {
                'X_CSRF_TOKEN':$("#csrf_token").val(),
                'Content-Type':'application/json'
            },
            method: 'POST',
            dataType: 'json',
            data: JSON.stringify(data),
            success: aCallback
          });
    };
    this.put = function(aUrl, data, aCallback) {
        $.ajax({
            url: aUrl,
            headers: {
                'X_CSRF_TOKEN':$("#csrf_token").val(),
                'Content-Type':'application/json'
            },
            method: 'PUT',
            dataType: 'json',
            data: JSON.stringify(data),
            success: aCallback
          });
    };
    this.options = function(aUrl, data, aCallback) {
        $.ajax({
            url: aUrl,
            headers: {
                'X_CSRF_TOKEN':$("#csrf_token").val(),
                'Content-Type':'application/json'
            },
            method: 'OPTIONS',
            dataType: 'json',
            data: JSON.stringify(data),
            success: aCallback
          });
    };
    this.connect = function(aUrl, data, aCallback) {
        $.ajax({
            url: aUrl,
            headers: {
                'X_CSRF_TOKEN':$("#csrf_token").val(),
                'Content-Type':'application/json'
            },
            method: 'CONNECT',
            dataType: 'json',
            data: JSON.stringify(data),
            success: aCallback
          });
    };
    this.trace = function(aUrl, data, aCallback) {
        $.ajax({
            url: aUrl,
            headers: {
                'X_CSRF_TOKEN':$("#csrf_token").val(),
                'Content-Type':'application/json'
            },
            method: 'TRACE',
            dataType: 'json',
            data: JSON.stringify(data),
            success: aCallback
          });
    };
}

// Save CSV File from string
SaveCSV = function(csvContent,filename)  {
	csvData = new Blob([csvContent], { type: 'text/csv' }); 
	var csvUrl = URL.createObjectURL(csvData);
	var link = document.createElement("a");
	link.href =  csvUrl;
	link.setAttribute('download',filename);
	link.click(); 
}


