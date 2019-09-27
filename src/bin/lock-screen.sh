#!/usr/bin/env bash

if ! [ -x "xdg-screensaver" ]; then
  xdg-screensaver lock
  exit 0
fi
if ! [ -x "gnome-screensaver-command" ]; then
  gnome-screensaver-command -l
  exit 0
fi

#
# try some random things
#
dbus-send --type=method_call --dest=org.gnome.ScreenSaver /org/gnome/ScreenSaver org.gnome.ScreenSaver.Lock
xset dpms force suspend