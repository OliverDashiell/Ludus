'''
Created on 1 Jul 2013

@author: dash
'''
import datetime

class Control(object):
    def __init__(self):
        self._clients_ = []
    
    def get_date(self):
        return str(datetime.date.today())
    
    def _add_client_(self, client):
        self._clients_.append(client)
        self.broadcast({"signal":"clients","count":len(self._clients_)})
        
    def _remove_client_(self, client):
        self._clients_.remove(client)
        self.broadcast({"signal":"clients","count":len(self._clients_)})
        
    def broadcast(self, msg):
        for client in self._clients_:
            client.broadcast(msg)
    