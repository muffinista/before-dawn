'use strict';
const fs = require('fs');
const path = require('path');

var version = JSON.parse(fs.readFileSync("package.json")).version;

console.log("Specifying v" + version);

var build = JSON.parse(fs.readFileSync("build.json"));

build.win.version = version;
build.osx.version = version;
build.linux.version = version;

console.log(build);

fs.writeFileSync("build.json", JSON.stringify(build, null, 4));
