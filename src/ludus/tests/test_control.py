'''
Created on 21 Jan 2014

@author: dash
'''
import unittest  # @UnresolvedImport
import json  # @UnresolvedImport
from ludus.control import Control
from ludus import model


class Test(unittest.TestCase):


    def setUp(self):
        self.control = Control()
        self.control._create_all_()


    def tearDown(self):
        self.control._dispose_()


    def testRegister(self):
        user_id = self.control.register("test@test.com", "test")
        self.assertIsNotNone(user_id)
        
        user_id_2 = self.control.register("test@test2.com", "test")
        self.assertIsNotNone(user_id_2)
        
        try:
            self.control.register("test@test.com", "test")
        except Exception as ex:
            result = ex.args[0]
        
        self.assertEquals("Email already registered", result)
        
        with self.control._session_ as session:
            user = session.query(model.User).get(user_id)
            
            # correctly inserted, name generated
            self.assertEquals("test@test.com", user.email)
            self.assertEquals("test", user.name)
            self.assertEquals("test", user._password)
            
            # names generated are unique
            user_2 = session.query(model.User).get(user_id_2)
            self.assertEquals("test0", user_2.name)
            
            
    def testLogin(self):
        reg_id = self.control.register("test@test.com", "test")
        self.assertIsNotNone(reg_id)
        
        log_id = self.control.login("test@test.com", "test")
        self.assertIsNotNone(log_id)
        
        self.assertEquals(log_id, reg_id)
        
        try:
            self.control.login("badtest@test.com", "fail")
        except Exception as ex:
            result = ex.args[0]
            
        self.assertEquals("No such email or password", result)
        
        try:
            self.control.login("test@test.com", "fail")
        except Exception as ex:
            result = ex.args[0]
            
        self.assertEquals("No such email or password", result)
        
        
    def testUpdateUsername(self):
        user_id = self.control.register("test@test.com", "test")
        self.assertIsNotNone(user_id)
        
        # correctly updates username
        self.control.update_username(user_id, "my_new_name")
        
        with self.control._session_ as session:
            user = session.query(model.User).get(user_id)
            self.assertEquals("test@test.com", user.email)
            self.assertEquals("my_new_name", user.name)
            self.assertEquals("test", user._password)
        
        # wont update username to empty string
        try:
            self.control.update_username(user_id, "")
        except Exception as ex:
            result = ex.args[0]
            
        self.assertEquals("Cannot update to empty name", result)
        
        # wont update missing user
        try:
            self.control.update_username(3, "my_new_new_name")
        except Exception as ex:
            result = ex.args[0]
            
        self.assertEquals("No such user", result)
        
        # wont update to an already taken name
        user_id_2 = self.control.register("test@test2.com", "test")
        self.assertIsNotNone(user_id_2)
        
        try:
            self.control.update_username(user_id_2, "my_new_name")
        except Exception as ex:
            result = ex.args[0]
            
        self.assertEquals("Username has been taken", result)
        
        
    def testUpdatePassword(self):
        user_id = self.control.register("test@test.com", "test")
        self.assertIsNotNone(user_id)
        
        # correctly updates password
        self.control.update_password(user_id, "123_secure")
        
        with self.control._session_ as session:
            user = session.query(model.User).get(user_id)
            self.assertEquals("test@test.com", user.email)
            self.assertEquals("test", user.name)
            self.assertEquals("123_secure", user._password)
        
        # wont update password to empty string
        try:
            self.control.update_password(user_id, "")
        except Exception as ex:
            result = ex.args[0]
            
        self.assertEquals("Cannot update to empty password", result)
        
        # wont update missing user
        try:
            self.control.update_password(3, "my_new_password")
        except Exception as ex:
            result = ex.args[0]
            
        self.assertEquals("No such user", result)
        
        
    def testAddGame(self):
        owner_id = self.control.register("test@test.com", "test")
        self.assertIsNotNone(owner_id)
        
        game_id = self.control.add_game("Brt", owner_id)
        self.assertIsNotNone(game_id)
        
        # game created correctly
        game = self.control.get_game(game_id)
        self.assertEquals(game_id, game['id'])
        self.assertEquals("Brt", game['name'])
        
        # user added as owner player
        owner = game['players'][0]
        self.assertEquals(owner_id, owner['id'])
        self.assertEquals("test", owner['name'])
        self.assertEquals("owner", owner['role'])
        
        # properly formed default game object
        state = game['state']
        # map
        self.assertEquals(48, state['map']['width'])
        self.assertEquals(33, state['map']['height'])
        self.assertEquals(16, state['map']['scale'])
        # layers
        self.assertEquals("background", state['layers'][0])
        # sheets
        self.assertFalse(state['sheets']['spritesheets'])
        self.assertFalse(state['sheets']['tiles'])
        
        # wont add game for missing user
        try:
            self.control.add_game("Brt2", 3)
        except Exception as ex:
            result = ex.args[0]
            
        self.assertEquals("No such user", result)
        
        # print("ADD GAME TEST:")
        # print(json.dumps(self.control.get_game(game), indent=4))
        
        
    def testDeleteGame(self):
        owner_id = self.control.register("test@test.com", "test")
        self.assertIsNotNone(owner_id)
        
        game_id = self.control.add_game("Brt", owner_id)
        self.assertIsNotNone(game_id)
        
        deleted = self.control.delete_game(game_id)
        self.assertTrue(deleted)
        
        # should not find game once deleted
        try:
            self.control.get_game(game_id)
        except Exception as ex:
            result = ex.args[0]
            
        self.assertEquals("No such game", result)
        
        # should not delete missing game
        try:
            self.control.delete_game(game_id)
        except Exception as ex:
            result = ex.args[0]
            
        self.assertEquals("No such game", result)
        
        
    def testSaveGame(self):
        owner_id = self.control.register("test@test.com", "test")
        self.assertIsNotNone(owner_id)
        
        game_id = self.control.add_game("Brt", owner_id)
        self.assertIsNotNone(game_id)
        
        game = self.control.get_game(game_id)
        
        # change the game state
        game['state']['layers'].append('new_layer')
        state = game['state']
        
        saved = self.control.save_game(game_id, "Brt's Adventure", state)
        self.assertTrue(saved)
        
        # should have updated correctly
        saved_game = self.control.get_game(game_id)
        self.assertEquals("Brt's Adventure", saved_game['name'])
        self.assertEquals('new_layer', saved_game['state']['layers'][1])
        
        # should not update missing game
        try:
            self.control.save_game(3, "bad_update", state)
        except Exception as ex:
            result = ex.args[0]
            
        self.assertEquals("No such game", result)
    
        
    def testGetGame(self):
        owner_id = self.control.register("test@test.com", "test")
        self.assertIsNotNone(owner_id)
        
        game_id = self.control.add_game("Brt", owner_id)
        self.assertIsNotNone(game_id)
        
        # check for properly formed game
        game = self.control.get_game(game_id)
        self.assertEquals(game_id, game['id'])
        self.assertEquals("Brt", game['name'])
        
        # users returned correctly
        owner = game['players'][0]
        self.assertEquals(owner_id, owner['id'])
        self.assertEquals("test", owner['name'])
        self.assertEquals("owner", owner['role'])
        
        # properly formed game object
        state = game['state']
        # map
        self.assertEquals(48, state['map']['width'])
        self.assertEquals(33, state['map']['height'])
        self.assertEquals(16, state['map']['scale'])
        # layers
        self.assertEquals("background", state['layers'][0])
        # sheets
        self.assertFalse(state['sheets']['spritesheets'])
        self.assertFalse(state['sheets']['tiles'])
        
        # should not return missing game
        try:
            self.control.get_game(3)
        except Exception as ex:
            result = ex.args[0]
            
        self.assertEquals("No such game", result)
        
        # print("\nGET GAME TEST:")
        # print(json.dumps(self.control.get_games(owner_id), indent=4))
        
    
    def testGetGames(self):
        owner_id = self.control.register("test@test.com", "test")
        self.assertIsNotNone(owner_id)
        
        game_1 = self.control.add_game("Brt", owner_id)
        self.assertIsNotNone(game_1)
        
        game_2 = self.control.add_game("Brt_2", owner_id)
        self.assertIsNotNone(game_2)
        
        # check for both games
        check_games = self.control.get_games(owner_id)
        
        self.assertEquals(check_games[0]['id'], game_1)
        self.assertEquals(check_games[0]['name'], "Brt")
        self.assertEquals(check_games[1]['id'], game_2)
        self.assertEquals(check_games[1]['name'], "Brt_2")
        
        owner_id = self.control.register("test2@test.com", "test")
        self.assertIsNotNone(owner_id)
        
        # check for empty list
        check_games = self.control.get_games(owner_id)
        self.assertFalse(check_games)
        
        # wont get games for missing user
        try:
            self.control.get_games(3)
        except Exception as ex:
            result = ex.args[0]
            
        self.assertEquals("No such user", result)


if __name__ == "__main__":
    unittest.main()