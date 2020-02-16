"use strict";

const path = require("path");
const packageJSON = require("./package.json");

const dependencies = packageJSON.dependencies;
const optionalDependencies = packageJSON.optionalDependencies || {};
const webpack = require("webpack");

const outputDir = path.join(__dirname, "output");

const CopyWebpackPlugin = require("copy-webpack-plugin");

const releaseName = `${packageJSON.productName} ${packageJSON.version}`;


const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const ChmodWebpackPlugin = require("chmod-webpack-plugin");
const SentryWebpackPlugin = require("@sentry/webpack-plugin");

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
    main: path.join(__dirname, "src/main/index.js")
  },
  externals: deps,
  module: {
    rules: [
      {
        test: /\.(js)$/,
        enforce: "pre",
        exclude: [
          /node_modules/,
          /lib/
        ],
        use: {
          loader: "eslint-loader",
          options: {
            formatter: require("eslint-friendly-formatter")
          }
        }
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
    noEmitOnErrors: true,
    nodeEnv: (process.env.NODE_ENV === "production" ? "production" : "development")
  },
  output: {
    filename: "[name].js",
    libraryTarget: "commonjs2",
    path: outputDir,
    sourceMapFilename: "[name].js.map"
  },
  plugins: [
    new CleanWebpackPlugin({
      cleanOnceBeforeBuildPatterns: []
    }),
    new CopyWebpackPlugin([
      {
        from: path.join(__dirname, "package.json"),
        to: path.join(outputDir)
      },
      {
        from: path.join(__dirname, "src", "main", "assets"),
        to: path.join(outputDir, "assets"),
        ignore: [".*"]
      },
      {
        from: path.join(__dirname, "src", "bin"),
        to: path.join(outputDir, "bin")
      },
      {
        from: path.join(__dirname, "src", "main", "system-savers"),
        to: path.join(outputDir, "system-savers"),
        ignore: [".*"]
      },
      {
        from: path.join(__dirname, "src", "shim.html"),
        to: path.join(outputDir)
      }
    ]),
    new ChmodWebpackPlugin([
      {path: path.join(outputDir, "bin", "lock-screen.sh")}
      ],
      {
        verbose: true,
        mode:    770,
      }
    ),
    new webpack.NoEmitOnErrorsPlugin(),
  ],
  resolve: {
    extensions: [".js", ".json", ".node"]
  },
  target: "electron-main"
};

/**
 * Adjust mainConfig for development/production settings
 */
if (process.env.NODE_ENV === "production") {
  mainConfig.devtool = "source-map";
  
  mainConfig.plugins.push(
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify("production"),
      "process.env.BEFORE_DAWN_RELEASE_NAME": JSON.stringify(releaseName)
    }),
    new SentryWebpackPlugin({
      include: "src",
      ignoreFile: ".sentrycliignore",
      ignore: ["node_modules", "webpack.config.js", "webpack.main.config.js", "webpack.renderer.config.js"],
      configFile: "sentry.properties"
    })
  );
} else {
  mainConfig.plugins.push(
    new webpack.DefinePlugin({
      "__static": `"${path.join(__dirname, "../static").replace(/\\/g, "\\\\")}"`
    })
  );
}

module.exports = mainConfig;
