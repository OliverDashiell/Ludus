'''
Created on 1 Jul 2013

@author: dash
'''
import logging #@UnresolvedImport
import tornado.websocket
from tornado.escape import json_decode
from ludus.web.user_mixin import UserMixin

class WebsocketHandler(UserMixin, tornado.websocket.WebSocketHandler):
    
    def __init__(self, application, request, **kwargs):
        UserMixin.__init__(self)
        tornado.websocket.WebSocketHandler.__init__(self, application, request, **kwargs)
        
    
    def open(self):
        self.control._add_client_(self)
        logging.info("WebSocket opened")


    def on_message(self, raw_msg):
        logging.info(raw_msg)
        msg = json_decode(raw_msg)
        
        result = error = None
        
        try:
            method = msg["method"]
            assert method[0] != "_"
            
            kwargs = msg.get("kwargs", {})
            
            result = getattr(self.control, method)(**kwargs)
            
        except Exception as ex:
            error = str(ex)
            logging.exception(msg)
        
        response = {"request_id":msg.get("request_id"), "result":result, "error":error}
        self.write_message(response)

    def on_close(self):
        self.control._remove_client_(self)
        logging.info("WebSocket closed")
        
    def broadcast(self, msg):
        self.write_message(msg)
        