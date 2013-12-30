'''
Created on 30 Dec 2013

@author: dash
'''
from tornado.web import RequestHandler
from ludus.web.user_mixin import UserMixin


class LoginHandler(UserMixin, RequestHandler):
    
    def __init__(self, *args, **kwargs):
        UserMixin.__init__(self)
        RequestHandler.__init__(self, *args, **kwargs)
    
    
    def get(self, error=None):
        email = self.get_argument("email",default=None)
        next_ = self.get_argument("next", "/")
        self.render("login.html", 
                    email=email, 
                    error=error,
                    next=next_)
        
    
    def post(self):
        try:
            action = self.get_argument("action")
            if action == "register":
                accl_key = self.control.register(self.get_argument("email"),
                                                 self.get_argument("password"))
            else:
                accl_key = self.control.login(self.get_argument("email"),
                                              self.get_argument("password"))
            self.set_current_user(accl_key)
            self.redirect(self.get_argument("next","/"))
        except Exception as ex:
            self.get(str(ex))