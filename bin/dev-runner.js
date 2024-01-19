"use strict";

import electron from "electron";
import * as path from "path";
import spawn from "child_process";
import webpack from "webpack";
import WebpackDevServer from "webpack-dev-server";

import { readFile } from 'node:fs/promises';

let devPort;

import mainConfig from "../webpack.main.config.js";
import rendererConfig from "../webpack.renderer.config.js";

try {
  const packageJSON = JSON.parse(
    await readFile(
      new URL('../package.json', import.meta.url)
    )
  );
  
  devPort = packageJSON.devport;
}
catch(e) {
  devPort = 9080;
}


let electronProcess = null;
let manualRestart = false;
let skipMainRestart = true;

/**
 * Setup webpack compiler and server for the renderer process
 * 
 * @returns Promise
 */
function startRenderer () {
  return new Promise((resolve) => {
    const compiler = webpack(rendererConfig);
    const serverOptions = {
      host: "localhost",
      port: devPort,
      hot: true,
      onListening: function (devServer) {
        const port = devServer.server.address().port;
        console.log("Listening on port:", port);
      },
      setupMiddlewares: function (middlewares, server) {
        server.middleware.waitUntilValid(() => {
          console.log("startRenderer finished");
          resolve();
        });
        return  middlewares;
      }
    };

    const devServer = new WebpackDevServer(
      serverOptions, compiler
    );

    devServer.start(null, "localhost", () => {
    });
  });
}

/**
 * Setup webpack compiler and watcher for the main process
 * 
 * @returns Promise
 */
 function startMain () {
  return new Promise((resolve) => {
    const mainCompiler = webpack(mainConfig);
    mainCompiler.run(() => {
      mainCompiler.watch({}, (err) => {
        if (err) {
          console.log(err);
          return;
        }

        // skip the first watch event
        if ( skipMainRestart ) {
          skipMainRestart = false;
          return;
        }

        // kill and restart the main process
        if (electronProcess && electronProcess.kill) {
          manualRestart = true;
          process.kill(electronProcess.pid);
          electronProcess = null;
          startElectron();

          setTimeout(() => {
            manualRestart = false;
          }, 5000);
        }
      });

      resolve();
    });
  });
}

function startElectron () {
  electronProcess = spawn(electron, ["--inspect=5858", path.join(__dirname, "../src/main/index.dev.js")]);

  electronProcess.stdout.on("data", data => {
    process.stdout.write(data.toString());
  });
  electronProcess.stderr.on("data", data => {
    process.stdout.write(data.toString());
  });
  electronProcess.on("close", () => {
    if (!manualRestart) {process.exit();}
  });
}

function init () {
  Promise.all([startRenderer(), startMain()])
    .then(startElectron)
    .catch(console.error);
}

init();
