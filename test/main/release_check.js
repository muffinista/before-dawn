"use strict";

const ReleaseCheck = require("../../src/main/release_check.js");
const path = require("path");
const nock = require("nock");
const assert = require("assert");
const fetch = require("node-fetch");

describe("ReleaseCheck", function() {
  let releaseChecker;
  let version = "0.1.1";
  let server = "https://sillynotreal.domain";
  let uriPath = `/update/win32/${version}`;
  let url = `${server}${uriPath}`;
  let fixturePath;

  beforeEach(() => {
    fixturePath = path.join(__dirname, "../fixtures/releases/updates.json");
    releaseChecker = new ReleaseCheck({fetch: fetch});  
  });

  it("handles updates", (done) => {
    nock(server).
      get(uriPath).
      replyWithFile(200, fixturePath, {
        "Content-Type": "application/json",
      });

    releaseChecker.setFeed(url);
    releaseChecker.onUpdate((result) => {
      assert.equal("v0.9.26", result.name);
      done();
    });

    releaseChecker.checkLatestRelease();
  });

  it("handles no updates", (done) => {
    nock(server).
      get(uriPath).
      reply(204, () => {
        return "";
      });

    releaseChecker.setFeed(url);
    releaseChecker.onNoUpdate(() => {
      done();
    });
    releaseChecker.checkLatestRelease();
  });
});