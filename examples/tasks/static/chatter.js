appendMessage = function(message) 
{
  	$('#chatlog').append(message);
}

var socket;
var chat;
var room_name;
var stream_msg = null;

function acceptChat(button)
{
	room_name = button.title;
	userFrom  = button.name;
	
	console.log("chat invite accept ", userFrom, room_name);
	
	chat.emit("join_room", $("#user_name").html(), room_name);
	
	socket.emit("chat_invite_accepted", $("#chatwith").html(), $("#user_name").html() );
	
	roomURL = "/conversation/" + $("#user_name").html() + "/" + $("#chatwith").html();
	
	window.location.href = roomURL;
}

function declineChat(button)
{
	room_name = button.title;
	userFrom  = button.name;
	
	socket.emit("chat_invite_declined", userFrom, room_name );
	
	console.log("chat invite declined, asked user to leave ", userFrom, room_name);
	
	$("#news").html( "You declined chat invite from " + userFrom );
}

function invite(button)
{
	// start by joining the room
	room_name = $("#user_name").html() + "_invited_" + button.name;
	
	chat.emit("join_room", $("#user_name").html(), room_name);
	
    	// send out the "invite" event 
    	socket.emit("chat_invite", $("#user_name").html(), button.name, room_name ); 
}

function quitChat(button)
{
	socket.emit("disconnect", $("#user_name").html() );
	
	window.location.href = "/close/" + $("#user_name").html();
}

$(document).ready(

	function() 
	{
		
		  // connect to the websocket
		  socket 	= io.connect();
		  chat 	= io.connect('/chat');

		  /*
		  -------------------------------------------------------------------
		  		SOCKET
		  -------------------------------------------------------------------
		  */
		  socket.on("chat", function(e) 
		  {
			    	console.log("Chat message event", arguments);
			    	appendMessage(e + "<br />");
		  });
		  
		  socket.on("got_some_json", function(e) 
		  {
		    		console.log("We got back some json", e);
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
		  
		  socket.on("disconnect", function(nickname) 
		  {
		   		console.log("Setting user offline ", nickname);
		   		
		   		$('.new_user_name').each(function () 
		   		{
		   			user_name = $(this).html().replace(/^\s+|\s+$/g, '');
		   			
		   			if ( user_name == nickname )
		   			{
		   				console.log( "Found user name to suppress : ", user_name );
		   				$(this).parent().remove();
		   			}
		   			
				});
		   		
		  });
		  
		  socket.on("new_user", function(nickname) 
		  {
		   	console.log("New user just connected : " , nickname );
		   		
		   	new_name 		= "<div class='new_user_name'>" + nickname + "</div>"; 
		   	image   		= "<img src='http://icons.iconarchive.com/icons/oxygen-icons.org/oxygen/32/Actions-im-user-icon.png'/>";
		   	new_icon 		= "<div class='new_user_icon'>" + image + "</div>";
		   	button 		= "<input type='button' class='start_chat' name='" + nickname + "' value='Start Chat' onclick='invite(this)'>";
		   	new_action 	= "<div class='new_user_action'>" + button + "</div>";
		   	new_user		= "<div class='new_user'>" + new_name + new_icon + new_action + "</div>";
		   		
		   	$("#all_users").html( $("#all_users").html() + new_user );
		  });

		  socket.on("chat_invite", function(userFrom, userTo, room_name)
		  {
		   	console.log("Got a CHAT INVITE packet from ", userFrom, userTo, room_name);
		   	
		   	if ( userTo != $("#user_name").html() )
		   	{
		   		console.log("This CHAT INVITE is not destined to me, so I'm ignoring it.");
		   		return;
		   	}

		   	accept 	= "<input type='button' value='ACCEPT'  name='" + userFrom + "' title='" + room_name + "' onclick='acceptChat(this);'  >";
		   	decline   = "<input type='button' value='DECLINE' name='" + userFrom + "' title='" + room_name + "' onclick='declineChat(this);' >";
		   		
		   	$("#news").html( "<strong>NEW EVENT : <div id='chatwith'>"+ userFrom +"</div> wants to chat.</strong><br/><br/>" + accept + decline );
		  });
		  
		  socket.on("chat_invite_declined", function(userFrom, room_name)
		  {
		  	if ( userFrom != $("#user_name").html() )
		   	{
		   		console.log("This DECLINE INVITE is not destined to me, so I'm ignoring it.");
		   		return;
		   	}
		   	
		  	console.log("CHAT_INVITE packet was declined, leaving room ", room_name);
		  	
		  	chat.emit("leave_room", $("#user_name").html(), room_name);	
		  });
		  
		  socket.on("chat_invite_accepted", function(conversationURL, userTo, userFrom) 
		  {
		  	if ( userFrom != $("#user_name").html() )
		   	{
		   		console.log("This ACCEPT INVITE is not destined to me, so I'm ignoring it.");
		   		return;
		   	}
		   	
	   		console.log("Your CHAT_INVITE packet was accepted");
			roomURL = conversationURL + userFrom + "/" + userTo;
			window.location.href = roomURL;		   		
		  });
		  
		  socket.on("rtc_invite", function(nickname, invite_peer_msg) 
		  {
			console.log("Got an RTC_INVITE packet from ", nickname);
			
			stream_msg = invite_peer_msg;
			
			var div = $("<div>You've been invited. <a href='#' onclick='onJoinRemoteStream()'>Click here</a> to join</div> </div>");
			
			appendMessage(div);
			
		  });

		  /*
		  -------------------------------------------------------------------
		  		CHAT
		  -------------------------------------------------------------------
		  */

		chat.on("disconnect", function(e) 
		{
			console.log("Disconnected from chat", arguments);
		});
		
		chat.on("chat", function(e) 
		{	
			console.log("Chat message event", arguments);	
			appendMessage(e + "<br />");
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

		chat.on("room_name", function(room_name_from_server) 
		{
			console.log("room name receieved ", room_name_from_server); 
			
			if (room_name_from_server != "null")
			{
				room_name = room_name_from_server;
			}       
		});


	    /*
	    -------------------------------------------------------------------
	  		HANDLERS
	    -------------------------------------------------------------------
	    */
		// Execute whenever the form is submitted
		$("#send_msg").click(function(e) 
		{
		    if (room_name == null)
		    {
		    		console.log("Erreur, room_name is null");
		    		return;
		    }
		    
		    // don't allow the form to submit
		    e.preventDefault();

		    var val = $("#chatbox").val();

		    // send out the "chat" event with the textbox as the only argument
		    socket.emit("chat", val);
		    chat.emit("emit_to_room", room_name, val);

		    appendMessage(val + "<br />");

		    $("#chatbox").val("");	
		});
		  
		$("#chat_form").submit(function(e) 
		{
		    if (room_name == null)
		    {
		    		console.log("Erreur, room_name is null");
		    		return;
		    }
		    
		    // don't allow the form to submit
		    e.preventDefault();

		    var val = $("#chatbox").val();

		    // send out the "chat" event with the textbox as the only argument
		    socket.emit("chat", val);
		    //chat.emit("emit_to_room", room_name, val);

		    appendMessage(val + "<br />");

		    $("#chatbox").val("");
		});

		// add new user
		if ( $("#user_name").html() != null )
		{
			socket.emit("new_user", $("#user_name").html() );
		}
	  
	  	/*
	     -------------------------------------------------------------------
	  		BOUTONS
	     -------------------------------------------------------------------
	     */
		$('#b1').click(function()
		{
		    console.log("b1, emit bob, thank you")
		    socket.emit("bob", {"thank": "you"});
		});

		$('#b2').click(function()
		{
		    console.log("b2, send simple json message")
		    socket.json.send({blah: "a simple message"});
		});

		$('#b3').click(function()
		{
			console.log("b3, json.emit(bob, {thank:you})")
			socket.emit("bob", {"thank": "you"});
			socket.send("a simple message");
		});
		
		$('#b4').click(function()
		{
			console.log("b4, send /chat elements")
			chat.emit('mymessage', 'bob');
			chat.send("hey");
			chat.json.send({asdfblah: "asd " + String.fromCharCode(13) + "fé\n\\'blah"});
		});
		
		$('#b5').click(function()
		{
			console.log("b5, ack stuff and callbacks")
			
			chat.emit("my_callback", {'this': 'is sweet'}, function() 
			{
		 		console.log("OKAY! Executed callback!!!!!", arguments);
		 		chat.emit("mymessage", "bob");
			});
		
		});
		
		$('#b6').click(function()
		{
			console.log("b6, triggering server callback")
			chat.emit("trigger_server_callback", 'superbob as param');
			
			chat.send("a little message", function() 
			{
		 		console.log("GOT BACK THE SIMPLE CALLBACK!");
			});
		});
		
		$('#b7').click(function()
		{
			console.log("b7, disconnet me please")
			//chat.emit("disconnect_me", 'superbob as param');
			chat.disconnect();
		});
		
		$('#button_nettest_config').click(function() 
		{
		    var options = {test_name: 'A2',
				         num_packets: 50,
				         packet_size: 100,
				         delay_between_packets: 0,
				         spread_delay: 0,
				        }
				        
		    console.log("Calling nettest_config_next", options);
		    socket.emit("nettest_config_next", options);
		 });
		 
		$('#button_nettest_launch').click(function() 
		{
			console.log("Calling nettest_launch");
			socket.emit("nettest_launch", {});
		});
		
		$('#rtc_button').click(function() 
		{
			console.log("Sending WebRTC invitation to the channel.")
			getUserMedia();
			var video_el = $('#rtc_video');
		});
  
		if ( window.location.href.indexOf("conversation") > 0 )
		{
			chat.emit("room_name", $("#userTo").html(), $("#userFrom").html() ); 
		}
	}
);


/** 
	Web RTC stuff, 
	inspired by http://code.google.com/p/webrtc-samples/source/browse/trunk/apprtc/index.html 
	and the code from someone at PyCon, snippettized at https://gist.github.com/2026984 
*/

var localStream = null;
var pc = null;
var invited = false;

/************************************************
		STEP 1 : getUserMedia()
 ***********************************************/
getUserMedia = function() 
{
	try {
      navigator.webkitGetUserMedia({audio:true, video:true}, onUserMediaSuccess,onUserMediaError);
      console.log("Requested access to local media with new syntax.");
    } catch (e) {
      try {
        navigator.webkitGetUserMedia("video,audio", onUserMediaSuccess,onUserMediaError);
        console.log("Requested access to local media with old syntax.");
      } catch (e) {
        alert("webkitGetUserMedia() failed. Is the MediaStream flag enabled in about:flags?");
        console.log("webkitGetUserMedia failed with exception: " + e.message);
      }
    }
}

/************************************************
		STEP 2 : onUserMediaSuccess()
 ***********************************************/
onUserMediaSuccess = function(stream) 
{
  console.log("User has granted access to local media.");
  
  var url = webkitURL.createObjectURL(stream);
  
  if ( invited )
  {
  	var video_el 		= $('#rtc_remote_video')[0];
  }
  else
  {
  	var video_el 		= $('#rtc_video')[0];
  }
  
  video_el.style.opacity = 1;
  video_el.autoplay 	= true;
  video_el.src 		= url;
  localStream 			= stream;
  console.log("Got an ObjectURL for the stream:", url);

  // Create my own peerConnection stuff..
  createPeerConnection();
}

/************************************************
		STEP 3 : createPeerConnection()
 ***********************************************/
createPeerConnection = function() 
{
	  var pc_config = 'STUN stun.xten.com';
	  
	  try {
		    pc = new webkitDeprecatedPeerConnection(pc_config, onSignalingMessage);
		    console.log("Created webkitDeprecatedPeerConnnection with config \"" + pc_config + "\".");
	  } 
	  catch (e) 
	  { 
		    try {
			 pc = new webkitPeerConnection(pc_config, onSignalingMessage);
			 console.log("Created webkitPeerConnnection with config \"" + pc_config + "\".");
		    } 
		    catch (e) {
			 console.log("Failed to create webkitPeerConnection, exception: " + e.message);
			 return;
		    }
	  }
	  
	  pc.addStream(localStream);
	  
	  pc.onconnecting 	= onSessionConnecting;
	  pc.onopen 		= onSessionOpened;
	  pc.onaddstream 	= onRemoteStreamAdded;
	  pc.onremovestream = onRemoteStreamRemoved;
	  
	  if ( invited )
	  {
	  	pc.processSignalingMessage(message.data);
	  }
}

/************************************************
		STEP 5 : onSignalingMessage()
 ***********************************************/
onSignalingMessage = function(message) 
{
  	console.log("PC: Got a signaling message", message);
 	
 	socket.emit("rtc_invite", message); 	
}

/************************************************
	STEP 6:
	onJoinRemoteStream()
	Lorsque le peer accepte de se
	connecter
 ***********************************************/
onJoinRemoteStream = function() 
{
	invited = true;
	
	console.log("on join remote stream");
		
	if(pc == null) 
	{
		console.log("Trying to create peer connection with the sdp packet recieved...");
     	getUserMedia();
     	return;
   	}
	
	message = stream_msg;
	
	pc.processSignalingMessage(message.data);	
}

onSessionConnecting = function(message) 
{
  	console.log("PC: Session connecting.");
}

onSessionOpened = function(message) 
{
  	console.log("PC: Session opened.");
}

onRemoteStreamAdded = function(event) 
{
	console.log("PC: Remote stream added.");
	
	var url					= webkitURL.createObjectURL(event.stream);
	var remote_video 			= $('#rtc_remote_video')[0];
	remote_video.style.opacity 	= 1;
	remote_video.src 			= url;
	
	appendMessage("<input type=\"button\" id=\"hangup\" value=\"Hang up\" onclick=\"onHangup()\" />");
}

onRemoteStreamRemoved = function(event) 
{
  	console.log("PC: Remote stream removed.");
}
 
/************************************************
	Error in step 2 : onUserMediaError()
 ***********************************************/
onUserMediaError = function(error)
{
  console.log("Failed to get access to local media. Error code was " + error.code);
  alert("Failed to get access to local media. Error code was " + error.code + ".");
}


onProcessSignalMessage = function() 
{
  var sdp = $(this).data('sdp');
  processSignalMessage(sdp);
  appendMessage("<p>Attempting to connect to remote, using SDP "+ sdp + ".</p>");
}

processSignalMessage = function(data) 
{
  pc.processSignalingMessage(data);
}


onHangup = function() 
{
	console.log("PC: Hanging up.");
	$('#rtc_video')[0].style.opacity = 0;
	$('#rtc_remote_video')[0].style.opacity = 0;
	pc.close();
	// will trigger BYE from server
	chat.emit("rtc_hangup");
	pc = null;
	appendMessage("<p>You have left the call.</p>");
}

	  

