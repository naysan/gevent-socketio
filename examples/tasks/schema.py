from sqlalchemy.ext.declarative 	import declarative_base
from sqlalchemy 				import Column, Integer, String, Boolean

Base = declarative_base()

class User(Base):

    	__tablename__ = 'Users'
	
    	id 		= Column(Integer, 		primary_key=True)
    	name 	= Column(String(100), 	nullable=False)
    	passwd 	= Column(String(100), 	nullable=False)
    	online 	= Column(Boolean, 		nullable=False)

	def __init__(self, name, passwd, online):

	    self.name 		= name
	    self.passwd 	= passwd
	    self.online 	= online

	def __repr__(self):
	   return "<User('%s','%s','%s','%s')>" % (self.id, self.name, self.passwd, self.online)

