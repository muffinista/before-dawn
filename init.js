'use strict';
console.log("hello from init.js");

let babelOpts = {
  stage: 2
};

require('electron-compile').initWithOptions({
  cacheDir: './cache',
  compilerOpts: {
    // Compiler options are a map of extension <=> options for compiler
    js: babelOpts
  }
});

require('./main.js');