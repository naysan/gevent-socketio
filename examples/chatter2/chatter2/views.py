from socketio.namespace import BaseNamespace
from socketio import socketio_manage


def index(request):
    """ Base view to load our template """
    return {}


class NamedUsersRoomsMixin(object):
    def __init__(self, *args, **kwargs):
        super(NamedUsersRoomsMixin).__init__(self, *args, **kwargs)
        if 'rooms' not in self.session:
            self.session['rooms'] = set()  # a set of simple strings
            self.session['nickname'] = 'guest123'

    def join(self, room):
        """Lets a user join a room on a specific Namespace."""
        self.socket.rooms.add(self._get_room_name(room))

    def leave(self, room):
        """Lets a user leave a room on a specific Namespace."""
        self.socket.rooms.remove(self._get_room_name(room))

    def _get_room_name(self, room):
        return self.ns_name + '_' + room

    def emit_to_room(self, event, args, room):
        """This is sent to all in the room (in this particular Namespace)"""
        pkt = dict(type="event",
                   name=event,
                   args=args,
                   endpoint=self.ns_name)
        room_name = self._get_room_name(room)
        for sessid, socket in self.socket.server.sockets.iteritems():
            if not hasattr(socket, 'rooms'):
                continue
            if room_name in socket.rooms:
                socket.send_packet(pkt)


class ChatNamespace(BaseNamespace, NamedUsersRoomsMixin):
    def on_chat(self, msg):
        self.broadcast_event('chat', msg)


def socketio_service(request):
    retval = socketio_manage(request.environ,
        {
            '': ChatNamespace,
        }, request=request
    )

    return retval

