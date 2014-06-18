LUDUS

To install this:

1. Create a python virtualenv using virtualenv.py
2. Change directory to your new virtualenv
3. Run bin/pip install git+https://github.com/OliverDashiell/Ludus.git
4. Create and add a ludus.config to the root with your cookie secret
5. Run bin/ludus
6. Browse to http://localhost:8080 if hosting locally


ludus.config Template:

cookie_secret=‘my very special cookie secret’
cookie_name='ludus_user'
port=8080
