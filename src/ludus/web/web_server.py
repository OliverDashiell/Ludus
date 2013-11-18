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

define("port", 8080, int, help="server port")
define("debug", False, bool, help="debug server")

def main(config_path = None):
    if config_path != None and not os.path.isfile(config_path):
        raise Exception('config_path does not exist! %s' % config_path)
    
    elif config_path is None:
        config_path = "./ludus.config"
        
    if os.path.isfile(config_path):
        parse_config_file(config_path)
    
    parse_command_line()
    
    application = Application([
        (r"/", IndexHandler),
        (r"/fonts/(.*)", StaticFileHandler, {"path": resource_filename('ludus.web',"www/static/fonts")}),
    ],
    static_path=resource_filename('ludus.web',"www/static"),
    template_path=resource_filename('ludus.web',"www/templates"),
    gzip=True,
    debug=options.debug)
    
    application.listen(options.port)
    logging.info("Listening on %s", options.port)
    IOLoop.instance().start()

if __name__ == "__main__":
    main()