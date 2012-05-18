import os
import logging
import sqlite3

from pyramid.config 		import Configurator
from pyramid.session 		import UnencryptedCookieSessionFactoryConfig
from pyramid.events 		import NewRequest
from pyramid.events 		import subscriber
from pyramid.events 		import ApplicationCreated
from pyramid.exceptions 		import NotFound
from pyramid.httpexceptions 	import HTTPFound
from pyramid.view 			import view_config

from wsgiref.simple_server import make_server

import sqlalchemy

from sqlalchemy 				import create_engine
from sqlalchemy.orm 			import sessionmaker
from sqlalchemy.ext.declarative 	import declarative_base

from socketio 			import socketio_manage
from socketio.server 	import SocketIOServer
from socketio.namespace 	import BaseNamespace
from socketio.mixins 	import RoomsMixin, BroadcastMixin

from schema import *

engine  	= create_engine('sqlite:///:memory:', echo=False)
Session 	= sessionmaker(bind=engine)
session 	= Session()
Base.metadata.create_all(engine) 

#------------------------------------------------------------------------------    
# Adding view "index":
# - renderer : index.mako
# - goal     : home page of the web application. No arguments necessary,
#			simply asks the user to enter a nickname and a password.
#			For now, no nickname checking is done in the DB.
# - argument : empty dictionary.
#------------------------------------------------------------------------------
@view_config(route_name='index', renderer='index.mako')
def index_view(self):
    return {}
    
#------------------------------------------------------------------------------
# Adding view "list":
# - renderer  : list.mako
# - goal      : display a list of all connected users (this page should
# 			 appear after a "POST" connection request from the user)
# - arguments : two options
#      * Option 1 : if the request is a "GET", do nothing
#                   
#      * Option 2 : is the request is a "POST"
#                   - insert into users (name, password, online=1)
#                   - return the "list" view  
# 
# Note: No password checking is made at this point, only if the nickname
# is already in the DB then make sure the password matches.           
#------------------------------------------------------------------------------
@view_config(route_name='list', renderer='list.mako')
def list_view(request):

    if request.method == 'POST':
    
		if request.POST.get('name') and request.POST.get('passwd') :

			user	= request.db.query(User).filter_by(name=request.POST['name']).first()
			
			if user is None:
				request.db.add( User(request.POST['name'],request.POST.get('passwd'), 1) )
				request.db.commit() 
				
				users = [ dict(id=row.id, name=row.name, online=row.online) for row in session.query(User) ]
				
				return {'user_type': "new_user", 'user_name':request.POST['name'], 'users': users}
			
			else:
				user	= request.db.query(User).filter_by(name=request.POST['name']).filter_by(passwd=request.POST['passwd']).first()
			
				if user is None:
					request.session.flash('Error: Username already exists and password doesnt match')
					return {}
				else:
					users = [ dict(id=row.id, name=row.name, online=row.online) for row in session.query(User) ]
					
					return {'user_type': "old_user", 'user_name':request.POST['name'], 'users': users}
			
		else:
			request.session.flash('Please enter a name and a password for the new user !')
            
    return {}
    
#------------------------------------------------------------------------------
# Adding view "conversation":
# - renderer : conversation.mako
# - goal     : A simple chat window between two users
# - argument : the nicknames of the two users engaged in the conversation.
#------------------------------------------------------------------------------
@view_config(route_name='conversation', renderer='conversation.mako')
def conversation_view(request):

	user_from = request.matchdict['id']
	user_to	= request.matchdict['id2']
    
    	return { 'user_from': user_from, 'user_to': user_to }
    

#------------------------------------------------------------------------------
# Adding view "quit":
# - renderer : None
# - goal     : View called when a user quits the chat
#------------------------------------------------------------------------------
@view_config(route_name='close')
def close_view(request):

	user_name 	= request.matchdict['name']
	user_to_delete	= request.db.query(User).filter_by(name=user_name).first()

	if user_to_delete is None:
		print "Error: user %s not found for delete in the Users table" % user_name
		return HTTPFound(location=request.route_url('index'))
	else:
		print "Deleting user %s from the Users table ..." % user_name
		request.db.delete(user_to_delete)
		request.db.commit()
		request.session.flash("Thank you for having used the chat!")
		return HTTPFound(location=request.route_url('list'))
    
#------------------------------------------------------------------------------    
# Adding view "NotFound":
# - renderer : notfound.mako
# - argument : empty dictionary.
#------------------------------------------------------------------------------
@view_config(context='pyramid.exceptions.NotFound', renderer='notfound.mako')
def notfound_view(self):
    return {}
    


#------------------------------------------------------------------------------    
# GlobalIONamespace
# ChatIONamespace
#------------------------------------------------------------------------------
class GlobalIONamespace(BaseNamespace, BroadcastMixin):

    def on_chat(self, *args):
        self.emit("bob", {'hello': 'world'})
        print "Received chat message", args
        self.broadcast_event_not_me('chat', *args)
        
    def on_disconnect(self, nickname):
        print "Disconnecting username %s" % nickname
        self.broadcast_event_not_me('disconnect', nickname)
        
    def on_chat_invite(self, userFrom, userTo, room_name):
        print "Got a chat invite from %s to in room %s :  %s\nNow pushing to others..." % (userFrom, userTo, room_name)
        self.broadcast_event_not_me('chat_invite', userFrom, userTo, room_name)
        
    def on_chat_invite_declined(self, userFrom, room_name):
    	   print "Intive by %s to room %s declined" % (userFrom, room_name)
    	   self.broadcast_event_not_me('chat_invite_declined', userFrom,  room_name )
        
    def on_chat_invite_accepted(self, userFrom, userTo):
        print "User %s accepted the chat invite from user %s" % (userTo, userFrom)
        self.broadcast_event_not_me('chat_invite_accepted', "http://127.0.0.1:8080/conversation/", userTo, userFrom )
        
    def on_new_user(self, nickname):
        print "New user %s just connected." % nickname
        self.broadcast_event_not_me('new_user', nickname )
        
    def on_rtc_invite(self, sdp):
	   print "Got an RTC invite, now pushing to others..."
	   self.broadcast_event_not_me('rtc_invite', self.session['nickname'], sdp)
    
    def recv_connect(self):
        print "CONNNNNNNN"
        self.emit("you_just_connected", {'bravo': 'kid'})
        self.spawn(self.cpu_checker_process)

    def recv_json(self, data):
        self.emit("got_some_json", data)

    def on_bob(self, *args):
        self.broadcast_event('broadcasted', args)
        self.socket['/chat'].emit('bob')
        
    def on_request_room(self, *args):
        self.broadcast_event('broadcasted', args)
        self.socket['/chat'].emit('bob')

    def cpu_checker_process(self):
        """This will be a greenlet"""
        ret = os.system("cat /proc/cpu/stuff")
        self.emit("cpu_value", ret)


room_users = {}

class ChatIONamespace(BaseNamespace, RoomsMixin):

	def on_mymessage(self, msg):
	   print "In on_mymessage"
	   self.send("little message back")
	   self.send({'blah': 'blah'}, json=True)
	   for x in xrange(2):
		  self.emit("pack", {'the': 'more', 'you': 'can'})

	def on_my_callback(self, packet):
	   return (1, 2)
	   
	def on_trigger_server_callback(self, superbob):
	   def cb():
		  print "OK, WE WERE CALLED BACK BY THE ACK! THANKS :)"
	   self.emit('callmeback', 'this is a first param',
		        'this is the last param', callback=cb)

	   def cb2(param1, param2):
		  print "OK, GOT THOSE VALUES BACK BY CB", param1, param2
	   self.emit('callmeback', 'this is a first param',
		        'this is the last param', callback=cb2)

	def on_rtc_invite(self, sdp):
	   print "Got an RTC invite, now pushing to others..."
	   self.emit_to_room('room1', 'rtc_invite', self.session['nickname'],sdp)
	   
	def recv_connect(self):
	   self.session['nickname'] = 'guest123'
	   self.join('room1')

	def recv_message(self, data):
	   print "Received a 'message' with data:", data
	   
	def on_disconnect_me(self, data):
	   print "Disconnecting you buddy", data
	   self.disconnect()
	   
	def on_join_room(self, user_name, room_name):
	   print "%s joins the room %s" % (user_name, room_name)
	   
	   if not room_name in room_users.keys():
	   	room_users[room_name] = [user_name]
	   else:
	   	room_users[room_name].append( user_name )
	   
	   print "\nROOM_USERS = %s \n"  % room_users
	   
	   self.join(room_name)
	   
	def on_leave_room(self, user_name, room_name):
	   print "%s leaves room %s" % (user_name, room_name)
	   self.leave(room_name)
	   
	def on_room_name(self, user1, user2):

	   for key, value in room_users.iteritems():
	   	if user1 in value and user2 in value:
	   		print "Room found  for users (%s,%s): %s" % (user1, user2, key)
	   		self.emit('room_name', key)
	   		return
	   print "Room not found  for users (%s,%s)" % (user1, user2)
	   self.emit('room_name', 'null')
	   
	   
	def on_emit_to_room(self, room_name, message):
		
		print "\n>>>>Received chat message %s for room %s\n" % (message, room_name)
		self.emit_to_room(self, room_name, 'chat', message)
	   

nsmap = { '': GlobalIONamespace, '/chat': ChatIONamespace }

#------------------------------------------------------------------------------    
# Adding view "socket_io":
# - renderer : None
# - argument : The view that will launch the socketio listener.
#------------------------------------------------------------------------------
@view_config(route_name='socket_io')
def socketio_service(request):
    """ The view that will launch the socketio listener """

    socketio_manage(request.environ, namespaces=nsmap, request=request)

    return {}
    
#------------------------------------------------------------------------------
# The function application_created_subscriber is called when the  
# ApplicationCreated event of Pyramid is fired.
#
# This function creates or updates the database.
#------------------------------------------------------------------------------
@subscriber(ApplicationCreated)
def application_created_subscriber(event):

	log.warn('Initializing database...')

#	new_users = [	User('max'	, 'maxpasswd'	, 0), 
#				User('olivier'	, 'olivierU'	, 0),
#				User('sarah'	, 'sarahN'	, 0), ]
				
#	session.add_all(new_users)
	session.commit()	


#------------------------------------------------------------------------------
# The function new_request_subscriber is called when the NewRequest
# event of Pyramid is fired.
#
# This function makes the database connection available to the 
# application as "request.db".
#------------------------------------------------------------------------------
@subscriber(NewRequest)
def new_request_subscriber(event):

    request 		= event.request
    settings 		= request.registry.settings
    request.db 	= session
    
    request.add_finished_callback(close_db_connection)

def close_db_connection(request):
    request.db.close()

#------------------------------------------------------------------------------
# Write the logs
#------------------------------------------------------------------------------
logging.basicConfig()
log 	= logging.getLogger(__file__)
here = os.path.dirname(os.path.abspath(__file__))

#------------------------------------------------------------------------------
# 							MAIN
#------------------------------------------------------------------------------

if __name__ == '__main__':

	# configuration settings
	settings = {}
	settings['reload_all'] 		= True
	settings['debug_all'] 		= True
	settings['db'] 			= os.path.join(here, 'tasks.db')  # database location
	settings['mako.directories'] 	= os.path.join(here, 'templates') # directory where the mako files can be found

	# session factory
	session_factory = UnencryptedCookieSessionFactoryConfig('itsaseekreet')

	# configuration setup
	config = Configurator(settings=settings, session_factory=session_factory)

	config.add_route('index', '/')
	config.add_route('list', '/list')
	config.add_route('conversation', '/conversation/{id}/{id2}')
	config.add_route('close', '/close/{name}')
	config.add_route('socket_io', 'socket.io/*remaining')

	config.scan() # make sure the @subscriber decorator is scanned by the application ar runtime

	config.add_static_view('static', os.path.join(here, 'static'))

	# serve app
	server = SocketIOServer(('0.0.0.0', 8080), config.make_wsgi_app(), policy_server=False,transports=['websocket'])
	server.serve_forever()
    
