"use strict";

/**
 * These are the possible states that the app can be in.
 */
const STATES = {
  STATE_NONE: Symbol("none"), // initial state
  STATE_IDLE: Symbol("idle"), // not running, waiting
  STATE_LOADING: Symbol("loading"), // the liminal state when a screesaver is loaded but not 100%
  STATE_RUNNING: Symbol("running"), // running a screensaver
  STATE_BLANKED: Symbol("blanked"), // long idle, screen is blanked
  STATE_PAUSED: Symbol("paused"), // screensaver is paused,
  STATE_UNRUNNABLE: Symbol("unrunnable")
};

// check for updates every 5 seconds when idle
const IDLE_CHECK_RATE = 5000;

// check for updates every .25 second when active
const ACTIVE_CHECK_RATE = 250;

const IDLE_PADDING_CHECK = 1;

class StateManager {
  constructor(fn) {
    this.STATES = STATES;

    this.currentState = STATES.STATE_NONE;

    this._idleTime = () => {};
    this._blankTime = () => {};
    this._onIdleTime = () => {};
    this._onBlankTime = () => {};
    this._onReset = () => {};
    this.logger = function() {};

    this.lastTime = -1;
    this.enteredStateTimestamp = -1;

    this._ignoreReset = false;
    this.keepTicking = true;  

    this._idleFn = fn;


    this.rates = {
      idle: IDLE_CHECK_RATE,
      active: ACTIVE_CHECK_RATE
    };
 }

  get currentTimeStamp() {
    return process.hrtime()[0];
  }

  set idleFn(x) {
    this._idleFn = x;
  }

  /**
   * setup timing/callbacks
   */
  setup(opts) {
    if ( opts.logger !== undefined ) {
      this.logger = opts.logger;
    }
    else {
      this.logger = function() {};
    }

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
    this.ignoreReset(false);
  }

  unrunnable() {
    this.switchState(STATES.STATE_UNRUNNABLE);
  }

  /**
   * pause the state machine
   */
  pause() {
    this.switchState(STATES.STATE_PAUSED);
  }

  paused() {
    return this.currentState === STATES.STATE_PAUSED;
  }

  /**
   * start running the state machine
   */
  run() {
    this.switchState(STATES.STATE_LOADING);
  }

  running() {
    this.ignoreReset(false);
    this.switchState(STATES.STATE_RUNNING);
  }

  /**
   * handle calling the onIdleTime callback specified in setup
   */
  onIdleTime() {
    this._onIdleTime();
  }

  /**
   * handle calling the onBlankTime callback specified in setup
   */
  onBlankTime() {
    this._onBlankTime();
  }

  onReset() {
    this._onReset();
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
    const callEnterState = ( this.currentState !== s || s === STATES.STATE_IDLE || force === true);

    this.currentState = s;
    this.enteredStateTimestamp = this.currentTimeStamp;

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
      case STATES.STATE_LOADING:
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

  get currentStateString() {
    return this.currentState.toString();
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
    this.logger(`set ignoreReset to ${val}`);
    this._ignoreReset = val;
    if ( this._ignoreReset === false ) {
      this.lastTime = -1;
    } 
  }

  /**
   * check idle time and determine if we should switch states
   */
  tick(runAgain) {
    if ( this.currentState !== STATES.STATE_NONE && this.currentState !== STATES.STATE_PAUSED ) {
      const i = this._idleFn();
      const nextTime = this.getNextTime();
      const hadActivity = (i < this.lastTime ||
        (this.currentState === STATES.STATE_RUNNING && i <= 10  && this.currentTimeStamp - i - IDLE_PADDING_CHECK > this.enteredStateTimestamp));

      // this.logger(`${i} ${this.lastTime} -- ${this.currentStateString}`);

      if ( this.currentState === STATES.STATE_PAUSED ) {
        // do nothing
      } else if ( hadActivity && this.currentState !== STATES.STATE_IDLE ) {
        // we won't actually reset the state while a screensaver is
        // loading, because sometimes we get zombie electron windows
        // when we do that
        if ( ! this._ignoreReset ) {
          this.logger(`Current idle: ${i} Last idle: ${this.lastTime} -- ${this.currentStateString} -- reset`);
          this.reset();
        }
        else {
          this.logger(`Current idle: ${i} Last idle: ${this.lastTime} -- but ignoreReset is true`);
        }
      }
      else if ( i >= nextTime && this.currentState !== STATES.STATE_BLANKED ) {
        if ( this.currentState === STATES.STATE_IDLE) {
          this.logger(`${i} >= ${nextTime} -- switch from ${this.currentStateString} to loading`);
          this.switchState(STATES.STATE_LOADING);
        }
        else if ( this.currentState === STATES.STATE_RUNNING) {
          this.logger(`${i} >= ${nextTime} -- switch from ${this.currentStateString} to blanked`);
          this.switchState(STATES.STATE_BLANKED);
        }
        else {
          // this.logger(`${i} >= ${nextTime} -- switch from ${this.currentStateString} to ????`);
        }
      }

      if ( this.currentState !== STATES.STATE_LOADING ) {
        this.lastTime = i;
      }
    }

    if ( runAgain !== false ) {
      this.scheduleTick();
    }
  }

  scheduleTick() {
    if ( this.keepTicking ) {
      let rate = this.rates.idle;
      if ( this.currentState === STATES.STATE_RUNNING ) {
        rate = this.rates.active;
      }

      setTimeout(() => {
        this.tick(true);
      }, rate);
    }
  }

  setupLogging() {
    this.logger("setupLogging");
    // clearInterval(this.loggingInterval);

    // every minute or so, output the current state
    this.loggingInterval = setInterval(() => {
      this.logger(`Current idle: ${this._idleFn()} Last idle: ${this.lastTime} -- ${this.currentStateString}`);
    }, 60000);
  }

  isTicking() {
    return this.keepTicking === true;
  }

  startTicking() {
    this.logger("startTicking");
    this.keepTicking = true;
    this.setupLogging();
    this.scheduleTick();
  }
  stopTicking() {
    this.logger("stopTicking");
    this.keepTicking = false;
    clearInterval(this.loggingInterval);
  }
}

export default StateManager;
