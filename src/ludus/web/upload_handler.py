import tornado.web
import tornado.escape
import os
import logging  # @UnresolvedImport
import mimetypes  # @UnresolvedImport


class UploadHandler(tornado.web.RequestHandler):
    """
        Get returns a list of files in a directory
        
        Post accepts files to upload to a directory
    
        directory is specified in initialisation.
    """
    
    def initialize(self, directory):
        """initialised from the parameters passed to handlers"""
        self.directory = directory
        if not os.path.isdir(self.directory):
            os.makedirs(self.directory)
            logging.info("created upload dir {}".format(self.directory))
        
        
    def list_directory(self):
        """returns a list of file names in directory"""
        return os.listdir(self.directory)
    
    
    def get_unique_filename(self, name):
        directory_contents = self.list_directory()
        seed = 0
        fname = name
        filename, ext = os.path.splitext(name)
        
        while fname in directory_contents:
            fname = '{}_{}{}'.format(filename, seed, ext) #extend filename to make unique
            seed = seed+1
        
        return os.path.join(self.directory,fname)
        
    
    def get(self, path=None):
        if path:
            """returns the file"""
            abs_path = os.path.abspath(os.path.join(self.directory, path))
            mime_type, _ = mimetypes.guess_type(abs_path) # _ is unused variable
            self.add_header("content-type", mime_type)
            
            with open(abs_path, 'r') as file_:
                self.write(file_.read())
        else:
            """returns list of filename as json list"""
            self.add_header("content-type","text/json")
            self.write(tornado.escape.json_encode(self.list_directory()))
        
        
    def post(self, path=None):
        result = []
        
        for field, files in self.request.files.items():
            for upload_file in files:
                original_fname = upload_file['filename']
                actual_fname = self.get_unique_filename(original_fname)
        
                output_file = open(actual_fname, 'wb')
                output_file.write(upload_file['body'])
                
                actual_fname = os.path.split(actual_fname)[-1]
                result.append({
                               'original':original_fname,
                               'actual':actual_fname,
                               'field':field
                               })
        
        self.add_header("content-type","text/json")
        self.write({'result':result})
        
        
    
