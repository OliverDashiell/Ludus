'''
Created on 1 Jul 2013

@author: dash
'''
import datetime
import logging  # @UnresolvedImport
from sqlalchemy.engine import create_engine, reflection
from sqlalchemy.orm.session import sessionmaker
from ludus import model
from sqlalchemy.exc import IntegrityError
from ludus.protocol import Protocol
from sqlalchemy.schema import MetaData, ForeignKeyConstraint, Table,\
    DropConstraint, DropTable
    
    
class AccessControlException(Exception):
    pass


class Control(object):
    
    def __init__(self, db_url='sqlite:///:memory:', echo=False):
        params = dict(echo=echo)
        if 'mysql' in db_url:
            params['encoding']='utf-8'
            
        logging.info("connecting to db %s",db_url)
        self._engine_ = create_engine(db_url, **params)
        self._Session_ = sessionmaker(bind=self._engine_)
        
        self._clients_ = []
        
        
    def register(self, email, password):
        with self._session_ as session:
            user = model.User(email=email, password=password)
            session.add(user)
            try:
                session.commit()
            except IntegrityError:
                raise Exception("email already exists")
            logging.info("user registered %s",user.id)
            return user.id
    
    
    def login(self, email, password):
        with self._session_ as session:
            user = session.query(model.User).filter_by(email=email, _password=password).first()
            if user is None:
                raise Exception("No such email or password!")
            logging.info("user logged in %s",user.id)
            return user.id
        
        
    def _get_accl_user_(self, accl_id):
        with self._session_ as session:
            user = session.query(model.User).get(accl_id)
            if user is None:
                raise AccessControlException("No such user")
            return Protocol.user_protocol(user)
        
    
    def _add_client_(self, client):
        self._clients_.append(client)
        self.broadcast({"signal":"clients","count":len(self._clients_)})
        
    def _remove_client_(self, client):
        self._clients_.remove(client)
        self.broadcast({"signal":"clients","count":len(self._clients_)})
        
    def broadcast(self, msg, clients=None):
        for client in self._clients_:
            if clients is None or client.current_user in clients:
                client.broadcast(msg)
    
    
    
    def _dispose_(self):
        ''' 
            tidy up we've gone away
        '''
        if self._engine_:
            self._engine_.dispose()
        self._Session_ = self._engine_ = None
        logging.debug("control disposed")
        
        
    @property
    def _session_(self):
        session = self._Session_()
        class closing_session:
            def __enter__(self):
                logging.debug("db session open")
                return session
            def __exit__(self, type, value, traceback):
                logging.debug("db session closed")
                session.close()
        return closing_session()
            
            
    def _drop_all_and_create_(self):
        with self._session_ as session:
            self._drop_all_(session)
            self._create_all_()


    def _create_all_(self):
        logging.info("creating schema")
        model.Base.metadata.create_all(self._engine_)  # @UndefinedVariable
        
        
    def _drop_all_(self, session):
        logging.warn("dropping schema")
        inspector = reflection.Inspector.from_engine(session.bind)
        
        # gather all data first before dropping anything.
        # some DBs lock after things have been dropped in 
        # a transaction.
        
        metadata = MetaData()
        
        tbs = []
        all_fks = []
        
        for table_name in inspector.get_table_names():
            fks = []
            for fk in inspector.get_foreign_keys(table_name):
                if not fk['name']:
                    continue
                fks.append(
                    ForeignKeyConstraint((),(),name=fk['name'])
                    )
            t = Table(table_name,metadata,*fks)
            tbs.append(t)
            all_fks.extend(fks)
        
        for fkc in all_fks:
            session.execute(DropConstraint(fkc))
        
        for table in tbs:
            session.execute(DropTable(table))
        
        session.commit()
        
        
    def add_game(self, name, owner_id):
        with self._session_ as session:
            owner = session.query(model.User).get(owner_id)
            game = model.Game(name=name)
            
            player = model.Player(role="owner", user=owner, game=game)
            
            session.add(player)
            session.commit()
            
            msg = Protocol.game_protocol(game)
            self.broadcast({'signal':'added_game', 'message':msg}, [owner.id])
            return game.id
        
        
    def delete_game(self, game_id):
        with self._session_ as session:
            game = session.query(model.Game).get(game_id)
            players = [p.user_id for p in game.players]
            
            session.delete(game)
            session.commit()
            
            self.broadcast({'signal':'deleted_game', 'message':game_id}, players)
            return True
        
        
    def save_game(self, game_id, name, state):
        with self._session_ as session:
            game = session.query(model.Game).get(game_id)
            players = [p.user_id for p in game.players]
            
            game.name = name
            game.state = state
            
            session.commit()
            
            msg = Protocol.saved_game_protocol(game)
            self.broadcast({'signal':'saved_game', 'message':msg}, players)
            return True
    
        
    def get_game(self, game_id):
        with self._session_ as session:
            game = session.query(model.Game).get(game_id)
            
            return Protocol.full_game_protocol(game)
        
        
    def get_games(self, owner_id):
        with self._session_ as session:
            owner = session.query(model.User).get(owner_id)
            
            return [Protocol.game_protocol(player.game) for player in owner.games]
            
            
    def add_player(self, game_id, email, role=None):
        role=role if role is not None else model.Player.ROLE[-1]
        
        with self._session_ as session:
            game = session.query(model.Game).get(game_id)
            user = session.query(model.User).filter(model.User.email==email).first()
            
            if user is None:
                raise Exception("no such user")
            
            player = model.Player(game=game, user=user, role=role)
            session.commit()
            
            players = [p.user_id for p in game.players]
            
            msg = {"game_id":game_id, "player":Protocol.player_protocol(player)}
            self.broadcast({'signal':'added_player', 'message':msg}, players)
            return True
    
    
    def remove_player(self, game_id, user_id):
        with self._session_ as session:
            player = session.query(model.Player).\
                             filter_by(user_id=user_id, game_id=game_id).\
                             first()
                             
            if player is None:
                raise Exception("no such player")
            
            game = player.game
            players = [p.user_id for p in game.players]
            
            session.delete(player)
            session.commit()
            
            msg = {"game_id":game_id, "player_id":user_id}
            self.broadcast({'signal':'removed_player', 'message':msg}, players)
            return True
            
            
    def lookup_user(self, name=None):
        name = "{}%".format(name) if name else "%"
        
        with self._session_ as session:
            users = session.query(model.User).\
                            filter(model.User.name.like(name)).\
                            order_by(model.User.name)
            
            return [Protocol.lookup_user(u) for u in users]
        