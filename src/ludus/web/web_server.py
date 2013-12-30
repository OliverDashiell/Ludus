'''
Created on 17 Nov 2013

@author: dash
'''
from pkg_resources import resource_filename  # @UnresolvedImport
from ludus.web.index_handler import IndexHandler
from tornado.web import Application, StaticFileHandler
from tornado.ioloop import IOLoop
from tornado.options import define, options, parse_config_file, parse_command_line
import os
import logging  # @UnresolvedImport
from ludus.control import Control
from ludus.web.websocket_handler import WebsocketHandler
from ludus.web.login_handler import LoginHandler
from ludus.web.logout_handler import LogoutHandler

define("port", 8080, int, help="server port")
define("debug", False, bool, help="debug server")
define("db_url","sqlite:///ludus.db", help="sqlalchemy connection url")


def main(config_path = None):
    if config_path != None and not os.path.isfile(config_path):
        raise Exception('config_path does not exist! %s' % config_path)
    
    elif config_path is None:
        config_path = "./ludus.config"
        
    if os.path.isfile(config_path):
        parse_config_file(config_path)
    
    parse_command_line()
    
    control = Control(db_url=options.db_url)
    control._drop_all_and_create_()
    
    handlers = [
        (r"/", IndexHandler),
        (r"/login", LoginHandler),
        (r"/logout", LogoutHandler),
        (r"/websocket", WebsocketHandler),
        (r"/fonts/(.*)", StaticFileHandler, {"path": resource_filename('ludus.web',"www/static/fonts")}),
    ]
    
    settings = {
        "static_path": resource_filename('ludus.web',"www/static"),
        "template_path": resource_filename('ludus.web',"www/templates"),
        "cookie_secret": 'ludus, it was a dark and stormy night',
        "cookie_name": 'ludus_user',
        "login_url": '/login',
        "gzip": True,
        "debug": options.debug,
        "control": control
    }
    
    application = Application(handlers,**settings)
    
    application.listen(options.port)
    logging.info("Listening on %s", options.port)
    IOLoop.instance().start()

if __name__ == "__main__":
    main()