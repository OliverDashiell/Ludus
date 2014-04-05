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
                "image": user.image,
                "type_": user.__class__.__name__,
                "id": user.id
                }
        
    @classmethod
    def player_protocol(cls, player):
        return {
                "id": player.user.id,
                "name": player.user.name,
                "image": player.user.image,
                "role": player.role
                }

    @classmethod
    def game_protocol(cls, game):
        return {
                "id": game.id,
                "name": game.name,
                "players": [cls.player_protocol(p) for p in game.players]
                }
    
    @classmethod
    def full_game_protocol(cls, game):
        result = cls.game_protocol(game)
        result["state"] = game.state
        
        return result
    
    @classmethod
    def saved_game_protocol(cls, game):
        return {
                "id":game.id,
                "name":game.name,
                "state":game.state
                }
        
    @classmethod
    def lookup_user(cls, user):
        return {
                "id":user.email,
                "text":user.name
                }
    