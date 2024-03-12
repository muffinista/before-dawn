"use strict";


import assert from 'assert';
import path from "path";
import nock from "nock";

import ReleaseCheck from "../../src/main/release_check.js";

import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
  

describe("ReleaseCheck", function() {
  let releaseChecker;
  let version = "0.1.1";
  let server = "https://sillynotreal.domain";
  let uriPath = `/update/win32/${version}`;
  let url = `${server}${uriPath}`;
  let fixturePath;

  beforeEach(function() {
    fixturePath = path.join(__dirname, "../fixtures/releases/updates.json");
    releaseChecker = new ReleaseCheck();  
  });

  it("handles updates", function(done) {
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

  it("handles no updates", function(done) {
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