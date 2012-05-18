# -*- coding: utf-8 -*- 
<%inherit file="layout.mako"/>

<center>

	% if not user_to:
	
		<p> You might want to sign in again <a href='http://127.0.0.1:8080'>here</a> </p>
	
	% else:
		<div style="width:90%">
		
				<div class="header">Chat room</div>
	
				<div class="ui-widget">
				<div class="ui-state-highlight ui-corner-all"> 
					<video id="rtc_remote_video">rtc_remove_video</video>
					<div id="userTo">${user_to}</div>
				</div>
				</div>
		
				<div id="chatlog"></div>
		
				<form id="chat_form">
		
					<input type="text" id="chatbox"></input>
			
					<button type="submit" id="submit">Send</button>
			
				</form>
	

				<div class="ui-widget">
				<div class="ui-state-highlight ui-corner-all"> 
			    		<video  id="rtc_video">rtc_video</video>
					<div id="userFrom">${user_from}</div>
				</div>
				</div>
				
				<button id="rtc_button" class="simple_button">Send WebRTC invitation</button>
		</div>
	%endif
	
</center>



