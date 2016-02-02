# Before Dawn

Before Dawn is a project to generate an open-source, cross-platform
screensaver application using web-based technologies. You can generate
screensavers with it using HTML/CSS, javascript, canvas, and any
tools that rely on those technologies. In theory, generating a
Before Dawn screensaver is as simple as writing an HTML page.

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
publishing it on a website, but eventually I decided that it would be
better to actually build a system for distributing functional
screensavers.

Also, I know that there are other people out there capable of
making screensavers that are much better than anything I'll ever
create, so I'd love to provide a system to make that as easy as
possible.


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

Once it's running, there will be a sunrise icon in your system tray, with a few different options. If you click 'Preferences,' you can preview the different screensavers, set how much idle time is required before the screensaver starts to run, specify custom paths, etc.

Once you've set all of that up, Before Dawn will happily run in the background, and when it detects that you have been idle, it will engage your screensaver. That's all there is to it!

## Tools Used

Before Dawn is built on:

- [Electron](http://electron.atom.io/)
- [Node.js](https://nodejs.org/)
- a little bit of [jQuery](https://jquery.com/) and [lodash](https://lodash.com/)
- most of the styling in the preferences window is via [Pure.css](http://purecss.io/)
- Some of the form inputs are being generated with
  [React](https://facebook.github.io/react/). This is definitely
  subject to change.


## How to Write a Screensaver

Writing a screensaver for Before Dawn is just about as simple as building
a web page. There are a few small twists involved:

- create a folder
- write the HTML/etc
- add a saver.json file
- profit!

In the preferences window, you can specify a custom directory to load screensavers from. It needs to be a JSON array and will look a little like this:

```
Local Sources:
["/path/to/your/directory"]

```

Once you've created that directory, put another subdirectory in it to hold your screensaver:

```
/path/to/your/directory/flying-coffee-makers
```

This directory should hold any assets for your screensaver -- any HTML or javascript, any images, etc.

**NOTE:** you can copy a starter template from the [before-dawn-screensavers](before-dawn-screensavers) repository.

Finally, to get Before Dawn to recognize your work, you will need to
create a JSON file that describes your screensaver. In the folder
where you created your screensaver, put a file named `saver.json` with
content that looks something like this:


```
{
  "name":"Flying Coffee Makers",
  "description": "Enjoy a bunch of coffee makers flying through space",
  "aboutUrl": "http://muffinlabs.com/"
  "source": "index.html",
}
```

The name, description, and aboutUrl fields are used when displaying
all the screensavers in the preferences window. The `source` key
should either point to an HTML file in your directory, or if you want
to host your screensaver on a webserver, it should be a URL pointing
to that location.

When Before Dawn loads, it will scan the contents of any specified
directories for files named `saver.json` and will use the content of
those files to generate the list of screensavers in the preferences window.

There are a few other optional parameters that will be used if provided, and you can also specify any **options** that the user can tweak to control how the screensaver runs.


### Handy Parameters

When your screensaver is loaded, Before Dawn will pass several parameters to the file or URL that you specified in saver.json. These variables include:

 - width - the width of the screen
 - height - the height of the screen
 - platform - the platform/operating system
 - preview -- if true, this is running as a preview in the prefs window

It will pass them as query params on the URL just like so:

```
index.html?width=800&height=600&platform=darwin&preview=0
```

It is entirely possible that you won't need these parameters, but they might be handy.

Before Dawn will also pass in any custom parameters that you specified.



### Contributing/Publishing Your Work

Contributions and suggestions are eagerly accepted. Please check out code\_of\_conduct.md before contributing. If you would like to add a screensaver to the program, you can submit a PR to the [before-dawn-screensavers](https://github.com/muffinista/before-dawn-screensavers) repo. I will accept pretty much any PR to the repository given that the content you are posting is legal and appropriate. If you need help or have a suggestion, please feel free to open an issue here.


There's a few other ways you can share you work:

- Alternatively, you can run your own repository, and point to it in the preferences window. In the future Before Dawn might accept multiple repositories in this field as well.
- You can always just run your code from a local directory without publishing it to the web.
- Also, you can fork the entire Before Dawn project to develop your own custom screensaver tool.

## A Note About Security

It is hypothetically possible that someone could write a screensaver
that compromised your computer. You should keep this in mind both when
running the tool, and when writing any screensavers.


## Copyright/License

Unless otherwise stated, Copyright (c) 2016 Colin Mitchell.

Before Dawn is is distributed under the MIT licence -- Please see LICENSE.txt for further details.

http://muffinlabs.com
