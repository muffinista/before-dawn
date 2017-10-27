const tmp = require('tmp');
const path = require('path');
const fs = require('fs');

exports.getTempDir = function() {
  var tmpObj = tmp.dirSync();
  return tmpObj.name;
};
