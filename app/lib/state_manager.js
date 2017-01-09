const idler = require('node-system-idle-time');

/**
 * These are the possible states that the app can be in.
 */
const STATES = {
  STATE_NONE: Symbol('none'), // initial state
  STATE_IDLE: Symbol('idle'), // not running, waiting
  STATE_RUNNING: Symbol('running'), // running a screensaver
  STATE_CLOSING: Symbol('closing'), // closing the screensaver process
  STATE_BLANKED: Symbol('blanked'), // long idle, screen is blanked
  STATE_PAUSED: Symbol('paused') // screensaver is paused
};

var currentState = STATES.STATE_NONE;
var _idleTime;
var _blankTime;
var _onIdleTime;
var _onBlankTime;
var _timer;

var setup = function(opts) {
  if ( opts.idleTime ) {
    _idleTime = opts.idleTime;
  }
  if ( opts.blankTime ) {
    _blankTime = opts.blankTime;
  }
  if ( opts.onIdleTime ) {
    _onIdleTime = opts.onIdleTime;
  }
  if ( opts.onBlankTime ) {
    _onBlankTime = opts.onBlankTime;
  }

  if ( opts.state ) {
    switchState(opts.state);
  }
  else {
    switchState(STATES.STATE_IDLE);
  }
};

var reset = function() {
  switchState(STATES.STATE_IDLE);
}
var pause = function() {
  switchState(STATES.STATE_PAUSED);
}
var run = function() {
  switchState(STATES.STATE_RUNNING);
};

var onIdleTime = function(f) {
  if ( typeof(_onIdleTime) !== "undefined" ) {
    _onIdleTime();
  }
};

var onBlankTime = function(f) {
  if ( typeof(_onBlankTime) !== "undefined" ) {
    _onBlankTime();
  }
};


var switchState = function(s) {
  var idle = idler.getIdleTime();
  console.log("switchState " + String(currentState) + " -> " + String(s) + " IDLE: " + idle);  

  if ( currentState !== s ) {
    onEnterState(s);
  }
  currentState = s;
};


var clearTimer = function() {
  if ( typeof(_timeout) !== "undefined" ) {
    _timeout = clearTimeout(_timeout);
  }
};

// private
var onEnterState = function(s) {
  console.log("onEnterState: " + String(s));
  switch (s) {
    case STATES.STATE_IDLE:
      setSleepTimer();
      break;
    case STATES.STATE_RUNNING:
      setBlankTimer();
      onIdleTime();
      break;
    case STATES.STATE_CLOSING:

      break;
    case STATES.STATE_BLANKED:
      onBlankTime();
      break;
    case STATES.STATE_PAUSED:

      break;
  };
};


var setSleepTimer = function() {
  var idle = idler.getIdleTime();
  var timeLeft = _idleTime - idle;

  clearTimer();

  if ( timeLeft <= 0 ) {
    checkIdle();
  }
  else {
    console.log("set sleep timer for " + _idleTime);
    _timer = setTimeout(checkIdle, _idleTime);
  }
};


var setBlankTimer = function() {
  clearTimer();
  _timer = setTimeout(checkBlank, _blankTime);
};


/**
 * main idle time check. once our idle time gets high enough, we
 * activate the screensaver
 */
var checkIdle = function() {
  var idle;
  
  // don't bother checking if we're not in an idle/blank/running state
  if ( currentState == STATES.STATE_PAUSED || currentState == STATES.STATE_CLOSING ) {
    return;
  }

  // check that we are actually supposed to be running
  if ( _idleTime <= 0 ) {
    return;
  }
  
  idle = idler.getIdleTime();

  // are we past our idle time?
  //if ( currentState === STATE_IDLE && idle > waitTime ) {
  if ( currentState === STATES.STATE_IDLE ) {
    if ( idle > _idleTime ) {
      switchState(STATES.STATE_RUNNING);
    }
    else {
      setSleepTimer();
    }
  }
};

var checkBlank = function() {
  if ( currentState === STATES.STATE_RUNNING ) {
    switchState(STATES.STATE_BLANKED);
  }
};


exports.setup = setup;
exports.reset = reset;
exports.pause = pause;
exports.run = run;

