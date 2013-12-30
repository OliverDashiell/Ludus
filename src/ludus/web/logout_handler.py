'''
Created on Apr 4, 2013

@author: peterb
'''
from tornado.web import RequestHandler
from ludus.web.user_mixin import UserMixin

class LogoutHandler(UserMixin, RequestHandler):
    
    def __init__(self, *args, **kwargs):
        UserMixin.__init__(self)
        RequestHandler.__init__(self, *args, **kwargs)
        
    def get(self):
        self.clear_cookie(self.cookie_name)
        self.redirect("/")