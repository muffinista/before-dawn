const Sentry = require("@sentry/electron");

var opts = {
  dsn: "https://b86f7b0ac5604b55b4fd03adedc5d205@sentry.io/172824",
  enableNative: false,
};

if ( process.env.BEFORE_DAWN_RELEASE_NAME ) {
  opts.release = process.env.BEFORE_DAWN_RELEASE_NAME;
}

Sentry.init(opts);