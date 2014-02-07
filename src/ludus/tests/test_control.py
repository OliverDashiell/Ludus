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
        
        with self.control._session_ as session:
            user = session.query(model.User).get(user_id)
            self.assertEquals("test@test.com", user.email)
            
            
    def testLogin(self):
        reg_id = self.control.register("test@test.com", "test")
        self.assertIsNotNone(reg_id)
        
        log_id = self.control.login("test@test.com", "test")
        self.assertIsNotNone(log_id)
        
        self.assertEquals(log_id, reg_id)
        
        
    def testAddGame(self):
        owner_id = self.control.register("test@test.com", "test")
        self.assertIsNotNone(owner_id)
        
        game = self.control.add_game("Brt", owner_id)
        self.assertIsNotNone(game)
        
        print("ADD GAME TEST:")
        print(json.dumps(game, indent=4))
        
        
    def testGetGames(self):
        owner_id = self.control.register("test@test.com", "test")
        self.assertIsNotNone(owner_id)
        
        game = self.control.add_game("Brt", owner_id)
        self.assertIsNotNone(game)
        
        print("\nGET GAME TEST:")
        print(json.dumps(self.control.get_games(owner_id), indent=4))


if __name__ == "__main__":
    unittest.main()