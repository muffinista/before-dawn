window.ipcRenderer = require("electron").ipcRenderer;
const { init } = require("@sentry/electron/dist/renderer");

if ( global.TRACK_ERRORS && global.SENTRY_DSN !== undefined ) {
  init({
    dsn: global.SENTRY_DSN,
    enableNative: false,
    release: process.env.BEFORE_DAWN_RELEASE_NAME,
    onFatalError: (error) => {
      // eslint-disable-next-line no-console
      console.log(error);
    },
  }); 
}
