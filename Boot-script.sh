#!/bin/bash

gnome-terminal -e '/home/'$USER'/Documentos/BrightByte/script2.sh' &
cd /home/$USER/Documentos/BrightByte
./node_modules/.bin/truffle migrate --reset
npm start
