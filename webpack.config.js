const webpack = require('webpack');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    main: './app/main.js'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist')
  },
  plugins: [
    new CopyWebpackPlugin([
      {
        from: 'node_modules/jszip/dist/jszip.min.js',
        to: 'jszip.js'
      },
      {
        from: 'node_modules/node-forge/dist/forge.min.js',
        to: 'forge.js'
      },

      {
        from: 'epubs/',
        to: 'epubs'
      }
    ])
  ]
};
