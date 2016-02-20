#!/bin/bash

die () {
    echo >&2 "$@"
    exit 1
}

[ "$#" -eq 1 ] || die "Please pick a target platform: osx or win"


ELECTRON_VERSION="0.36.4" #`npm view electron-prebuilt version`
DEST="/tmp/before-dawn-packages"
TARGET="$1"

if [ "$LOCAL_BUILD" == "1" ]; then
    echo "== Building from local copy =="
else
    WORKING_DIR="/tmp/before-dawn-build"

    echo "== Checking Out Code =="
    rm -rf $WORKING_DIR
    mkdir -p $WORKING_DIR
    git clone git@github.com:muffinista/before-dawn.git $WORKING_DIR
    cd $WORKING_DIR   
fi

echo "== Building Packages with Electron v ${ELECTRON_VERSION}"
npm i

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
  echo "== REBUILD MODULES =="
  ./node_modules/.bin/electron-rebuild -w node-system-idle-time

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
    echo "== REBUILD MODULES =="
    # force 32-bit because that's what we're building, but it might make sense to force 64 instead
    ./node_modules/.bin/electron-rebuild --arch="ia32" -w node-system-idle-time

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




if [ "$TARGET" == "deb" ]; then
  echo "== REBUILD MODULES =="
  ./node_modules/.bin/electron-rebuild -w node-system-idle-time

    echo "== Build Linux App =="
    electron-packager . 'before-dawn' \
                      --prune \
                      --out=${DEST}/linux \
                      --platform=linux \
                      --arch=x64 \
                      --version=${ELECTRON_VERSION} \
                      --icon='assets/icon.ico'  \
                      --overwrite
    
    echo "== Build deb package =="
    
    #
    # npm install -g electron-builder
    #
    electron-builder "${DEST}/linux/before-dawn-linux-x64/" \
                     --platform=linux \
                     --out="/${DEST}/linux" \
                     --config=build.json
fi
