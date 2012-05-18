appendMessage = function(message) 
{
  	$('#chatlog').append(message);
}


$(document).ready(

	function() 
	{
		  // connect to the websocket
		  socket 	= io.connect();
		  chat 	= io.connect('/chat');

		  // Listen for the event "chat" and add the content to the log
		  
		  socket.on("chat", function(e) 
		  {
			    	console.log("Chat message event", arguments);
			    	appendMessage(e + "<br />");
		  });
		  
		  socket.on("got_some_json", function(e) 
		  {
		    		onsole.log("We got back some json", e);
		  });
		  
		  socket.on("message", function(e) 
		  {
		    		console.log("Message", e);
		  });
		  
		  socket.on("nettest_configured", function(e) 
		  {
		    		console.log("Ok, configured", e);
		  });
		  
		  socket.on("connect", function(e) 
		  {
		    		console.log("Connected", arguments);
		  });
		  
		  socket.on("disconnect", function(e) 
		  {
		   		console.log("Disconnected", arguments);
		  });

		  socket.on("chat_invite", function(nickname, message) 
		  {
		   		console.log("Got a CHAT packet", nickname, message);
		   		
		   		$("#news").html( "<strong>New Invite from " + nickname + "</strong> " + message );
		  });
		  
		  /* Chat events */
		  chat.on("rtc_invite", function(nickname, sdp) 
		  {
		  		alert("u have been invited");
		  		
			    	console.log("Got an RTC_INVITE packet", nickname, sdp);
			    	var div = $("<div>You've been invited.  <a href='#' onclick='onJoinRemoteStream(this);'>Click here</a> to join</div>");
			    	div.data('sdp', sdp);
			    	appendMessage(div);
		  });
		  
		  chat.on("disconnect", function(e) 
		  {
		    		console.log("Disconnected from chat", arguments);
		  });
		  
		  chat.on("pack", function(e) 
		  {
		    		console.log("got pack message", e);
		  });
		  
		  chat.on("bob", function(e) 
		  {
		    		console.log("Received the bob event on /chat", e);
		  });
		  
		  chat.on("callmeback", function(param1, param2, ack) 
		  {
			    	console.log("Got the 'callmeback' call", param1, param2, ack);
			    	
			    	if (ack) 
			    	{
				 	console.log("  sending an ack");
				 	ack("ackprm1", "ackprm2");
			    	} 
			    	else 
			    	{
				 	console.log("  no ack to send, probably already sent");
			    	}
		  });
		  
		  chat.on("error", function(e) 
		  {
		    		console.log("Error", arguments);        
		  });


		  // Execute whenever the form is submitted
		  $("#send_msg").click(function(e) 
		  {
			    // don't allow the form to submit
			    e.preventDefault();

			    var val = $("#chatbox").val();

			    // send out the "chat" event with the textbox as the only argument
			    socket.emit("chat", val);

			    appendMessage(val + "<br />");

			    $("#chatbox").val("");	
		  });
		  
		  $("#start_chat").click(function(e) 
		  {
			    var val = $("#chatbox").val();

			    // send out the "invite" event 
			    socket.emit("chat_invite", "unknown user", "I want to chat");

			    appendMessage(val + "<br />");

			    $("#chatbox").val("");	
		  });

	}
);


