const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const TerserWebpackPlugin = require('terser-webpack-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');

const isAnalyzerTurnedOn = process.argv.includes('--analyze');

module.exports = (args) => {
  return merge(
    common({
      mode: 'production',
      entryKeys: process.env.WEBPACK_ENTRIES,
    }),
    {
      devtool: "source-map",
      optimization: {
        runtimeChunk: 'single',
        moduleIds: 'hashed',
        chunkIds: 'total-size',
        splitChunks: {
           chunks: 'all',
           maxInitialRequests: 40,
           maxAsyncRequests: 20,
           cacheGroups: {
             vendors: {
               chunks: (chunk) => {
                 // Exclude pdfjs from commons since it needs to be its own entrypoint
                 return chunk.name !== 'pdfjs-dist';
               },
               test: /[\\/]node_modules[\\/]/,
               chunks: 'all',
               reuseExistingChunk: true
             },
           },
        },
        minimizer: [
          new TerserWebpackPlugin({
            parallel: 6,
            sourceMap: true,
            terserOptions: {
              compress: {
                comparisons: false,
              },
              mangle: {
                safari10: true,
              },
              output: {
                comments: false,
                ascii_only: true,
              },
              warnings: false,
            },
          }),
          new OptimizeCssAssetsPlugin(),
        ],
      },
      output: {
        filename: '[name].[chunkhash].js',
      },
      plugins: [
        ...(isAnalyzerTurnedOn ? [new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: '/tmp/bundle-report.html'
        })] : []),
      ]
    }
  );
};

