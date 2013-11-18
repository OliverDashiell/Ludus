'''
Created on 17 Nov 2013

@author: dash
'''
from tornado.web import RequestHandler

class IndexHandler(RequestHandler):
    def get(self):
        self.render("index.html")