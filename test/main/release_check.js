"use strict";

const ReleaseCheck = require("../../src/main/release_check.js");
const packageJSON = require("../../package.json");

describe("ReleaseCheck", () => {
  let releaseChecker;
  let url;
  let version;
  let server = "https://before-dawn.now.sh";

  beforeEach(() => {
    releaseChecker = new ReleaseCheck();  
  });

  afterEach(() => {
  });

  it("handles updates", (done) => {
    version = "0.1.1";
    url = `${server}/update/win32/${version}`;

    releaseChecker.setFeed(url);

    releaseChecker.onUpdate((x) => {
      done();
    });

    releaseChecker.checkLatestRelease();
  });

  it("handles no updates", (done) => {
    version = packageJSON.version;
    url = `${server}/update/win32/${version}`;

    releaseChecker.setFeed(url);

    releaseChecker.onNoUpdate(() => {
      done();
    });
    releaseChecker.checkLatestRelease();
  });
});