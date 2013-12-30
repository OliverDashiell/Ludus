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
        
    def broadcast(self, msg):
        for client in self._clients_:
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