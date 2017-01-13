#!/bin/bash

DEST="/tmp/before-dawn-packages"
TARGET="$1"
WORKING_DIR="/tmp/before-dawn-build"

rm -rf $WORKING_DIR
mkdir -p $WORKING_DIR

if [ "$LOCAL_BUILD" == "1" ]; then
    echo "== Building from local copy =="
    cp -r . $WORKING_DIR/
else
    echo "== Checking Out Code =="
    git clone https://github.com/muffinista/before-dawn.git $WORKING_DIR
fi

cd $WORKING_DIR   

echo "== Building assets =="
cd app
npm install --save-dev
grunt

rm -rf node_modules

cd ..

echo "== Cleaning out node packages =="
npm prune

echo "== Installing node packages =="
npm install

echo "== BUILDING APP =="
npm run dist
