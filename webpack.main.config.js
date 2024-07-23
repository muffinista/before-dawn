"use strict";

import * as path from "path";
import webpack from "webpack";
import "dotenv/config";

import CopyWebpackPlugin from "copy-webpack-plugin";
import { CleanWebpackPlugin } from "clean-webpack-plugin";
import { sentryWebpackPlugin } from "@sentry/webpack-plugin";
import ESLintPlugin from "eslint-webpack-plugin";
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageJSON = JSON.parse(
  await readFile(
    new URL('./package.json', import.meta.url)
  )
);


const dependencies = packageJSON.dependencies;
const optionalDependencies = packageJSON.optionalDependencies || {};

const outputDir = path.join(__dirname, "output");

const COMMIT_SHA = process.env.SENTRY_RELEASE || process.env.GITHUB_SHA;

//
// get a list of node dependencies, and then
// convert it to an array of package names
// this prevents some warnings like:
//
//   Critical dependency: the request of a dependency is an expression
//
// and
//
//   ERROR in ./src/main/fullscreen.js
//   Module not found: Error: Can't resolve 'winctl'
//
// Basically, webpack falls down when you're including node modules
const deps = [].concat(
  Object.keys(dependencies),
  Object.keys(optionalDependencies)
);


let mainConfig = {
  devtool: "inline-source-map",
  mode: (process.env.NODE_ENV === "production" ? "production" : "development"),
  entry: {
    main: path.join(__dirname, "src", "main", "index.js")
  },
  experiments: {
    outputModule: true,
  },
  externals: deps,
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"]
          }
        }
      },
      {
        test: /\.node$/,
        use: "node-loader"
      }
    ]
  },
  node: {
    __dirname: false,
    __filename: false
  },
  optimization: {
    emitOnErrors: false,
    nodeEnv: (process.env.NODE_ENV === "production" ? "production" : "development")
  },
  output: {
    filename: "[name].js",
    path: outputDir,
    sourceMapFilename: "[name].js.map",
    chunkFormat: "module",
    module: true
  },
  plugins: [
    new ESLintPlugin({
      fix: false,
      configType: 'flat'
    }),
    new CleanWebpackPlugin({
      cleanOnceBeforeBuildPatterns: []
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.join(__dirname, "package.json"),
          to: path.join(outputDir)
        },
        {
          from: path.join(__dirname, "src", "main", "assets"),
          to: path.join(outputDir, "assets"),
        },
        {
          from: path.join(__dirname, "src", "main", "system-savers"),
          to: path.join(outputDir, "system-savers"),
        }
      ]
    })
  ],
  resolve: {
    extensions: [".js", ".json"],
    fallback: {
      "child_process": false,
      "url": false,
      "fs": false,
      "path": false,
      "os": false,
      "stream": false,
      "stream/promises": false,
    }
  },
  target: "electron-main"
};

/**
 * Adjust mainConfig for development/production settings
 */
if (process.env.NODE_ENV === "production") {
  mainConfig.devtool = "source-map";
  
  if ( process.env.SENTRY_DSN ) {
    mainConfig.plugins.push(
      new webpack.EnvironmentPlugin(["SENTRY_DSN"])
    );
  }

  mainConfig.plugins.push(
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify("production"),
      "process.env.BEFORE_DAWN_RELEASE_NAME": JSON.stringify(COMMIT_SHA),
    })
  );

  if ( process.env.SENTRY_AUTH_TOKEN && !process.env.DISABLE_SENTRY ) {
    mainConfig.plugins.push(
      sentryWebpackPlugin({
        include: "src",
        ignoreFile: ".sentrycliignore",
        ignore: ["node_modules", "webpack.config.js", "webpack.main.config.js", "webpack.renderer.config.js"],
        org: "colin-mitchell",
        project: "before-dawn",
        authToken: process.env.SENTRY_AUTH_TOKEN,
        release: COMMIT_SHA,
      })
    );
  }
}

export default mainConfig;
