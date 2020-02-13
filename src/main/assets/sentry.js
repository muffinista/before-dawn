import { init } from "@sentry/electron";

init({
  dsn: "https://b86f7b0ac5604b55b4fd03adedc5d205@sentry.io/172824",
  enableNative: false,
  release: process.env.BEFORE_DAWN_RELEASE_NAME,
  onFatalError: (error) => {
    // eslint-disable-next-line no-console
    console.log(error);
  },
});
