# -*- coding: utf-8 -*- 
<!DOCTYPE html>  
<html>
<head>
	
	<meta charset="utf-8">

	<title>GEvent SocketIO Chat prototype</title>

	<meta name="author" 		content="Pylons Project">
	  
	<script src="/static/js/jquery-1.7.2.min.js"				type="text/javascript"></script>
	<script src="/static/js/jquery-ui-1.8.20.custom.min.js" 	type="text/javascript"></script>
	<script src="/static/socket.io.js" 					type="text/javascript"></script>
	<script src="/static/handlebars.js" 					type="text/javascript"></script>
	<script src="/static/underscore.js" 					type="text/javascript"></script>
	<script src="/static/backbone.js" 						type="text/javascript"></script>
	<script src="/static/chatter.js" 						type="text/javascript"></script>
	
	<link type="text/css" href="/static/css/redmond/jquery-ui-1.8.20.custom.css" rel="stylesheet" />
	    
	<link rel="shortcut icon" 	type="text/css"	href="/static/favicon.ico" />
	<link rel="stylesheet" 		type="text/css"	href="/static/style.css"   />
  	<link rel="stylesheet" 		type="text/css" 	href="/static/styles.css"  />
  

</head>

<body>

  % if request.session.peek_flash():
  <div id="flash">
    <% flash = request.session.pop_flash() %>
	% for message in flash:
	${message}<br>
	% endfor
  </div>
  % endif

  <div id="page">
    
    ${next.body()}

  </div>
  
</body>
</html>

