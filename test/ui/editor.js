/* eslint-disable mocha/no-setup-in-describe */
"use strict";

import assert from 'assert';
import path from "path";
import fs from "fs-extra";
import * as helpers from "../helpers.js";

import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

var workingDir;
let app;
let window;

describe("Editor", function() {
  var saverJSON;
  helpers.setupTest(this);

  beforeEach(async function() {
    workingDir = helpers.getTempDir();
    
    var saversDir = helpers.getTempDir();
    saverJSON = helpers.addSaver(saversDir, "saver-one", "saver.json");

    app = await helpers.application(workingDir, true);
    await helpers.callIpc(app, "open-window editor", {
      screenshot: "file://" + path.join(__dirname, "../fixtures/screenshot.png"),
      src: saverJSON
    });

    window = await helpers.waitFor(app, "editor");
  });
    
  it("edits basic settings", async function() {
    const val = await window.inputValue("#saver-form [name='name']");
    assert.strictEqual("Screensaver One", val);

    await window.fill("#saver-form [name='name']", "A New Name!!!");
    await window.fill("#saver-form [name='description']", "A Thing I Made?");
    await window.click("button.save");

    await helpers.sleep(100);

    var x = JSON.parse(fs.readFileSync(saverJSON)).name;
    assert.strictEqual(x, "A New Name!!!");
  });

  it("adds and removes options", async function() {
    await window.fill(".saver-option-input[data-index='0'] [name='name']", "My Option");
    await window.fill(".saver-option-input[data-index='0'] [name='description']", "An Option I Guess?");
    await window.click("button.add-option");

    await window.fill(".saver-option-input[data-index='1'] [name='name']", "My Second Option");
    await window.fill(".saver-option-input[data-index='1'] [name='description']", "Another Option I Guess?");

    await window.selectOption(".saver-option-input[data-index='1'] select", {label: "yes/no"});

    await window.click("button.add-option");
    await window.fill(".saver-option-input[data-index='2'] [name='name']", "My Third Option");
    await window.fill(".saver-option-input[data-index='2'] [name='description']", "Here We Go Again");

    await window.selectOption(".saver-option-input[data-index='2'] select", {label: "slider"});

    await window.click("button.save");

    await helpers.sleep(100);

    var data = JSON.parse(fs.readFileSync(saverJSON));

    var opt = data.options[0];
    assert.strictEqual("My Option", opt.name);
    assert.strictEqual("An Option I Guess?", opt.description);
    assert.strictEqual("text", opt.type);

    opt = data.options[1];
    assert.strictEqual("My Second Option", opt.name);
    assert.strictEqual("Another Option I Guess?", opt.description);
    assert.strictEqual("boolean", opt.type);

    opt = data.options[2];
    assert.strictEqual("My Third Option", opt.name);
    assert.strictEqual("Here We Go Again", opt.description);
    assert.strictEqual("slider", opt.type);

    await window.click(".saver-option-input[data-index='1'] button.remove-option");
    await window.click("button.save");

    await helpers.sleep(100);

    data = JSON.parse(fs.readFileSync(saverJSON));

    opt = data.options[0];
    assert.strictEqual("My Option", opt.name);
    assert.strictEqual("An Option I Guess?", opt.description);
    assert.strictEqual("text", opt.type);
    
    opt = data.options[1];
    assert.strictEqual("My Third Option", opt.name);
    assert.strictEqual("Here We Go Again", opt.description);
    assert.strictEqual("slider", opt.type);
  });
});
