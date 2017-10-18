const path = require("path");
const webpack = require("webpack");
const nodeExternals = require("webpack-node-externals");

const externals = nodeExternals({
  whitelist:["jquery", "bootstrap", "popper.js"]
});

const config = {
  context: __dirname,
  entry: {
    prefs: path.resolve(__dirname, "js", "prefs.jsx"),
    editor: path.resolve(__dirname, "js", "watcher.jsx"),
  },
  target: "electron-renderer",
  externals: externals,
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist")
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
          presets: ["env", "es2015", "react"],
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
