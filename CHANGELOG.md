# Change Log

## [v0.9.17](https://github.com/muffinista/before-dawn/tree/v0.9.17) (2018-??-??)
- Add some logging code to savers library
- Handle screensaver load/parse errors rather than entirely failing
- Update Electron version

## [v0.9.16](https://github.com/muffinista/before-dawn/tree/v0.9.16) (2017-12-14)
- Notify main process when user preferences have been updated
- Disable 'Save' button when creating new screensaver, but local
  directory isn't setup.
- Remove crash reporter, since it's basically unused

## [v0.9.15](https://github.com/muffinista/before-dawn/tree/v0.9.15) (2017-12-14)
- Update raven/sentry setup, fix some issues with paths in the app

## [v0.9.14](https://github.com/muffinista/before-dawn/tree/v0.9.14) (2017-12-11)
- Fix some issues with setting local directory properly

## [v0.9.13](https://github.com/muffinista/before-dawn/tree/v0.9.13) (2017-12-08)
- Replaced React with Vue.js, and did a lot of refactoring and cleanup
  of javascript in general. Most of the UI code is in Vue components
  now. Previously, it was a mix of React, vanilla JS, and some jQuery.
- Moved code/asset compilation into webpack. This makes development a
  little easier to manage.
- Updated how data and objects get passed between the UI and the main
  process, which should help make the app more performant.
- Added some tweaks to hopefully take care of some annoying OSX
  security issues.


## [v0.9.12](https://github.com/muffinista/before-dawn/tree/v0.9.12) (2017-11-17)
- Tweak some temp directory usage to try and fix some OSX issues


## [v0.9.11](https://github.com/muffinista/before-dawn/tree/v0.9.11) (2017-11-16)
- Add some safety checks to config reading -- if it's corrupted
  somehow, just restart with a clean config
- Pass the savers module to windows when opening them -- I think this
  is faster than passing data back and forth

## [v0.9.10](https://github.com/muffinista/before-dawn/tree/v0.9.10) (2017-11-13)
- Add a random screensaver picker, as well as basic 'system
  screensaver' support -- ie, screensavers that are integral to the
  application and not installed as a separate package.
- If 'Run Now' chosen in menu, don't check power state
- Improve dock display -- show icon for more windows and hide only
  when all windows are closed
- Tweak layout of prefs window and the preview tool
- Update main process to listen for events from windows and pass data
  around. The main process has responsibilty for opening windows,
  saving new screensavers, etc. 
- Reorganize code for app, switch to a single package.json
- Make a bunch of calls asychronous
- Use async/await in a few places
- Add some data caching to help performance
- When launching screensavers, don't take screengrab unless
  requested - this greatly speeds up launch time
- Switch to yarn, cleanup build process
  - I'd prefer to not have yarn as a dependency, but it does a better
    job of handling installations across multiple platforms -- ie,
    windows and OSX
- Add webpack and use it to build UI assets
  - I also might get rid of this at some point, and also React for
    that matter
- Update bootstrap version and assorted styling
- Update electron version
- Update React version and a bunch of assorted components
- Add mocha tests
- Add appveyor and Travis builds
- Update some stale packages, and remove some dead ones

## [v0.9.9](https://github.com/muffinista/before-dawn/tree/v0.9.9) (2017-11-13)
- This version was yanked before it had a chance to truly shine. RIP

## [v0.9.8](https://github.com/muffinista/before-dawn/tree/v0.9.8) (2017-08-03)
- Minor bug fixes

## [v0.9.7](https://github.com/muffinista/before-dawn/tree/v0.9.7) (2017-07-28)
- Scroll to the currently selected screensaver when rendering prefs
  panel
- Handle missing screensaver object in watcher window

## [v0.9.6](https://github.com/muffinista/before-dawn/tree/v0.9.6) (2017-07-11)
- Fix some issues with loading screensavers from folders with spaces in their name
- Add some handlers for power on/off events
- Close running screensavers when the display count changes (the user
  has plugged/unplugged a monitor)

## [v0.9.5](https://github.com/muffinista/before-dawn/tree/v0.9.5) (2017-06-27)
- Fix some bugs that can occur when setting a custom screensaver
  source directory that either doesn't exist or is empty.

## [v0.9.4](https://github.com/muffinista/before-dawn/tree/v0.9.4) (2017-06-09)
- Disable ASAR packages. I think there's a few things that are broken
  when they are being used, and I want to have the whole app running
  more smoothly before switching back to them.
- Add link to issues URL so users can report bugs.
- Fix bug where we tried to render preview when a screensaver hadn't
  been selected yet.


## [v0.9.3](https://github.com/muffinista/before-dawn/tree/v0.9.3) (2017-06-01)
- Tweak state machine to rely on idle time checks and not much else
- Fix bug with (I think) newer versions of Electron where opening a
  BrowserWindow would trigger a reset of idle time on Windows.
- Hide mouse by using robotjs to move mouse off screen when showing screensaver
- Build ASAR packages
- Implement crash reporting, and some sentry.io error reporting
- Add a background color to boot process to look a little nicer
- Optimize screen grabber code, fix some CPU spikes
- Assorted library/code updates

## [v0.9.2](https://github.com/muffinista/before-dawn/tree/v0.9.2) (2017-03-01)
- Fix bug where "don't run on battery" would always be true
- Tweak fullscreen detection code a bit, move into its own module
- Move some platform-specific deps into 'optionalDependencies'

## [v0.9.0](https://github.com/muffinista/before-dawn/tree/v0.9.0) (2017-03-01)
- Check for fullscreen apps and don't activate the screensaver if one is running
- Sort screensavers alphabetically regardless of capitalization
- Add right-click action to system tray
- If disabled, display a 'paused' icon in system tray
- Tweaked tray icon to be a little bolder
- Updated preferences display
- Fixed a case where I think the app would stop checking idle time, so it wouldn't load a screensaver


## [v0.8.3](https://github.com/muffinista/before-dawn/tree/v0.8.3) (2017-01-27)
[Full Changelog](https://github.com/muffinista/before-dawn/compare/v0.8.1...v0.8.3)

## [v0.8.1](https://github.com/muffinista/before-dawn/tree/v0.8.1) (2017-01-17)
[Full Changelog](https://github.com/muffinista/before-dawn/compare/v0.8.0...v0.8.1)

## [v0.8.0](https://github.com/muffinista/before-dawn/tree/v0.8.0) (2017-01-14)
[Full Changelog](https://github.com/muffinista/before-dawn/compare/v0.7.0...v0.8.0)

## [v0.7.0](https://github.com/muffinista/before-dawn/tree/v0.7.0) (2016-07-15)
[Full Changelog](https://github.com/muffinista/before-dawn/compare/v0.6.3...v0.7.0)

## [v0.6.3](https://github.com/muffinista/before-dawn/tree/v0.6.3) (2016-03-09)
[Full Changelog](https://github.com/muffinista/before-dawn/compare/v0.6.1...v0.6.3)

## [v0.6.1](https://github.com/muffinista/before-dawn/tree/v0.6.1) (2016-03-05)
[Full Changelog](https://github.com/muffinista/before-dawn/compare/v0.6.0...v0.6.1)

## [v0.6.0](https://github.com/muffinista/before-dawn/tree/v0.6.0) (2016-03-04)
[Full Changelog](https://github.com/muffinista/before-dawn/compare/v0.5.0...v0.6.0)

## [v0.5.0](https://github.com/muffinista/before-dawn/tree/v0.5.0) (2016-02-23)
[Full Changelog](https://github.com/muffinista/before-dawn/compare/v0.4.0...v0.5.0)

## [v0.4.0](https://github.com/muffinista/before-dawn/tree/v0.4.0) (2016-02-21)
[Full Changelog](https://github.com/muffinista/before-dawn/compare/v0.3...v0.4.0)

## [v0.3](https://github.com/muffinista/before-dawn/tree/v0.3) (2016-02-20)
[Full Changelog](https://github.com/muffinista/before-dawn/compare/v0.2...v0.3)

## [v0.2](https://github.com/muffinista/before-dawn/tree/v0.2) (2016-02-10)
[Full Changelog](https://github.com/muffinista/before-dawn/compare/v0.1...v0.2)

## [v0.1](https://github.com/muffinista/before-dawn/tree/v0.1) (2016-02-04)

