"use strict";

const path = require("path");
const glob = require("glob-all");
const packageJSON = require(`${"./package.json"}`);

const productName = packageJSON.productName;
const dependencies = packageJSON.dependencies;
//const optionalDependencies = packageJSON.optionalDependencies || {};

const webpack = require("webpack");

const outputDir = path.join(__dirname, "output");

const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const PurgecssPlugin = require("purgecss-webpack-plugin");
const VueLoaderPlugin = require("vue-loader/lib/plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const SentryWebpackPlugin = require("@sentry/webpack-plugin");

// const devMode = (process.env.NODE_ENV !== "production");
const releaseName = `${packageJSON.productName} ${packageJSON.version}`;

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
    renderer: path.join(__dirname, "src/renderer/main.js")
  },
  externals: externals,
  module: {
    rules: [
      {
        test: /\.(js|vue)$/,
        enforce: "pre",
        exclude: /node_modules/,
        include: [
          // use `include` vs `exclude` to white-list vs black-list
          //path.resolve(__dirname, "src"), // white-list your app source files
          require.resolve("bootstrap-vue"), // white-list bootstrap-vue
        ],
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
    new PurgecssPlugin({
      paths: glob.sync([
        path.join(__dirname, "./src/index.ejs"),
        path.join(__dirname, "./src/**/*.vue"),
        path.join(__dirname, "./src/**/*.js")
      ]),
      whitelistPatterns: [
        /nav/,
        /nav-tabs/,
        /nav-link/,
        /nav-item/,
        /tablist/,
        /tabindex/,
        /tooltip/,
        /button-group/,
        /btn/,
        /noty/
      ]
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.join(__dirname, "src", "renderer", "assets"),
          to: path.join(outputDir, "assets"),
          globOptions: {
            ignore: [".*"]
          }
        },
        {
          from: path.join(__dirname, "src", "main", "system-savers"),
          to: path.join(outputDir, "system-savers"),
          globOptions: {
            ignore: [".*"]
          }
        }
      ]
    }),
    new MiniCssExtractPlugin({
      filename: "[name].css",
      chunkFilename: "[id].css"
    })
  ],
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
  mode: (process.env.NODE_ENV === "production" ? "production" : "development"),
  resolve: {
    alias: {
      // handy alias for the root path of render files
      "@": path.join(__dirname, "src/renderer"),

      // vue template compiler
      "vue$": "vue/dist/vue.esm.js"
    },
    extensions: [".js", ".vue", ".json", ".css", ".node"]
  },
  target: "electron-renderer"
};


/**
 * Adjust rendererConfig for production settings
 */
if (process.env.NODE_ENV === "production") {
  rendererConfig.devtool = "source-map";

  rendererConfig.plugins.push(
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify("production"),
      "process.env.BEFORE_DAWN_RELEASE_NAME": JSON.stringify(releaseName)
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true
    })
  );

  if ( process.env.SENTRY_AUTH_TOKEN ) {
    rendererConfig.plugins.push(
      new SentryWebpackPlugin({
        include: "src",
        ignoreFile: ".sentrycliignore",
        ignore: ["node_modules", "webpack.config.js", "webpack.main.config.js", "webpack.renderer.config.js"]
      })
    );
  }
} else {
  rendererConfig.plugins.push(
    new webpack.HotModuleReplacementPlugin()
  );
}

module.exports = rendererConfig;
