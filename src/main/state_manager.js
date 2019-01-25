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

const IDLE_CHECK_RATE = 25;

class StateManager {
  constructor(fn) {
    this.STATES = STATES;

    this.currentState = STATES.STATE_NONE;

    this._idleTime = undefined;
    this._blankTime = undefined;
    this._onIdleTime = undefined;
    this._onBlankTime = undefined;
    
    this._onReset = undefined;
    this.lastTime = -1;

    this._ignoreReset = false;
    this.keepTicking = true;  

    this._idleFn = fn;
  }

  set idleFn(x) {
    this._idleFn = x;
  }

  /**
   * setup timing/callbacks
   */
  setup(opts) {
    if ( opts.idleTime && opts.onIdleTime ) {
      this._idleTime = opts.idleTime;
      this._onIdleTime = opts.onIdleTime;
    }

    if ( opts.blankTime && opts.onBlankTime ) {
      this._blankTime = opts.blankTime;
      this._onBlankTime = opts.onBlankTime;
    }

    if ( opts.onReset ) {
      this._onReset = opts.onReset;
    }

    if ( opts.state ) {
      this.switchState(opts.state);
    }
    else {
      this.switchState(STATES.STATE_IDLE);
    }
  }


  /**
   * reset to idle and clear any timers
   */
  reset() {
    this.switchState(STATES.STATE_IDLE);
  }


  /**
   * pause the state machine
   */
  pause() {
    this.switchState(STATES.STATE_PAUSED);
  }

  /**
   * start running the state machine
   */
  run() {
    this.switchState(STATES.STATE_RUNNING);
  }

  /**
   * handle calling the onIdleTime callback specified in setup
   */
  onIdleTime() {
    if ( typeof(this._onIdleTime) !== "undefined" ) {
      this._onIdleTime();
    }
  }

  /**
   * handle calling the onBlankTime callback specified in setup
   */
  onBlankTime() {
    if ( typeof(this._onBlankTime) !== "undefined" ) {
      this._onBlankTime();
    }
  }

  onReset() {
    if ( typeof(this._onReset) !== "undefined" ) {
      this._onReset();
    } 
  }

  /**
   * switch to a new state. if we're not already in that state, or if
   * force == true, call onEnterState
   */
  switchState(s, force) {
    // we run onEnterState if the state has changed or if we need to
    // force a reload. we also run it if the new state is idle, this
    // should help with some weird issues where timers aren't being
    // reset properly
    var callEnterState = ( this.currentState !== s || s === STATES.STATE_IDLE || force === true);

    this.currentState = s;
    
    if ( callEnterState ) {
      this.onEnterState(s);
    }
  }


  /**
   * enter a new state. set any timers/etc needed
   */
  onEnterState(s) {
    switch (s) {
      case STATES.STATE_IDLE:
        this.onReset();
        break;
      case STATES.STATE_RUNNING:
        this.onIdleTime();
        break;
      case STATES.STATE_BLANKED:
        this.onBlankTime();
        break;
      case STATES.STATE_PAUSED:
        break;
    }
  }


  getCurrentState() {
    return this.currentState;
  }

  /**
   * based on our current state, figure out the timestamp
   * that we will enter the next state
   */
  getNextTime() {
    if ( this.currentState === STATES.STATE_RUNNING ) {
      return this._blankTime;
    }
    return this._idleTime;
  }

  ignoreReset(val) {
    this._ignoreReset = val;
    if ( this._ignoreReset === false ) {
      this.lastTime = -1;
    } 
  }

  /**
   * check idle time and determine if we should switch states
   */
  tick(runAgain) {
    var i, nextTime, hadActivity;

    if ( this.currentState !== STATES.STATE_NONE && this.currentState !== STATES.STATE_PAUSED ) {
      i = this._idleFn();

      nextTime = this.getNextTime();

      hadActivity = (i < this.lastTime);
    
      if ( hadActivity && this.currentState !== STATES.STATE_IDLE && typeof(this._onReset) !== "undefined" ) {
        // we won't actually reset the state while a screensaver is
        // loading, because sometimes we get zombie electron windows
        // when we do that
        if ( ! this._ignoreReset ) {
          this.reset();
        }
      }
      else if ( i >= nextTime ) {
        if ( this.currentState === STATES.STATE_IDLE) {
          this.switchState(STATES.STATE_RUNNING);
        }
        else if ( this.currentState === STATES.STATE_RUNNING) {
          this.switchState(STATES.STATE_BLANKED);
        }
      }
      
      this.lastTime = i;
    }

    if ( runAgain !== false ) {
      this.scheduleTick();
    }
  }

  scheduleTick() {
    if ( this.keepTicking ) {
      setTimeout(() => {
        this.tick();
      }, IDLE_CHECK_RATE);
    }
  }

  startTicking() {
    this.scheduleTick();
  }
  stopTicking() {
    this.keepTicking = false;
  }
}

module.exports = StateManager;
