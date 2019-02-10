const Sentry = require("@sentry/electron");

var opts = {
  dsn: "https://b86f7b0ac5604b55b4fd03adedc5d205@sentry.io/172824",
  enableNative: false,
  onFatalError: (error) => {
    // eslint-disable-next-line no-console
    console.log(error);
  },
};

if ( process.env.BEFORE_DAWN_RELEASE_NAME ) {
  opts.release = process.env.BEFORE_DAWN_RELEASE_NAME;
}

Sentry.init(opts);


if ( typeof(window) !== "undefined" ) {
  window.Sentry = Sentry;
}
