"use strict";

import * as path from "path";
import webpack from "webpack";
import "dotenv/config";

import HtmlWebpackPlugin from "html-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
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

const productName = packageJSON.productName;
const outputDir = path.join(__dirname, "output");

const COMMIT_SHA = process.env.SENTRY_RELEASE || process.env.GITHUB_SHA;

var htmlPageOptions = function(id, title) {
  return {
    filename: `${id}.html`,
    template: path.resolve(__dirname, "src/index.ejs"),
    id: id,
    title: `${productName}: ${title}`,
    minify: {
      collapseWhitespace: false,
      removeAttributeQuotes: false,
      removeComments: false
    }
  };
};

/**
 * List of node_modules to include in webpack bundle
 *
 * Required for specific packages like Vue UI libraries
 * that provide pure *.vue files that need compiling
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/webpack-configurations.html#white-listing-externals
 */
// let whiteListedModules = [];

// let externals = [
//   ...Object.keys(dependencies || {}).filter(d => !whiteListedModules.includes(d))
// ];

// console.log("EXTERNALS", externals);

let rendererConfig = {
  devtool: "inline-source-map",
  entry: {
    renderer: path.join(__dirname, "src", "renderer", "main.js")
  },
  // externals: externals,
  module: {
    rules: [
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader",
          "sass-loader",
        ]
      },
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
        test: /\.svelte$/,
        use: {
            loader: "svelte-loader",
            options: {
              emitCss: true,
            }
        },
      },
      {
        // required to prevent errors from Svelte on Webpack 5+, omit on Webpack 4
        test: /node_modules\/svelte\/.*\.mjs$/,
        resolve: {
          fullySpecified: false
        }
      },
    ]
  },
  node: {
    __dirname: false,
    __filename: false
  },
  plugins: [
    new ESLintPlugin({
      fix: false,
      configType: 'flat',
      extensions: ["js"]
    }),
    new HtmlWebpackPlugin(htmlPageOptions("prefs", "Preferences")),
    new HtmlWebpackPlugin(htmlPageOptions("settings", "Settings")),
    new HtmlWebpackPlugin(htmlPageOptions("editor", "Editor")),    
    new HtmlWebpackPlugin(htmlPageOptions("new", "Create Screensaver!")),
    new HtmlWebpackPlugin(htmlPageOptions("about", "About!")),
    new MiniCssExtractPlugin({
      filename: "[name].css",
      chunkFilename: "[id].css"
    }),
  ],
  optimization: {
    emitOnErrors: false,
    nodeEnv: (process.env.NODE_ENV === "production" ? "production" : "development")
  },
  output: {
    filename: "[name].js",
    library: "[name]",
    libraryTarget: "var",
    path: outputDir,
    publicPath: ""
  },
  mode: (process.env.NODE_ENV === "production" ? "production" : "development"),
  resolve: {
    alias: {
      // handy alias for the root path of render files
      "@": path.join(__dirname, "src", "renderer"),
      "~": path.join(__dirname, "src")
    },
    extensions: [".js", ".json", ".css", ".svelte"],
    conditionNames: ["svelte", "browser", "import"]
  },
  target: "web"
};


/**
 * Adjust rendererConfig for production settings
 */
if (process.env.NODE_ENV === "production") {
  rendererConfig.devtool = "source-map";

  if ( process.env.SENTRY_DSN ) {
    rendererConfig.plugins.push(
      new webpack.EnvironmentPlugin(["SENTRY_DSN"])
    );
  }

  rendererConfig.plugins.push(
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify("production"),
      "process.env.BEFORE_DAWN_RELEASE_NAME": JSON.stringify(COMMIT_SHA),
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true
    })
  );

  if ( process.env.SENTRY_AUTH_TOKEN && !process.env.DISABLE_SENTRY ) {
    rendererConfig.plugins.push(
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

export default rendererConfig;
