'''
Created on 30 Dec 2013

@author: dash
'''
from sqlalchemy.types import String, Integer, Numeric, DateTime, Date, Time, Enum, Text
from sqlalchemy.schema import Table, Column, ForeignKey
from sqlalchemy.orm import relationship, backref
from sqlalchemy.ext.declarative.api import declared_attr, has_inherited_table, declarative_base
import re  # @UnresolvedImport


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
    state = Column(Text)
    players = relationship('Player', uselist=True, 
        primaryjoin='Player.game_id==Game.id', remote_side='Player.game_id',
        back_populates='game')


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


class User(Base):
    
    def __init__(self, email, password):
        self.email = email
        self._password = password
        self.name = email.split("@")[0]
        
    
    id = Column(Integer, primary_key=True)
    email = Column(String(255))
    name = Column(String(255))
    _password = Column(String(255))
    games = relationship('Player', uselist=True, 
        primaryjoin='Player.user_id==User.id', remote_side='Player.user_id',
        back_populates='user')

