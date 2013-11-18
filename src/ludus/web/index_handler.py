'''
Created on 17 Nov 2013

@author: dash
'''
from tornado.web import RequestHandler

class IndexHandler(RequestHandler):
    def get(self):
        debug = self.application.settings.get("debug",False)
        ws_url = self.application.settings.get("ws_url","/websocket")
        self.render("index.html", debug=debug, ws_url=ws_url)