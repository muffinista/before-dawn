'use strict';
const _ = require('lodash');
const idler = require('node-system-idle-time');
var lastIdle = idler.getIdleTime();
var rate = 25;
var _onReset;

var times = {};
var lastTime = -1;
var _timings = [];



var reset = function() {
  times = {};
  lastTime = -1;
  _timings = [];
};

var set = function(time, fn) {
  times[time] = fn;
  _timings = timings();
};

var onReset = function(fn) {
  _onReset = fn;
};

var timings = function() {
  return Object.keys(times).sort(function(a, b) { return a - b; })
};


var tick = function() {
  var i = idler.getIdleTime();
  var tt = _timings;
  var nextTime = tt.find(function(e) {
    return e >= lastTime;
  });

  if ( i < lastTime && typeof(_onReset) !== "undefined" ) {
    _onReset();
  }
  else if ( i >= nextTime ) {
    //console.log("BING: " + i + " - " + nextTime);
    times[nextTime]();
  }

  lastTime = i;
  run();
};

var run = function() {
  setTimeout(tick, rate);
};


run();

exports.reset = reset;
exports.set = set;
exports.run = run;
exports.onReset = onReset;
