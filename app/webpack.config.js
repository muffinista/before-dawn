const path = require('path');
const webpack = require('webpack');

const port = process.env.PORT || '8080';

const nodeExternals = require('webpack-node-externals');

const externals = nodeExternals({
  whitelist:['jquery', 'bootstrap', 'popper.js']
});

const config = {
  context: __dirname,
  entry: {
//    'babel-polyfill',
    prefs: path.resolve(__dirname, 'ui', 'js', 'prefs.jsx'),
//    `webpack-hot-middleware/client?path=http://localhost:${port}/__webpack_hmr`,
  },
  target: 'electron-renderer',
  externals: externals,
  output: {
    filename: 'prefs.bundle.js',
    path: path.resolve(__dirname, 'bundle'),
    publicPath: `http://localhost:${port}/bundle/`,
    libraryTarget: 'commonjs2'
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          presets: ['env', 'es2015', 'react'],
          plugins: [require('babel-plugin-transform-object-rest-spread')]
        }
      },
      {
        test: require.resolve('jquery'),
        use: [
          { loader: 'expose-loader', options: 'jQuery' },
          { loader: 'expose-loader', options: '$' }
        ]
      },     
      /*      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: [
          path.join(__dirname, 'src'),
          path.join(__dirname, 'renderer.js')
        ],
        exclude: /node_modules/,
        query: {
          presets: ['es2015', 'react', 'react-hmre']
        }
      },
      {
        test: /\.scss$/, loader: 'style-loader!css-loader!sass-loader'
      },
      {
        test: /\.json$/,
        loader: 'json-loader'
      }*/
    ]
  },
  stats: "verbose",
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.ProvidePlugin({
      $: "jquery",
      jQuery: "jquery",
      "window.jQuery": "jquery",
      Popper: ['popper.js', 'default'],
    })
  ]
};

module.exports = config;
