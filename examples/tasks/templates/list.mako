# -*- coding: utf-8 -*- 
<%inherit file="layout.mako"/>

<center>

% if not user_type:

	<p> You might want to sign in again <a href='http://127.0.0.1:8080'>here</a> </p>
	
% else:

	<h2>Welcome, <div id="user_name">${user_name}</div> ! </h2>
	
	<div class="ui-widget">
		<div class="ui-state-highlight ui-corner-all" style="margin-top: 20px; padding: 0 .7em;"> 
			<p>
				<span class="ui-icon ui-icon-info" style="float: left; margin-right: .3em;"></span>
				<div id="news">No new events right now</div>
			</p>
		</div>
	</div>
		
	% if users:
	
		<div id="all_users">
		% for user in users:
			<div class="new_user">
			
				<div class="new_user_name">	
					%if user['name'] == user_name :
						<div class="you">${user['name']}</div>
					% else:
						${user['name']}
					%endif		
				</div>
				
				<div class="new_user_icon">
					%if user['online']:
						<img src="http://icons.iconarchive.com/icons/oxygen-icons.org/oxygen/32/Actions-im-user-icon.png"/>
					% else:
						<img src="http://icons.iconarchive.com/icons/oxygen-icons.org/oxygen/32/Actions-im-user-offline-icon.png"/>
					%endif	
				</div>
				
				<div class="new_user_action">
					%if user['name'] == user_name :
						You can't chat with yourself
					%elif user['online'] :
						<input type="button" name=${user['name']} class="start_chat" value="Start Chat" onclick="invite(this)">
					% else:
						Offline
					%endif
				</div>
				
			</div>
			
		% endfor
		</div>
		
	% else:
		<div>There are no users in the database</div>
	% endif
	
	<input type="button" name=${user['name']} class="quit_chat" value="QUIT CHAT" onclick="quitChat(this)">
	
</center>

% endif


