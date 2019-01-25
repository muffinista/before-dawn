"use strict";

const assert = require("assert");
const sinon = require("sinon");

const StateManager = require("../../src/main/state_manager.js");
const fakeIdler = {
  getIdleTime: () => { return 0; }
};

describe("StateManager", () => {
  let hitIdle, hitBlank, hitReset;
  let sandbox;
  let stateManager;

  beforeEach(() => {
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

  afterEach(() => {
    stateManager.stopTicking();
    sandbox.restore();
  });

  it("does nothing", (done) => {
    sandbox.stub(fakeIdler, "getIdleTime").returns(10);
    stateManager.idleFn = fakeIdler.getIdleTime;

    stateManager.tick(false);
    setTimeout(() => {
      assert(!hitIdle);
      assert(!hitBlank);
      //assert(!hitReset);

      done();
    }, 50);
  });

  it("idles", (done) => {
    sandbox.stub(fakeIdler, "getIdleTime").returns(2500);
    stateManager.idleFn = fakeIdler.getIdleTime;

    stateManager.tick(false);
    setTimeout(() => {
      assert(hitIdle);
      assert(!hitBlank);

      done();
    }, 50);
  });

  it("blanks", (done) => {
    sandbox.stub(fakeIdler, "getIdleTime").returns(2500);
    stateManager.idleFn = fakeIdler.getIdleTime;
    stateManager.switchState(stateManager.STATES.STATE_RUNNING);

    stateManager.tick(false);
    setTimeout(() => {
      assert(hitBlank);
      done();
    }, 50);
  });

  it("resets", (done) => {
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