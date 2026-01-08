#!/bin/sh
# Start C++ app in the background
./axpert_monitor &

# Start custom web server
cd /app/www
python3 server.py
