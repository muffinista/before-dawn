#!/bin/bash

ELECTRON_VERSION=`npm view electron-prebuilt version`
DEST="/tmp/before-dawn-packages"
TARGET="$1"

echo "== Building Packages with Electron v ${ELECTRON_VERSION}"
npm i

echo "== REBUILD MODULES =="
./node_modules/.bin/electron-rebuild -w node-system-idle-time

echo "== Run Grunt =="
grunt

echo "== clean =="
rm -rf "${DEST}/osx"
mkdir -p "${DEST}/osx"

rm -rf "${DEST}/win"
mkdir -p "${DEST}/win"


#
# sudo npm install electron-packager -g
#

if [ "$TARGET" == "osx" ]; then
    echo "== Build OSX App =="
    electron-packager . 'Before Dawn' \
                      --prune \
                      --out=${DEST}/osx \
                      --platform=darwin \
                      --arch=x64 \
                      --version=${ELECTRON_VERSION} \
                      --icon='assets/icon.icns'  \
                      --overwrite
    
    echo "== Build OSX Installer =="
    
    #
    # npm install -g electron-builder
    #
    electron-builder "${DEST}/osx/Before Dawn-darwin-x64/Before Dawn.app" \
                     --platform=osx \
                     --out="/${DEST}/osx" \
                     --config=build.json
fi

if [ "$TARGET" == "win" ]; then
    export PATH="$PATH:C:\Program Files (x86)\NSIS"

    echo "== Build Windows App =="

    electron-packager . 'Before Dawn' \
                      --prune \
                      --out=${DEST}/win \
                      --platform=win32 \
                      --arch=ia32 \
                      --version=${ELECTRON_VERSION} \
                      --icon=assets/icon.ico

    echo "== Build Windows Installer =="
    electron-builder "${DEST}/win/Before Dawn-win32-ia32" \
                     --platform=win \
                     --out="${DEST}/win" \
                     --config=build.json
    

    echo "== Cleaning Up =="
    rm -rf "${DEST}/osx/Before Dawn-darwin-x64"
    rm -rf "${DEST}/win/Before Dawn-win32-ia32"
fi
