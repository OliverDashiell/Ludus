'''
Created on Jun 27, 2013

@author: peterb
'''

from tornado.web import create_signed_value
from tornado.escape import json_encode


class UserMixin(object):
    
    @property
    def control(self):
        return self.application.settings['control']

    @property
    def cookie_name(self):
        return self.application.settings.get('cookie_name')
    
    
    def get_current_user(self):
        val = self.get_secure_cookie(self.cookie_name)
        if val:
            return int(val)
    
    
    def set_current_user(self, accl_key):
        self.set_secure_cookie(self.cookie_name, str(accl_key))
                        
        
    def get_accl_user_dict(self):
        if self.current_user:
            return self.control._get_accl_user_(self.current_user)
    
    
    def get_accl_user(self):
        return json_encode(self.get_accl_user_dict()) 
          
        
    def gen_login_cookie(self,value):
        return create_signed_value(self.application.settings["cookie_secret"],
                                   self.cookie_name, value)