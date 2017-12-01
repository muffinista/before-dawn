"use strict";

/**
 * These are the possible states that the app can be in.
 */
const STATES = {
  STATE_NONE: Symbol("none"), // initial state
  STATE_IDLE: Symbol("idle"), // not running, waiting
  STATE_RUNNING: Symbol("running"), // running a screensaver
  STATE_BLANKED: Symbol("blanked"), // long idle, screen is blanked
  STATE_PAUSED: Symbol("paused") // screensaver is paused
};

const idler = require("node-system-idle-time");
const IDLE_CHECK_RATE = 25;

var currentState = STATES.STATE_NONE;

var _idleTime;
var _blankTime;
var _onIdleTime;
var _onBlankTime;

var _onReset;
var lastTime = -1;

/**
 * setup timing/callbacks
 */
var setup = function(opts) {
  if ( opts.idleTime && opts.onIdleTime ) {
    _idleTime = opts.idleTime;
    _onIdleTime = opts.onIdleTime;
  }

  if ( opts.blankTime && opts.onBlankTime ) {
    _blankTime = opts.blankTime;
    _onBlankTime = opts.onBlankTime;
  }

  if ( opts.onReset ) {
    _onReset = opts.onReset;
  }

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
  switchState(STATES.STATE_IDLE);
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
    //console.log("onIdleTime: " + String(currentState));
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

var onReset = function(f) {
  if ( typeof(_onReset) !== "undefined" ) {
    _onReset();
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

  //console.log("switchState from " + String(currentState) + " to " + String(s) + " " + callEnterState);
  
  currentState = s;
  
  if ( callEnterState ) {
    onEnterState(s);
  }
};


/**
 * enter a new state. set any timers/etc needed
 */
var onEnterState = function(s) {
  //console.log("onEnterState: " + String(s));

  switch (s) {
    case STATES.STATE_IDLE:
      onReset();
      break;
    case STATES.STATE_RUNNING:
      onIdleTime();
      break;
    case STATES.STATE_BLANKED:
      onBlankTime();
      break;
    case STATES.STATE_PAUSED:
      break;
  }
};


/**
 * check to see if we should switch from running -> blanked
 */
var checkBlank = function() {
  //console.log("checkBlank");
  if ( currentState === STATES.STATE_RUNNING ) {
    switchState(STATES.STATE_BLANKED);
  }
};

var getCurrentState = function() {
  return currentState;
};

/**
 * based on our current state, figure out the timestamp
 * that we will enter the next state
 */
var getNextTime = function() {
  if ( currentState === STATES.STATE_RUNNING ) {
    return _blankTime;
  }
  return _idleTime;
};

var _ignoreReset = false;
var ignoreReset = function(val) {
  _ignoreReset = val;
  if ( _ignoreReset === false ) {
    lastTime = -1;
  } 
};

/**
 * check idle time and determine if we should switch states
 */
var tick = function() {
  var i, nextTime, hadActivity;

  if ( currentState !== STATES.STATE_NONE && currentState !== STATES.STATE_PAUSED ) {
    i = idler.getIdleTime();
    nextTime = getNextTime();

    hadActivity = (i < lastTime);

  
    if ( hadActivity && currentState !== STATES.STATE_IDLE && typeof(_onReset) !== "undefined" ) {
      // we won't actually reset the state while a screensaver is
      // loading, because sometimes we get zombie electron windows
      // when we do that
      if ( ! _ignoreReset ) {
        reset();
      }
    }
    else if ( i >= nextTime ) {
      if ( currentState === STATES.STATE_IDLE) {
        switchState(STATES.STATE_RUNNING);
      }
      else if ( currentState === STATES.STATE_RUNNING) {
        switchState(STATES.STATE_BLANKED);
      }
    }
    
    lastTime = i;
  }

  scheduleTick();
};

var scheduleTick = function() {
  setTimeout(tick, IDLE_CHECK_RATE);
};

scheduleTick();


exports.states = STATES;
exports.setup = setup;
exports.reset = reset;
exports.pause = pause;
exports.run = run;
exports.currentState = getCurrentState;
exports.ignoreReset = ignoreReset;
