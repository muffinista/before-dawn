"use strict";

import assert from 'assert';
import path from "path";
import fs from "fs-extra";
import * as helpers from "../helpers.js";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

var saversDir;
var workingDir;
let app;

describe("Add New", function() {
  const screensaverUrl = "file://" + path.join(__dirname, "../fixtures/screenshot.png");

  helpers.setupTest(this);

  beforeEach(async function() {
    saversDir = helpers.getTempDir();
    workingDir = helpers.getTempDir();

    app = await helpers.application(workingDir, true);
  });

  describe("when not setup", function() {
    beforeEach(async function() {
      await helpers.callIpc(app, `open-window add-new ${screensaverUrl}`);
    });

    it("shows alert if not setup", async function() {
      const window = await helpers.waitFor(app, "new");
      const elem = await window.$("body");
      const text = await elem.innerText();
      assert(text.lastIndexOf("set a local directory") !== -1);
    });

    // it.skip("can set local source", async function() {
    //   await helpers.waitForWindow(app, windowTitle);
    //   await helpers.waitForText(app, "body", "set a local directory", true);

    //   await helpers.click(app, "button.pick");
    //   await helpers.click(app, "button.save");

    //   await helpers.sleep(100);

    //   assert.equal("/not/a/real/path", currentPrefs().localSource);
    //   const res = await helpers.getElementText(app, "body");
    //   assert(res.lastIndexOf("Use this form") !== -1);
    // });
  });

  describe("when setup", function() {
    let window;

    beforeEach(async function() {
      helpers.addLocalSource(workingDir, saversDir);
      await helpers.callIpc(app, `open-window add-new ${screensaverUrl}`);
      window = await helpers.waitFor(app, "new");
    });

    it("creates screensaver and shows editor", async function() {
      const src = path.join(saversDir, "a-new-name", "saver.json");

      await window.fill("[name='name']", "A New Name");
      await window.fill("[name='description']", "A Thing I Made?");
      await window.click("button.save");

      await helpers.waitFor(app, "editor");
      assert(fs.existsSync(src));
    });
  });
});
