---
layout: page
title: Adding Your Own Screensaver
permalink: /creating/
---

A Before Dawn screensaver is an HTML page that runs in full screen
mode. You can extend them with CSS and Javascript, and they can get
very complicated, but the basics are really very simple.

Before you add your own screensaver, you'll need to specify a local
directory for your work in the Prefrences window. Once you've done
that, click the 'Create Screensaver' button and a little form will
open up where you can specify some basic information about your
screensaver:

- *Name:* The name of your screensaver
- *Description:* A brief description of your screensaver.
- *About URL:* An optional URL with more details about your work.
- *Author:* The author of this screensaver.

After you enter in your values and click save, Before Dawn creates a
folder for you which contains an HTML file which serves as the basis
of your new screensaver, and a `saver.json` file which contains the
information about your screensaver. Before Dawn should display the
folder for you so you can get to work building your awesome
screensaver!

## Testing, Adding Options ##

Any screensaver that is in your local sources directory can be edited.
In the preview list, there will be an 'edit' link. Clicking that link
opens a window which will allow you to update the basic information
for the screensaver, add configurable options to your screensaver,
view a working preview of the screensaver, debug it, etc.

There are two tabs and a couple of buttons in the edit window. The
Preview tab will run your screensaver. The window should auto-reload
whenever you save changes to your screensaver. The Settings tab is
where you can update information about your screensaver, or add
configurable options (see below). Then there are four buttons:

- the folder button will open the working folder for your screensaver
- the save button will save any changes you've made in the settings
  form
- the reload button will reload the preview
- the bug button will open the developer tools console in case you
  need to debug something.

## Configurable Options ##

Before Dawn has a very simple interface for adding configurable
options to your screensaver. There are two kinds of inputs right now:
text and sliders. You could use a text input to allow users to specify
a URL or some text that will be used in your screensaver. A slider can
be used to allow the user to input a number, etc.

Screensavers are loaded as URLs, and any options will be passed as
values to the URL. The template contains some code to parse incoming
values.

