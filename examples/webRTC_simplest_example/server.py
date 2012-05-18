#
#  @file
#  Server side behaviour of the basic webRTC-gevent-socketIO
#  chat prototype.
# 
#  @copyright 2012 Savoir-faire Linux, inc.
#
#  This program is free software: you can redistribute it and/or modify
#  it under the terms of the GNU General Public License as published by
#  the Free Software Foundation, either version 3 of the License, or
#  (at your option) any later version.
#
#  This program is distributed in the hope that it will be useful,
#  but WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#  GNU General Public License for more details.
#
#  You should have received a copy of the GNU General Public License
#  along with this program.  If not, see <http://www.gnu.org/licenses/>.
#
#  @author Naysan Saran <naysan.saran@savoirfairelinux.com>
#

import os
import re

from pyramid.config 		import Configurator
from pyramid.session 		import UnencryptedCookieSessionFactoryConfig
from pyramid.events 		import NewRequest
from pyramid.events 		import subscriber
from pyramid.events 		import ApplicationCreated
from pyramid.view 			import view_config

from socketio 				import socketio_manage
from socketio.server 		import SocketIOServer
from socketio.namespace 		import BaseNamespace
from socketio.mixins 		import RoomsMixin, BroadcastMixin

from wsgiref.simple_server import make_server

# In this example, there is only one room with a maximum of two users
# False means that the user is not connected yet.
room = { 'user1' : False, 'user2' : False } 


class GlobalIONamespace(BaseNamespace, BroadcastMixin):
	"""
		GlobalIONamespace : namespace for the "socket" object
	"""   

	def on_login(self):
		"""
			@def 	on_login(self)
			@param  	None
			
			Triggered by a socket.emit('login') from the client.
			
			The first client to call socket.emit('login') will receive the 
			nickname "user1", the second client will be "user2".
			After that, the room is full until one user quits the chat
			and the room becomes available again.
	 	""" 
	 	
		if room['user1'] and room['user2'] :
			self.emit("message", "This example can only handle two people at the time.")
			return
	
		if not room['user1']:
			self.emit("set_nickname", "user1")
			room['user1'] = True
		else:
			self.emit("set_nickname", "user2")
			room['user2'] = True
	
	
	def on_rtc_message(self, sdp ):
		"""
			@def 	on_rtc_message(self, sdp )
			@param  	The sdp message paquet sent by the client
			
			Triggered by a socket.emit('rtc_message', sdp) from the client.
			
			Since there are only two users at the same time in this example,
			we will use broadcast_event_not_me() to forward the message to 
			the other peer.
		""" 
	   	self.broadcast_event_not_me("rtc_message", sdp)

	def on_peer_left(self):
		"""
			@def 	on_peer_left(self)
			@param  	None
			
			Triggered by a socket.emit('peer_left', sdp) from the client.
			
			Let the other peer know that the conversation is over and make
			the room available again.
		""" 
		
		print "Peer left the chat"
		self.broadcast_event_not_me("peer_left")
		room['user1'] = False
		room['user2'] = False

nsmap = { '': GlobalIONamespace }

#------------------------------------------------------------------------------    
# 			Adding view "socket_io":
#			The view that will launch the socketio listener.
#			Renderer : none
#------------------------------------------------------------------------------
@view_config(route_name='socket_io')
def socketio_service(request):
    """ The view that will launch the socketio listener """
    socketio_manage(request.environ, namespaces=nsmap, request=request)
    return {}
    
#------------------------------------------------------------------------------    
# 			Adding view "index":
# 			Home page of the web application.
# 			Renderer : index.mako
#------------------------------------------------------------------------------
@view_config(route_name='index', renderer='index.mako')
def index_view(self):
	""" The home page of the application """
	return {}


#------------------------------------------------------------------------------
# 							MAIN
#------------------------------------------------------------------------------

if __name__ == '__main__':

	# current directory
	here = os.getcwd()

	# configuration settings
	settings = {}
	settings['reload_all'] 		= True
	settings['debug_all'] 		= True
	settings['db'] 			= os.path.join(here, 'tasks.db') 
	settings['mako.directories'] 	= os.path.join(here, 'templates')

	# session factory
	session_factory = UnencryptedCookieSessionFactoryConfig('itsaseekreet')

	# configuration setup
	config = Configurator(settings=settings, session_factory=session_factory)

	# adding routes
	config.add_route('index', '/')
	config.add_route('socket_io', 'socket.io/*remaining')
	
	# make sure the @subscriber decorator is scanned by the application ar runtime
	config.scan() 

	# add static view
	config.add_static_view('static', os.path.join(here, 'static'))

	# serve application
	server = SocketIOServer(('0.0.0.0', 8080), config.make_wsgi_app(), policy_server=False,transports=['websocket'])
	server.serve_forever()
    
