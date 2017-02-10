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

const idler = require('node-system-idle-time');

var currentState = STATES.STATE_NONE;
var lastIdle = 0;

var _idleTime;
var _blankTime;
var _wakeupTime;
var _onIdleTime;
var _onBlankTime;
var _timer;

/**
 * setup timing/callbacks
 */
var setup = function(opts) {
  if ( opts.idleTime ) {
    _idleTime = opts.idleTime;
  }
  if ( opts.onIdleTime ) {
    _onIdleTime = opts.onIdleTime;
  }

  if ( opts.blankTime ) {
    _blankTime = opts.blankTime;
  }
  if ( opts.onBlankTime ) {
    _onBlankTime = opts.onBlankTime;
  }

  _wakeupTime = 5000;

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
 * set a timer to reset in the future
 */
var resetAt = function(t) {
  console.log("run reset in " + t);
  clearTimer();
  _timer = setTimeout(reset, t);
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
  var idle = idler.getIdleTime();

  // we run onEnterState if the state has changed or if we need to
  // force a reload. we also run it if the new state is idle, this
  // should help with some weird issues where timers aren't being
  // reset properly
  var callEnterState = ( currentState !== s || s === STATES.STATE_IDLE || force === true);

  console.log("switchState " + String(currentState) + " -> " + String(s) + " IDLE: " + idle + "callEnterState: " + callEnterState);  

  currentState = s;
  
  if ( callEnterState ) {
    onEnterState(s);
  }
};


/**
 * clear any currently running timer
 */
var clearTimer = function() {
  console.log("clearTimer");
  if ( typeof(_timer) !== "undefined" ) {
    _timer = clearTimeout(_timer);
  }
};

/**
 * enter a new state. set any timers/etc needed
 */
var onEnterState = function(s) {
  console.log("onEnterState: " + String(s));
  clearTimer();

  switch (s) {
    case STATES.STATE_IDLE:
      setCheckScreensaverTimer();
      break;
    case STATES.STATE_RUNNING:
      setBlankTimer();
      onIdleTime();
      break;
    case STATES.STATE_BLANKED:
      setWakeupTimer();
      onBlankTime();
      break;
    case STATES.STATE_PAUSED:

      break;
  };
};


/** 
 * set a timer to call checkIdle in time to possibly activate
 * the screensaver
 */
var setCheckScreensaverTimer = function() {
  var idle = idler.getIdleTime();
  var timeLeft = _idleTime - idle;
 
  if ( timeLeft <= 0 ) {
    console.log("setCheckScreensaverTimer: no time, run checkIdle");
    checkIdle();
  }
  else {
    console.log("setCheckScreensaverTimer: set sleep timer for " + timeLeft);
    _timer = setTimeout(checkIdle, timeLeft);
  }
};

/**
 * set a timer to check if we should blank the screen
 */
var setBlankTimer = function() {
  console.log("setBlankTimer");
  if ( _blankTime > 0 ) {
    _timer = setTimeout(checkBlank, _blankTime);
  }
  else {
    console.log("no blank time set");
  }
};

/**
 * set a timer that we'll use to determine if we should reset to idle
 */
var setWakeupTimer = function() {
  var idle = idler.getIdleTime();
  lastIdle = idle;
  
  _timer = setTimeout(checkForWakeup, _wakeupTime);
};


/**
 * main idle time check. once our idle time gets high enough, we
 * activate the screensaver
 */
var checkIdle = function() {
  var idle;
  
  // don't bother checking if we're not in an idle/blank/running state
  // or if we're not supposed to be running
  if ( currentState == STATES.STATE_PAUSED || _idleTime <= 0 ) {
    console.log("paused or no idle time, no screensaver!");
    return;
  }
  idle = idler.getIdleTime();

  // are we past our idle time?
  if ( currentState === STATES.STATE_IDLE ) {
    console.log("checkIdle: should we run screensaver");
    if ( idle > _idleTime ) {
      console.log("yes!");
      switchState(STATES.STATE_RUNNING);
    }
    else {
      console.log("no!");
      setCheckScreensaverTimer();
    }
  }
  else {
    console.log("state is " + String(currentState) + ", exit without doing anything");
  }
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

/**
 * check to see if idle time has gone down since we blanked the screen
 */
var checkForWakeup = function() {
  var idle = idler.getIdleTime();
  console.log("checkForWakeup " + String(currentState) + " " + idle + " " + lastIdle);
  if ( idle < lastIdle ) {
    console.log("Woke up, reset!");
    reset();
  }
  else {
    setWakeupTimer();
  }
};



exports.setup = setup;
exports.reset = reset;
exports.resetAt = resetAt;
exports.pause = pause;
exports.run = run;

