const path = require("path");
const webpack = require("webpack");
const nodeExternals = require("webpack-node-externals");

const externals = nodeExternals({
  whitelist:["jquery", "bootstrap", "popper.js"]
});

const appDir = path.resolve(__dirname, "app");

const config = {
  context: __dirname,
  entry: {
    prefs: path.resolve(appDir, "js", "prefs.jsx"),
    editor: path.resolve(appDir, "js", "watcher.jsx"),
    new: path.resolve(appDir, "js", "new.js"),    
  },
  target: "electron-renderer",
  externals: externals,
  output: {
    filename: "[name].js",
    path: path.resolve(appDir, "dist")
  },
  devtool: "source-map",
  stats: "verbose",
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: "babel-loader",
        options: {
          presets: ["env", "react"],
          plugins: [require("babel-plugin-transform-object-rest-spread")]
        }
      },
      {
        test: require.resolve("jquery"),
        use: [
          { loader: "expose-loader", options: "jQuery" },
          { loader: "expose-loader", options: "$" }
        ]
      },
    ]
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.ProvidePlugin({
      $: "jquery",
      jQuery: "jquery",
      "window.jQuery": "jquery",
      "Popper": ["popper.js", "default"],
    })
  ]
};

module.exports = config;
