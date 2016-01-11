# Before Dawn

This is a project to generate an open-source cross-platform
screensaver library using web-based tools. In theory it can be used to
generate screensavers using HTML/CSS, Javascript, canvas, node.js, and
tools like p5.js, processing.js, d3.js, etc.

## Why?

I've always loved screensavers, and recently I've spent a decent
amount of time researching them. I wanted to be able to build some
screensavers, and for awhile I planned on just writing code in p5.js,
using canvas, etc. But eventually I decided that it would be better to
actually build a system for distributing functional screensavers.

Luckily, there's a few tools that you can use to build desktop apps
using web technologies. For now, I'm using Electron to do this, and it
seems like it should work. There's a few bits that need some work (in
particular, writing code for Windows and OSX to actually run the
screensaver via the typical system flows for those things), but the
basics are here.

Finally, I know that there are other people out there capable of
making screensavers that are much better than anything I'll ever
create, so I'd love to provide a system to make that as easy as
possible.


## Tools Used

(these are subject to change)

- [Electron](http://electron.atom.io/)
- [jQuery](https://jquery.com/) and [lodash](https://lodash.com/)
- [Pure.css](http://purecss.io/)
- [Node.js](https://nodejs.org/)
- a bunch of other stuff

## Status

Right now the project is still in its early stages, but this repo
includes the main code for running the actual screensaver, a
simple app for picking your screensaver and setting some options, and
a bunch of modules to pull it all together.

The actual for the screensavers is in <a
href="https://github.com/muffinista/before-dawn-screensavers">it's own
repo</a>. You can also fork the repo, use your own, or just run local
code (I'll document all this eventually).


## Try it Out

To run the code, you can clone the repository, then install
dependencies via `npm install`. You can run the application via `grunt
&& npm run`.

## How to write a screensaver

@todo this is not 100% correct.

To create a screensaver, make a subdirectory of the savers directory.
This directory should contain the contents of your screensaver, and a
file named `saver.json` -- Right now the app is built to scan the contents of the savers
directory for files with that name, and it will add any matches to the
list of screensavers. The file should look a little like this:

```
{
  "name":"Starfield",
  "source": "index.html",
  "key": "starfield",
  "description": "Enjoy some stars flying around on your screen",
  "aboutUrl": "http://muffinlabs.com/",
  "options":[]
}
```

The source key should point to an HTML file in your directory. That
HTML file should have the code required to run your screensaver -- it
is responsible for pulling in any JS packages, etc.

At some point this might change to support pure JS/Node code, etc.

## A Note About Security

Right now there basically isn't any, and someone could almost
certainly use this code to compromise the computer of a trusting
individual.

## Handy Parameters

-- there's URL parameters with screen width/height, etc
-- document these!

## CSS for hiding cursor

-- document this!


## TODO

- installers
- write code to run on windows/linux
- clean up process of checking for updates
- make it easier to add new screensavers/packages
- templates for screensavers
