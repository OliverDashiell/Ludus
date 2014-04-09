'''
Created on 30 Dec 2013

@author: dash
'''
from sqlalchemy.types import String, Integer, Enum, Text
from sqlalchemy.schema import Column, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative.api import declared_attr, has_inherited_table, declarative_base
from sqlalchemy.ext.hybrid import hybrid_property
import re  # @UnresolvedImport
import json  # @UnresolvedImport

DEFAULT_GAME = {
    "map": {
        "width":49,
        "height":33,
        "scale":16
    },
    "layers":[
        "background"
    ],
    "sheets": {
       "spritesheets":[],
       "tiles":[]
   }
}


#see: http://docs.sqlalchemy.org/en/rel_0_8/orm/extensions/declarative.html#augmenting-the-base

class _Base_(object):
    ''' provides default tablename and table_args properties'''

    __table_args__ = {'mysql_engine': 'InnoDB'}

    @declared_attr
    def __tablename__(self):
        if has_inherited_table(self):
            return None
        name = self.__name__
        return (name[0].lower() +
            re.sub(r'([A-Z])', lambda m:'_' + m.group(0).lower(), name[1:]))

Base = declarative_base(cls=_Base_)


class Game(Base):
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255))
    _state = Column("state", Text)
    players = relationship('Player', uselist=True, 
        primaryjoin='Player.game_id==Game.id', remote_side='Player.game_id',
        back_populates='game', cascade='all, delete, delete-orphan')
    
    def __init__(self, name):
        self.name = name
        self.state = DEFAULT_GAME
    
    @hybrid_property
    def state(self):
        if self._state is not None:
            return json.loads(self._state)
    
    @state.setter
    def state(self, value):
        if value is not None:
            self._state = json.dumps(value)
        else:
            self._state = None
        

class Player(Base):
    
    ROLE = ['owner','builder','player']
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('user.id'))
    user = relationship('User', uselist=False,
        primaryjoin='Player.user_id==User.id', remote_side='User.id',
        back_populates='games')
    game_id = Column(Integer, ForeignKey('game.id'))
    game = relationship('Game', uselist=False,
        primaryjoin='Player.game_id==Game.id', remote_side='Game.id',
        back_populates='players')
    role = Column(Enum(*ROLE))

player_index = Index('player_index', Player.user_id, Player.game_id, unique=True)


class User(Base):
    
    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True)
    name = Column(String(255), unique=True)
    _password = Column(String(255))
    image = Column(String(255))
    games = relationship('Player', uselist=True, 
        primaryjoin='Player.user_id==User.id', remote_side='Player.user_id',
        back_populates='user')
    
    
    def __init__(self, email, password, name=None):
        self.email = email
        self._password = password
        self.name = email.split("@")[0] if name is None else name
        
        
    @classmethod
    def get_unique_name(cls, session, username):
        names = [r[0] for r in session.query(cls.name).filter(cls.name.like('{}%'.format(username)))]
        
        name = username
        seed = 0
        while name in names:
            name = '{}{}'.format(username, seed)
            seed = seed+1
            
        return name
