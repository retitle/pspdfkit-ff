const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const isAnalyzerTurnedOn = process.argv.includes('--analyze');

module.exports = (args) => {
  const config =  merge(
    common({
      mode: 'development',
      entryKeys: process.env.WEBPACK_ENTRIES,
    }),
    {
      devtool: 'eval-source-map',
      devServer: {
        //host: 'jsapp.localhost',
        disableHostCheck: true,
        contentBase: './dist',
        port: 3000,
        hot: true,
        injectHot: true,
        historyApiFallback: true,
        //publicPath: 'http://jsapp.localhost:3000/assets/',
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Allow-Headers": "Content-Type, Authorization, Content-Length, pspdfkit-platform, pspdfkit-version",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        },
      },
      output: {
        crossOriginLoading: 'anonymous'
      },
      plugins: [
        ...(isAnalyzerTurnedOn ? [
          new BundleAnalyzerPlugin()
        ] : [])
      ]
    }
  );

  return config;
};
