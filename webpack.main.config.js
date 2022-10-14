"use strict";

const path = require("path");
const packageJSON = require("./package.json");

require("dotenv").config();

const dependencies = packageJSON.dependencies;
const optionalDependencies = packageJSON.optionalDependencies || {};
const webpack = require("webpack");

const outputDir = path.join(__dirname, "output");

const CopyWebpackPlugin = require("copy-webpack-plugin");

const COMMIT_SHA = process.env.SENTRY_RELEASE || process.env.GITHUB_SHA;

const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const SentryWebpackPlugin = require("@sentry/webpack-plugin");
const ESLintPlugin = require("eslint-webpack-plugin");

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
    libraryTarget: "commonjs2",
    path: outputDir,
    sourceMapFilename: "[name].js.map"
  },
  plugins: [
    new ESLintPlugin({
      fix: false
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
    extensions: [".js", ".json"]
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

  if ( process.env.SENTRY_AUTH_TOKEN ) {
    console.log("Using SentryWebpackPlugin");
    mainConfig.plugins.push(
      new SentryWebpackPlugin({
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

module.exports = mainConfig;
