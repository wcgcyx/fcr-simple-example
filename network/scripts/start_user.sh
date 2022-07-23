#!/bin/sh

apk add npm
cd /proxy && npm install && npm run serve &
sleep 1
fcr daemon