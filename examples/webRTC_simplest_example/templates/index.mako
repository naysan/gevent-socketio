# -*- coding: utf-8 -*- 
<!DOCTYPE html>  
<html>
<head>
	<meta charset="utf-8">

	<title>Gevent SocketIO WebRTC Prototype</title>
	  
	<script src="/static/jquery-1.7.2.min.js"	type="text/javascript"></script>
	<script src="/static/socket.io.js" 		type="text/javascript"></script>
	<script src="/static/chatter.js" 			type="text/javascript"></script>
	
	<link rel="stylesheet" type="text/css" href="/static/style.css" />
  
</head>

<body>
	<center>

		<div id="banner">Gevent SocketIO WebRTC Prototype</div>
		
		<div id="events"></div>

		<div id="chat">
			<table>
				<tr>
					<td><video id="localVideo"></td>
					<td><video id="remoteVideo"></td>
				</tr>
			</table>
		</div>
	  
	  	<input type="button" onclick="quitChat();" value="QUIT CHAT">
	  	
	  </center>
</body>
</html>

