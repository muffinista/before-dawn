'use strict';

// babel compilation might not be an option
// because it is also compiling included screensavers
// and i need to figure out a way to deal with that

/*console.log("hello from init.js");

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
*/

require('./main.js');