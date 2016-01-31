# Before Dawn

Before Dawn is a project to generate an open-source, cross-platform
screensaver application using web-based technologies. You can generate
screensavers with it using HTML/CSS, javascript, canvas, and any
tools that rely on those technologies. In theory, generating a
screensaver is as simple as writing an HTML page.

The core of the app is built on [Electron](http://electron.atom.io/),
a system that allows you to build desktop applications that run on
[node.js](https://nodejs.org/) and are rendered via Chrome.

The project is definitely a bit of a experiment -- to actually use it,
you need to run it as a separate application on your computer and
disable whatever screensaver you have running in your OS, but it is
fun and definitely works.

If you want to try it out, you can download an installer from the
[releases](https://github.com/muffinista/before-dawn/releases)
releases page.

## Why?

I've always loved screensavers, and I spent the start of 2015 working
on an unpublished personal project writing about some of the different
aspects of them. As part of the project, I wanted to be able to build
some screensavers, and for awhile I planned on just writing code and
slapping it on a website, but eventually I decided that it would be
better to actually build a system for distributing functional
screensavers.

Also, I know that there are other people out there capable of
making screensavers that are much better than anything I'll ever
create, so I'd love to provide a system to make that as easy as
possible.


## Tools Used

- [Electron](http://electron.atom.io/)
- [Node.js](https://nodejs.org/)
- a little bit of [jQuery](https://jquery.com/) and [lodash](https://lodash.com/)
- most of the styling in the preferences window is via [Pure.css](http://purecss.io/)
- Some of the form inputs are being generated with
  [React](https://facebook.github.io/react/). This is definitely
  subject to change.

## Status

Right now the project is still in its early stages, but this repo
includes the main code for running the actual screensaver, a
simple app for picking your screensaver and setting some options, and
a bunch of modules to pull it all together.

The actual code for the screensavers is in <a
href="https://github.com/muffinista/before-dawn-screensavers">a separate
repo</a>. If you want to write a screensaver, please add it to the
project via a PR!


## Running It

The easiest way to use the tool is to install it to your computer. You
can grab an installer from the
[releases](https://github.com/muffinista/before-dawn/releases) page.

If you want to run the code, there's a few steps involved. Once you
clone the repository, you'll need to install any dependencies, compile
a few things with grunt, and compile a couple modules. It will look a
little like this:

```
git clone git@github.com:muffinista/before-dawn.git
cd ./before-dawn

npm install

./node_modules/.bin/electron-rebuild -w node-system-idle-time

grunt

npm run

```

The preferences window uses some React code and needs to be compiled
if you make any changes. Running `grunt` will handle the compilation
for you.


## How to write a screensaver

You can also fork the repo, use your own, or just run local
code (I'll document all this eventually).


Writing a screensaver for Before Dawn is just about as simple as building
a web page. There are a few basic twists involved:

- create a folder
- write the HTML/etc
- add a saver.json file
- profit!

Finally, to get Before Dawn to recognize your work, you will need to
create a JSON file that describes your screensaver. In the folder
where you created your screensaver, put a file named `saver.json` with
content that looks something like this:


```
{
  "name":"Starfield",
  "description": "Enjoy some stars flying around on your screen",
  "aboutUrl": "http://muffinlabs.com/"
  "source": "index.html",
}
```

The name, description, and aboutUrl fields are used when displaying
all the screensavers in the preferences window. The `source` key
should either point to an HTML file in your directory, or if you want
to host your screensaver on a webserver, it should be a URL pointing
to that location.

When Before Dawn runs, it will scan the contents of any specified
directories for files named `saver.json` and will use the content of
those files to generate the list of screensavers in the preferences window.

### let's document some parameters, previews, etc

### publishing your work

- generate a PR to before-dawn-screensavers
- run your own repo and point to it
- keep it local
- fork the entire project

## A Note About Security

It is hypothetically possible that someone could write a screensaver
that compromised your computer. You should keep this in mind both when
running the tool, and when writing any screensavers.


## Handy Parameters

-- there's URL parameters with screen width/height, etc
-- document these!



To create a screensaver, make a subdirectory of the savers directory.
This directory should contain the contents of your screensaver, and a
file named `saver.json` -- Right now the app is built to scan the contents of the savers
directory for files with that name, and it will add any matches to the
list of screensavers. The file should look a little like this:

The source key should point to an HTML file in your directory. That
HTML file should have the code required to run your screensaver -- it
is responsible for pulling in any JS packages, etc.

At some point this might change to support pure JS/Node code, etc.

