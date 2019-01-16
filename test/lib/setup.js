const tmp = require("tmp");
const path = require("path");
const fs = require("fs-extra");

exports.getTempDir = function() {
  var tmpObj = tmp.dirSync();
  return tmpObj.name;
};

exports.addSaver = function(dir, key, fname) {
  var src = path.join(__dirname, "../fixtures/" + fname);
  var dest = path.join(dir, key);

  fs.mkdirSync(dest);
  fs.copySync(src, path.join(dest, "saver.json")); 
};
