'use strict';

/**
 * These are the possible states that the app can be in.
 */
const STATES = {
  STATE_NONE: Symbol('none'), // initial state
  STATE_IDLE: Symbol('idle'), // not running, waiting
  STATE_RUNNING: Symbol('running'), // running a screensaver
  STATE_BLANKED: Symbol('blanked'), // long idle, screen is blanked
  STATE_PAUSED: Symbol('paused') // screensaver is paused
};

const idleEvents = require('./idle-events');

var currentState = STATES.STATE_NONE;

var _idleTime;
var _blankTime;
var _onIdleTime;
var _onBlankTime;


/**
 * setup timing/callbacks
 */
var setup = function(opts) {
  idleEvents.reset();

  if ( opts.idleTime && opts.onIdleTime ) {
    _idleTime = opts.idleTime;
    _onIdleTime = opts.onIdleTime;

    idleEvents.set(_idleTime, _onIdleTime);
  }

  if ( opts.blankTime && opts.onBlankTime ) {
    _blankTime = opts.blankTime;
    _onBlankTime = opts.onBlankTime;

    idleEvents.set(_blankTime, _onBlankTime);
  }

  idleEvents.onReset(reset);

  if ( opts.state ) {
    switchState(opts.state);
  }
  else {
    switchState(STATES.STATE_IDLE);
  }
};

/**
 * reset to idle and clear any timers
 */
var reset = function() {
  console.log("RESET");
  switchState(STATES.STATE_IDLE, true);
};


/**
 * pause the state machine
 */
var pause = function() {
  switchState(STATES.STATE_PAUSED);
};

/**
 * start running the state machine
 */
var run = function() {
  switchState(STATES.STATE_RUNNING);
};

/**
 * handle calling the onIdleTime callback specified in setup
 */
var onIdleTime = function(f) {
  if ( typeof(_onIdleTime) !== "undefined" ) {
    console.log("call idle callback");
    _onIdleTime();
  }
};

/**
 * handle calling the onBlankTime callback specified in setup
 */
var onBlankTime = function(f) {
  if ( typeof(_onBlankTime) !== "undefined" ) {
    _onBlankTime();
  }
};


/**
 * switch to a new state. if we're not already in that state, or if
 * force == true, call onEnterState
 */
var switchState = function(s, force) {
  // we run onEnterState if the state has changed or if we need to
  // force a reload. we also run it if the new state is idle, this
  // should help with some weird issues where timers aren't being
  // reset properly
  var callEnterState = ( currentState !== s || s === STATES.STATE_IDLE || force === true);

  console.log("switchState " + String(currentState) + " -> " + String(s) + " callEnterState: " + callEnterState);  

  currentState = s;
  
  if ( callEnterState ) {
    onEnterState(s);
  }
};


/**
 * enter a new state. set any timers/etc needed
 */
var onEnterState = function(s) {
  console.log("onEnterState: " + String(s));

  switch (s) {
    case STATES.STATE_IDLE:
      break;
    case STATES.STATE_RUNNING:
      onIdleTime();
      break;
    case STATES.STATE_BLANKED:
      onBlankTime();
      break;
    case STATES.STATE_PAUSED:

      break;
  };
};


/**
 * check to see if we should switch from running -> blanked
 */
var checkBlank = function() {
  console.log("checkBlank");
  if ( currentState === STATES.STATE_RUNNING ) {
    switchState(STATES.STATE_BLANKED);
  }
};

var getCurrentState = function() {
  return currentState;
};


exports.states = STATES;
exports.setup = setup;
exports.reset = reset;
exports.pause = pause;
exports.run = run;
exports.currentState = getCurrentState;
