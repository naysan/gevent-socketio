/**
 *  @file
 *  Brief description of what the file does, along with the project's name
 * 
 *  @copyright 2012 Savoir-faire Linux, inc.
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 *  @author Author name <author.name@savoirfairelinux.com>
 *
 */
 
var socket = null;
var localVideo;
var remoteVideo;
var localStream;
var pc;
var send_permitted = false;

/*! @fn	 	quitChat()
 *  @brief 	This function is called when the user clicks on the "QUIT CHAT" button.
 *         	Nothing is sent to the server if the chat hasn't started yet. 
 *		 	Otherwise, the "peer_left" event will be sent to the server (server.py)
 *		 	so the server can alert the other user that the peer left, and reset
 *		 	the room to empty.
 *  @param 	None
 *  @return 	None
 */
function quitChat() {

	if ( pc == null || send_permitted == false ) {
		alert("Chat session hasn't started yet!");
		return;
	}
	
	socket.emit("peer_left");
	$("#events").html("Thank you for having used the webRTC chat prototype, goodbye!");
	console.log("You left the chat.");
	cleanUp();
}

/*! @fn	 	cleanUp()
 *  @brief 	Closes the socketio and the webRTC connection.
 *  @param 	None
 *  @return 	None
 */
function cleanUp() {

	console.log("Cleaning up.");
	pc.close();
	socket.disconnect();
	pc = null;
	socket = null;
}


$(document).ready( function() {
	
	  socket 	= io.connect(); // connect to the websocket
	  
	  localVideo  = document.getElementById("localVideo"); // from index.mako
    	  remoteVideo = document.getElementById("remoteVideo");
	  
	  socket.on("set_nickname", function(nickname) {
	  
			$("#events").html("Your nickname is set to " + nickname );	
			 
			if (nickname == "user1") {
				getUserMedia();
			}
			else {
				send_permitted = true;
				getUserMedia();
			}
	  });
	  
	  socket.on("message", function(message) {
	  
	  		$("#events").html(message);
	  });

	  socket.on("rtc_message", function(message) {
	  
	  		console.log('S->C: ' + message);
	    		
	    		if (!send_permitted)
	    		{
	    			send_permitted = true;
	    			
	    			console.log("Creating PeerConnection.");
				createPeerConnection();

				console.log("Adding local stream.");
				pc.addStream(localStream);
	    		}
	    		
	    		pc.processSignalingMessage(message);
	  });
	  
	  socket.on("peer_left", function() {
	  
	  	$("#events").html("The other user left the chat!");
	  	console.log("The other user left the chat.");
	  	cleanUp();
	  });
	  
	  socket.emit("login"); // attempt to log in
	  
});

//*****************************************************************************
//						WEB RTC STUFF
//*****************************************************************************


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

onUserMediaSuccess = function(stream) 
{
	console.log("User has granted access to local media.");
	
	var url = webkitURL.createObjectURL(stream);
	
	localVideo.style.opacity = 1;
	localVideo.autoplay		= true;
	localVideo.src		 	= url;
	localStream 			= stream;
	
	if (send_permitted == false) 
	{
		console.log("Not going further because send is not permitted yet.");
		return;
	}
	
	console.log("Creating PeerConnection.");
	createPeerConnection();

	console.log("Adding local stream.");
	pc.addStream(localStream);
}	

createPeerConnection = function() {

	//var pc_config = 'STUN stun.xten.com';
	var pc_config = 'STUN stun.l.google.com:19302';
	
	try {
	 	pc = new webkitDeprecatedPeerConnection(pc_config, onSignalingMessage);
	 	console.log("Created webkitDeprecatedPeerConnnection.");
	} catch (e) {
	 console.log("Failed to create webkitDeprecatedPeerConnection, exception: " + e.message);
	 try {
	   pc = new webkitPeerConnection(pc_config, onSignalingMessage);
	   console.log("Created webkitPeerConnnection.");
	 } catch (e) {
	   console.log("Failed to create webkitPeerConnection, exception: " + e.message);
	   alert("Cannot create PeerConnection object; Is the 'PeerConnection' flag enabled in about:flags?");
	   return;
	 }
	}
	pc.onconnecting	= onSessionConnecting;
	pc.onopen 		= onSessionOpened;
	pc.onaddstream 	= onRemoteStreamAdded;
	pc.onremovestream 	= onRemoteStreamRemoved;
}

onSignalingMessage = function(message) 
{
	console.log("C->S ", message);
	socket.emit("rtc_message", message);
}
  
maybeStart = function() 
{
	if (!started && localStream ) {
		 console.log("Creating PeerConnection.");
		 createPeerConnection();
		 console.log("Adding local stream.");
		 pc.addStream(localStream);
		 started = true;
	}
}
  
onSessionConnecting = function(message) 
{
    console.log("Session connecting.");
}

onSessionOpened = function(message) 
{
    console.log("Session opened.");
}

onRemoteStreamAdded = function(event) 
{
	console.log("Remote stream added.");
	var url = webkitURL.createObjectURL(event.stream);

	remoteVideo.style.opacity = 1;
	remoteVideo.autoplay	= true;
	remoteVideo.src 		= url;
}

onRemoteStreamRemoved = function(event) 
{
    console.log("Remote stream removed.");
}

onUserMediaError = function(error) 
{
    console.log("Failed to get access to local media. Error code was " + error.code);
    alert("Failed to get access to local media. Error code was " + error.code + ".");
}

