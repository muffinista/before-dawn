#!/bin/bash

curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -
sudo apt-get install -y nodejs

sudo npm i -g grunt-cli electron-packager electron-builder

sudo apt-get install libx11-dev libxss-dev
sudo apt-get install libappindicator1
sudo apt-get install ruby ruby-dev
sudo gem install fpm
