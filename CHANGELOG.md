# Change Log

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

