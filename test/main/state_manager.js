// 'use strict';

// const assert = require('assert');
// const sinon = require('sinon');


// describe('StateManager', () => {
//   let hitIdle, hitBlank, hitReset;
//   let sandbox;
//   let stateManager;

//   beforeEach(() => {
//     global.SKIP_NATIVE = true;
//     stateManager = require("../../src/main/state_manager.js");

//     hitIdle = false;
//     hitBlank = false;
//     hitReset = false;
  
//     sandbox = sinon.createSandbox();

//     stateManager.reset();
//     stateManager.setup({
//       idleTime: 100,
//       blankTime: 200,
//       onIdleTime: () => {
//         hitIdle = true;
//       },
//       onBlankTime: () => {
//         hitBlank = true;
//       },
//       onReset: () => {
//         hitReset = true;
//       }
//     });
//   });

//   afterEach(() => {
//     global.SKIP_NATIVE = false;
//     stateManager.stopTicking();
//     sandbox.restore();
//   });

//   it('does nothing', () => {
//     sandbox.stub(stateManager.idler, 'getIdleTime').returns(10);

//     stateManager.tick(false);
//     setTimeout(() => {
//       assert(!hitIdle);
//       assert(!hitBlank);
//       assert(!hitReset);
//     }, 50);
//   });

//   it('idles and blanks', () => {
//     sandbox.stub(stateManager.idler, 'getIdleTime').returns(2500);

//     stateManager.tick(false);
//     setTimeout(() => {
//       assert(hitIdle);
//       assert(hitBlank);
//       assert(!hitReset);
//     }, 50);
//   });

//   it('resets', () => {
//     var idleCount = sandbox.stub(stateManager.idler, 'getIdleTime');
//     idleCount.onCall(0).returns(2500);
//     idleCount.onCall(1).returns(3);

//     setTimeout(() => {
//       stateManager.tick(false);
//       assert(!hitReset);
//     }, 50);

//     setTimeout(() => {
//       stateManager.tick(false);
//       assert(hitReset);
//     }, 100);

//   });
// });