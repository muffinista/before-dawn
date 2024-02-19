"use strict";


import assert from 'assert';
import sinon from "sinon";

import StateManager from "../../src/main/state_manager.js";

const fakeIdler = {
  getIdleTime: () => { return 0; }
};

describe("StateManager", function() {
  let hitIdle, hitBlank, hitReset;
  let sandbox;
  let stateManager;

  beforeEach(function() {
    stateManager = new StateManager();

    hitIdle = false;
    hitBlank = false;
    hitReset = false;
  
    sandbox = sinon.createSandbox();

    stateManager.reset();
    stateManager.setup({
      idleTime: 100,
      blankTime: 200,
      onIdleTime: () => {
        hitIdle = true;
      },
      onBlankTime: () => {
        hitBlank = true;
      },
      onReset: () => {
        hitReset = true;
      }
    });
  });

  afterEach(function() {
    stateManager.stopTicking();
    sandbox.restore();
  });

  it("does nothing", function(done) {
    sandbox.stub(fakeIdler, "getIdleTime").returns(0.01);
    stateManager.idleFn = fakeIdler.getIdleTime;

    stateManager.tick(false);
    setTimeout(() => {
      assert(!hitIdle);
      assert(!hitBlank);
      //assert(!hitReset);

      done();
    }, 50);
  });

  it("idles", function(done) {
    sandbox.stub(fakeIdler, "getIdleTime").returns(200);
    stateManager.idleFn = fakeIdler.getIdleTime;

    stateManager.tick(false);
    setTimeout(() => {
      assert(hitIdle);
      assert(!hitBlank);

      done();
    }, 50);
  });

  it("blanks", function(done) {
    sandbox.stub(fakeIdler, "getIdleTime").returns(1000);
    stateManager.idleFn = fakeIdler.getIdleTime;
    stateManager.switchState(stateManager.STATES.STATE_RUNNING);

    stateManager.tick(false);
    setTimeout(() => {
      assert(hitBlank);
      done();
    }, 50);
  });

  it("resets", function(done) {
    var idleCount = sandbox.stub(fakeIdler, "getIdleTime");
    idleCount.onCall(0).returns(3);

    stateManager.idleFn = fakeIdler.getIdleTime;
    stateManager.switchState(stateManager.STATES.STATE_RUNNING);

    setTimeout(() => {
      stateManager.tick(false);
      assert(hitReset);
      done();
    }, 50);

  });
});