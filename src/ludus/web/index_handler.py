'''
Created on 17 Nov 2013

@author: dash
'''
from tornado.web import RequestHandler, authenticated
from ludus.web.user_mixin import UserMixin
from tornado.escape import json_encode
from ludus.control import AccessControlException

class IndexHandler(UserMixin, RequestHandler):
    
    def __init__(self, *args, **kwargs):
        UserMixin.__init__(self)
        RequestHandler.__init__(self, *args, **kwargs)
    
    @authenticated
    def get(self):
        debug = self.application.settings.get("debug",False)
        ws_url = self.application.settings.get("ws_url","/websocket")
        try:
            user_json = json_encode(self.get_accl_user_dict())
            self.render("index.html", debug=debug, ws_url=ws_url, user_json=user_json)
        except AccessControlException:
            self.redirect(self.application.settings["login_url"])