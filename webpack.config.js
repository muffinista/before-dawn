'use strict';

process.env.BABEL_ENV = 'renderer';

const path = require("path");
const webpack = require("webpack");
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
//const nodeExternals = require("webpack-node-externals");

const pkg = require('./package.json')
/*
const externals = nodeExternals({
//  whitelist:["jquery", "bootstrap", "popper.js"]
  whitelist:["bootstrap", "popper.js"]  
});
*/
const appDir = path.resolve(__dirname, "app");
const outputDir = path.resolve(__dirname, "output");

let config = {
  context: __dirname,
  entry: {
    prefs: path.resolve(appDir, "js", "prefs.js"),
    //    editor: path.resolve(appDir, "js", "watcher.jsx"),
    //    new: path.resolve(appDir, "js", "new.js"),    
  },
  target: "electron-renderer",
//  externals: externals,
//  externals: Object.keys(pkg.dependencies || {}),
  output: {
    filename: "[name].js",
    libraryTarget: 'commonjs2',
    path: outputDir
  },
  //  devtool: "source-map",  
  devtool: '#eval-source-map',
  devServer: { overlay: true },
  externals: Object.keys(pkg.dependencies || {}),
  stats: "verbose",
  resolve: {
    alias: {
      'components': path.join(__dirname, 'app/js/components'),
      'renderer': path.join(__dirname, 'app/js/renderer'),
      '@': path.join(__dirname, '../src/renderer'),
      'vue$': 'vue/dist/vue.esm.js'
    },
    extensions: ['.js', '.vue', '.json', '.scss', '.node'],
    modules: [
      path.join(__dirname, 'node_modules')
    ]
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: 'css-loader'
        })
      },
      {
        test: /\.html$/,
        use: 'vue-html-loader'
      },
      {
        test: /\.js$/,
        use: 'babel-loader',
        include: [ path.resolve(__dirname, 'app/js') ],
        exclude: /node_modules/
      },
      {
        test: /\.json$/,
        use: 'json-loader'
      },
      {
        test: /\.node$/,
        use: 'node-loader'
      },
      {
        test: /\.vue$/,
        use: {
          loader: 'vue-loader',
          options: {
            loaders: {
              sass: 'vue-style-loader!css-loader!sass-loader?indentedSyntax=1',
              scss: 'vue-style-loader!css-loader!sass-loader'
            }
          }
        }
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        use: {
          loader: 'url-loader',
          query: {
            limit: 10000,
            name: 'imgs/[name].[ext]'
          }
        }
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        use: {
          loader: 'url-loader',
          query: {
            limit: 10000,
            name: 'fonts/[name].[ext]'
          }
        }
      },
/*      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: "babel-loader",
        options: {
          presets: ["env", "react"],
          plugins: [require("babel-plugin-transform-object-rest-spread")]
        }
      },*/
/*      {
        test: require.resolve("jquery"),
        use: [
          { loader: "expose-loader", options: "jQuery" },
          { loader: "expose-loader", options: "$" }
        ]
      },*/
    ]
  },
  plugins: [
    new ExtractTextPlugin('styles.css'),
    new HtmlWebpackPlugin({
      filename: 'prefs.html',
      template: './app/index.ejs',
      appModules: process.env.NODE_ENV !== 'production',
      nodeModules: process.env.NODE_ENV === 'production'
    ? path.resolve(__dirname, 'app/node_modules')
    : false,
    }),
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.ProvidePlugin({
//      $: "jquery",
//      jQuery: "jquery",
//      "window.jQuery": "jquery",
      "Popper": ["popper.js", "default"],
    })
  ]
};


if (false && process.env.NODE_ENV !== 'production') {
  /**
   * Apply ESLint
   */
  config.module.rules.push(
    {
      test: /\.(js|vue)$/,
      enforce: 'pre',
      exclude: /node_modules/,
      use: {
        loader: 'eslint-loader',
        options: {
          formatter: require('eslint-friendly-formatter')
        }
      }
    }
  )
}

/**
 * Adjust config for production settings
 */
if (process.env.NODE_ENV === 'production') {
  config.devtool = ''

  config.plugins.push(
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': '"production"'
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true
    }),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      }
    })
  )
}

module.exports = config;
