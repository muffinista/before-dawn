"use strict";

const path = require("path");
const packageJSON = require(`${"./package.json"}`);

const productName = packageJSON.productName;
const dependencies = packageJSON.dependencies;

const webpack = require("webpack");

const outputDir = path.join(__dirname, "output");

const HtmlWebpackPlugin = require("html-webpack-plugin");
const { VueLoaderPlugin } = require("vue-loader");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const SentryWebpackPlugin = require("@sentry/webpack-plugin");

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
let whiteListedModules = ["vue"];

let externals = [
  ...Object.keys(dependencies || {}).filter(d => !whiteListedModules.includes(d))
];

let rendererConfig = {
  devtool: "inline-source-map",
  entry: {
    renderer: path.join(__dirname, "src", "renderer", "main.js")
  },
  externals: externals,
  module: {
    rules: [
      {
        test: /\.(js|vue)$/,
        enforce: "pre",
        exclude: /node_modules/,
        include: [],
        use: {
          loader: "eslint-loader",
          options: {
            formatter: require("eslint-friendly-formatter")
          }
        }
      },
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
        test: /\.vue$/,
        use: {
          loader: "vue-loader",
          options: {
            extractCSS: process.env.NODE_ENV === "production",
            loaders: {
              sass: "vue-style-loader!css-loader!sass-loader?indentedSyntax=1",
              scss: "vue-style-loader!css-loader!sass-loader"
            }
          }
        }
      },
    ]
  },
  node: {
    __dirname: false,
    __filename: false
  },
  plugins: [
    new VueLoaderPlugin(),
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
      vue: "vue/dist/vue.esm-bundler.js"
    },
    extensions: [".js", ".vue", ".json", ".css", ".node"]
  },
  target: "web"
};


/**
 * Adjust rendererConfig for production settings
 */
if (process.env.NODE_ENV === "production") {
  rendererConfig.devtool = "source-map";

  rendererConfig.plugins.push(
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify("production"),
      "process.env.BEFORE_DAWN_RELEASE_NAME": JSON.stringify(COMMIT_SHA),
      "__VUE_OPTIONS_API__": true,
      "__VUE_PROD_DEVTOOLS__": false
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true
    })
  );

  if ( process.env.SENTRY_AUTH_TOKEN ) {
    console.log("Using SentryWebpackPlugin");

    rendererConfig.plugins.push(
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
} else {
  rendererConfig.plugins.push(
    new webpack.DefinePlugin({
      "__VUE_OPTIONS_API__": true,
      "__VUE_PROD_DEVTOOLS__": false
    })
  );
}

module.exports = rendererConfig;
