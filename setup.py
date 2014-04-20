#!/usr/bin/env python

from setuptools import setup, find_packages
import sys, os

version = '1.00'

setup(name='Ludus',
      version=version,
      description="Web browser game maker.",
      long_description="""A web based game maker for easy development of 2D games in a multi-user environment.""",
      author='Oliver Dashiell Bunyan',
      author_email='ludus@blueshed.co.uk',
      url='http://www.blueshed.co.uk/ludus',
      packages=find_packages('src',exclude=['*tests*']),
      package_dir = {'':'src'},
      include_package_data = True, 
      exclude_package_data = { '': ['tests/*'] },
      install_requires = [
        'setuptools',
        'tornado>=3.1.1',
        'sqlalchemy'
      ],
      entry_points = {
      'console_scripts' : ['ludus = ludus.web.web_server:main']
      })