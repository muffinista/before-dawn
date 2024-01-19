"use strict";

import assert from 'assert';
import * as helpers from "../helpers.js";
import fs from "fs";

const packageJSON = JSON.parse(fs.readFileSync("./package.json"));

var workingDir;
let app;

describe("About", function() {
  helpers.setupTest(this);

  beforeEach(async function() {
    workingDir = helpers.getTempDir();
    helpers.setupFullConfig(workingDir);

    app = await helpers.application(workingDir, true);
    await helpers.callIpc(app, "open-window about");
  });

  it("has some text and current version number", async function() {
    const window = await helpers.waitFor(app, "about");

    const elem = await window.$("body");
    const text = await elem.innerText();
    assert(text.lastIndexOf("// screensaver fun //") !== -1);
    assert(text.lastIndexOf(packageJSON.version) !== -1);
  });
});
