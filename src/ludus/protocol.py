'''
Created on 1 Dec 2013

@author: dashb
'''


class Protocol(object):
    
    
    @classmethod
    def user_protocol(cls, user):
        return {
                "email": user.email,
                "name": user.name,
                "type_": user.__class__.__name__,
                "id": user.id
                }

    
    