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

    @classmethod
    def game_protocol(cls, game):
        return {
                "id": game.id,
                "name": game.name,
                "players": [cls.player_protocol(p) for p in game.players]
                }
    
    @classmethod
    def player_protocol(cls, player):
        return {
                "id": player.user.id,
                "name": player.user.name,
                "role": player.role
                }