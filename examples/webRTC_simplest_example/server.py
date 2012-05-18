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


room = { 'user1' : False, 'user2' : False }


#------------------------------------------------------------------------------    
# 			GlobalIONamespace : namespace for the "socket" object
#------------------------------------------------------------------------------
class GlobalIONamespace(BaseNamespace, BroadcastMixin):
        
	def on_login(self):

		if room['user1'] and room['user2'] :
			self.emit("message", "This very simple example can only handle two people connected.")
			return
		
		if not room['user1']:
			self.emit("set_nickname", "user1")
			room['user1'] = True
		else:
			self.emit("set_nickname", "user2")
			room['user2'] = True
		
     	
	def on_rtc_invite(self, sdp ):
	   	self.broadcast_event_not_me("rtc_answer", sdp)
   	
   	def on_peer_left(self):
   		print "Peer left the chat"
		self.broadcast_event_not_me("peer_left")
		

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
    
