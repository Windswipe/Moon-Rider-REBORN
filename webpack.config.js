var fs = require('fs');
var ip = require('ip');
var path = require('path');
var webpack = require('webpack');
const COLORS = require('./src/constants/colors.js');

const PLUGINS = [
  new webpack.EnvironmentPlugin({ DEBUG_LOG: false, NODE_ENV: 'development' }),
  new webpack.HotModuleReplacementPlugin(),
  // @firebase/polyfill not loading, stub it with some random module.
  new webpack.NormalModuleReplacementPlugin(/firebase\/polyfill/, '../../../../src/constants/colors.js')
];

module.exports = {
  mode: process.env.NODE_ENV || 'development',
  optimization: {
    minimize: process.env.NODE_ENV === 'production'
  },
  devServer: {
    hot: true,
    allowedHosts: 'all',
    static: {
      directory: path.resolve(__dirname),
      publicPath: '/'
    }
  },
  entry: {
    build: './src/index.js',
    zip: './src/workers/zip.js'
  },
  output: {
    globalObject: 'this',
    path: __dirname,
    filename: 'build/[name].js'
  },
  plugins: PLUGINS,
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: ['babel-loader', 'aframe-super-hot-loader']
      },
      {
        test: /\.json$/,
        exclude: /(node_modules)/,
        type: 'javascript/auto',
        use: ['json-loader']
      },
      {
        test: /\.html$/,
        exclude: /(node_modules)/,
        use: [
          'aframe-super-hot-html-loader',
          {
            loader: 'super-nunjucks-loader',
            options: {
              globals: {
                DEBUG_AFRAME: !!process.env.DEBUG_AFRAME,
                DEBUG_LOG: !!process.env.DEBUG_LOG,
                DEBUG_KEYBOARD: !!process.env.DEBUG_KEYBOARD,
                DEBUG_INSPECTOR: !!process.env.DEBUG_INSPECTOR,
                HOST: ip.address(),
                IS_PRODUCTION: process.env.NODE_ENV === 'production',
                COLORS: COLORS
              },
              path: path.resolve(__dirname, 'src')
            }
          },
          {
            loader: 'html-require-loader',
            options: {
              root: path.resolve(__dirname, 'src')
            }
          }
        ]
      },
      {
        test: /\.glsl$/,
        exclude: /(node_modules)/,
        use: ['webpack-glsl-loader']
      },
      {
        test: /\.css$/,
        exclude: /(node_modules)/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(png|jpg)$/,
        use: ['url-loader']
      }
    ]
  },
  resolve: {
    modules: [path.join(__dirname, 'node_modules')],
    fallback: {
      zlib: require.resolve('browserify-zlib'),
      stream: require.resolve('stream-browserify')
    }
  }
};
