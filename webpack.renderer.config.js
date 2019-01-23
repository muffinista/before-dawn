"use strict";

const path = require("path");
const glob = require("glob-all");
const packageJSON = require(`${"./package.json"}`);

const productName = packageJSON.productName;
const dependencies = packageJSON.dependencies;
//const optionalDependencies = packageJSON.optionalDependencies || {};

const webpack = require("webpack");

const outputDir = path.join(__dirname, "output");

const BabiliWebpackPlugin = require("babili-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const PurgecssPlugin = require("purgecss-webpack-plugin");
const VueLoaderPlugin = require("vue-loader/lib/plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const devMode = (process.env.NODE_ENV !== "production");

var htmlPageOptions = function(id, title) {
  return {
    filename: id + ".html",
    template: path.resolve(__dirname, "src/index.ejs"),
    id: id,
    title: productName + ": " + title,
    minify: {
      collapseWhitespace: true,
      removeAttributeQuotes: true,
      removeComments: true
    },
    nodeModules: devMode ? path.resolve(__dirname, "node_modules") : false
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
      // this will apply to both plain `.css` files
      // AND `<style>` blocks in `.vue` files
      // {
      //   test: /\.css$/,
      //   use: [
      //     "vue-style-loader",
      //     "css-loader"
      //   ]
      // },
      {
        //test: /\.(scss)$/,
        test: /\.(sa|sc|c)ss$/,
        use: [
          devMode ? "style-loader" : MiniCssExtractPlugin.loader,
          //'vue-style-loader',
          "css-loader",
//          'postcss-loader',
          "sass-loader",
        ]
        
        // [
        //   {
        //     loader: MiniCssExtractPlugin.loader,
        //     options: {
        //       // you can specify a publicPath here
        //       // by default it use publicPath in webpackOptions.output
        //       //publicPath: '../'
        //     }
        //   },
        //   "css-loader"
        // ]
        //   {
        //     loader: "style-loader", // inject CSS to page
        //   },
        //   {
        //     loader: "css-loader", // translates CSS into CommonJS modules
        //   },
        //   {
        //     loader: "sass-loader" // compiles SASS to CSS
        //   }
        // ]
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
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        use: {
          loader: "url-loader",
          query: {
            limit: 10000,
            name: "imgs/[name]--[folder].[ext]"
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
    new HtmlWebpackPlugin(htmlPageOptions("editor", "Editor")),    
    new HtmlWebpackPlugin(htmlPageOptions("new", "Create Screensaver!")),
    new HtmlWebpackPlugin(htmlPageOptions("about", "About!")),
    new PurgecssPlugin({
      paths: glob.sync([
        path.join(__dirname, "./src/index.ejs"),
        path.join(__dirname, "./src/**/*.vue"),
        path.join(__dirname, "./src/**/*.js")
      ]),
      whitelistPatterns: [/nav/, /nav-tabs/, /nav-link/, /nav-item/, /tablist/, /tabindex/, /tooltip/, /button-group/, /btn/, /noty/]
    }),
    new CopyWebpackPlugin(
      [
        {
          from: path.join(__dirname, "src", "renderer", "assets"),
          to: path.join(outputDir, "assets"),
          ignore: [".*"]
        }
      ]
    ),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new MiniCssExtractPlugin({
      filename: "[name].css",
      chunkFilename: "[id].css"
    })
  ],
  // optimization: {
  //   splitChunks: {
  //     cacheGroups: {
  //       styles: {
  //         name: 'styles',
  //         test: /\.css$/,
  //         chunks: 'all',
  //         enforce: true
  //       }
  //     }
  //   }
  // },
  output: {
    filename: "[name].js",
    libraryTarget: "commonjs2",
    path: outputDir,
    sourceMapFilename: "[name].js.map"
  },
  mode: (process.env.NODE_ENV === "production" ? "production" : "development"),
  resolve: {
    alias: {
      "@": path.join(__dirname, "src/renderer"),
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
    new BabiliWebpackPlugin(),
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": "\"production\""
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true
    })
  );
}

module.exports = rendererConfig;
