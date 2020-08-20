const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
//const theme = require('./theme');

function filterEntries(allEntries, entryKeys = []) {
  const filteredEntries = entryKeys.length
        ? entryKeys.split(',').reduce((accum, entry) => {
            accum[entry] = allEntries[entry];
            return accum;
          }, {})
        : allEntries;
  if (entryKeys.length) {
    console.log("************ BUILDING ENTRIES ************");
    console.log(Object.keys(filteredEntries).join(", "));
    console.log("******************************************");
  }
  return filteredEntries;
}

module.exports = ({ mode, entryKeys } = {}) => ({
  mode,
  entry: filterEntries({
    // app: './src/entries/app',
    // auth: './src/entries/auth',
    // client: './src/entries/client',
    // help_center: ['@babel/polyfill', './src/entries/help-center'],
    // pdfjs: ['@babel/polyfill', './src/entries/pdfjs'],
    // admin: './src/entries/admin',
    // public: './src/entries/public',
    test: './test'
  }, entryKeys),
  devtool: 'inline-source-map',
  plugins: [
    new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /nb/),
    new CopyPlugin([
      {
        from: 'node_modules/pdfjs-dist/build/pdf.worker.min.js',
        to: 'pdf.worker.min.js',
      },
    ]),
    // https://pspdfkit.com/guides/web/current/standalone/adding-to-your-project/#copy-the-pspdfkit-for-web-assets
    new CopyPlugin([
      {
        from: 'node_modules/pspdfkit/dist/pspdfkit-lib',
        to: 'pspdfkit-lib',
      },
    ]),
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: './test/index.html',
      filename: 'index.html'
    }),
    function() {
      this.plugin('done', (stats) => {
        stats = stats.toJson();
        const myStats = {
          entrypoints: stats.entrypoints,
          options: {
            hmr: !process.env.HMR_OFF && mode === 'development',
          },
        };
        require('fs').writeFileSync(
          path.join(__dirname, '../', 'stats.json'),
          JSON.stringify(myStats)
        );
      });
    },
  ],
  output: {
    path: path.resolve(__dirname, 'dist'),
  },
  resolve: {
    alias: {
      src: path.resolve('./src'),
      components: path.resolve('./src/components'),
      styles: path.resolve('./src/styles'),
      mocks: path.resolve('./mocks'),
    },
  },
  resolveLoader: {
    alias: {
      svgJsx: '@svgr/webpack',
    },
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        include: [
          path.resolve(__dirname, './test'),
          path.resolve(__dirname, './mocks'),
          path.resolve(__dirname, './node_modules/camelcase'),
          path.resolve(__dirname, './node_modules/snakecase-keys'),
          path.resolve(__dirname, './node_modules/map-obj'),
          path.resolve(__dirname, './node_modules/pdfjs-dist'),
          path.resolve(__dirname, './node_modules/webpack-dev-server'),
          path.resolve(__dirname, './node_modules/lru_map'),
          path.resolve(__dirname, './node_modules/multi-download'),
          path.resolve(__dirname, './node_modules/damerau-levenshtein-js'),
          path.resolve(__dirname, './node_modules/react-sortable-hoc'),
        ],
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
          },
        },
      },
      {
        test: /\.less|css$/,
        exclude: [
          path.resolve(__dirname, "./src/components/pdf-annotations/pspdfkit.less")
        ],
        use: [
          ...(mode === 'production' ? [{ loader: 'cache-loader' }] : []),
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',
          },
          {
            loader: 'postcss-loader',
            options: {
              config: {
                path: path.resolve(__dirname, './postcss.config.js'),
              },
              sourceMap: true,
            },
          },
          {
            loader: 'resolve-url-loader',
          },
          {
            loader: 'less-loader',
            options: {
              //modifyVars: theme,
              javascriptEnabled: true,
            },
          },
        ],
      },
      {
        test: /\.less$/,
        include: [
          path.resolve(__dirname, "./src/components/pdf-annotations/pspdfkit.less")
        ],
        use: [
          ...(mode === 'production' ? [{ loader: 'cache-loader' }] : []),
          { loader: "css-loader" },
          {
            loader: `less-loader`,
            options: {
              //modifyVars: theme,
              javascriptEnabled: true
            }
          }
        ]
      },
      {
        test: /\.(jpe?g|png|gif|cur)$/i,
        use: [
          ...(mode === 'production' ? [{ loader: 'cache-loader' }] : []),
          'file-loader?hash=sha512&digest=hex',
          {
            loader: 'image-webpack-loader',
            query: {
              mozjpeg: {
                progressive: true,
              },
              gifsicle: {
                interlaced: false,
              },
              optipng: {
                optimizationLevel: 7,
              },
              pngquant: {
                quality: '75-90',
                speed: 3,
              },
            },
          },
        ],
      },
      {
        test: /\.(svg)$/i,
        use: [
          ...(mode === 'production' ? [{ loader: 'cache-loader' }] : []),
          { loader: 'file-loader?hash=sha512&digest=hex' }
        ]
      },
      {
        test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        use: [
          ...(mode === 'production' ? [{ loader: 'cache-loader' }] : []),
          { loader: 'url-loader?limit=10000&mimetype=application/font-woff' }
        ]
      },
      {
        test: /\.(ttf|eot)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        use: [
          ...(mode === 'production' ? [{ loader: 'cache-loader' }] : []),
          { loader: 'file-loader' }
        ]
      },
      {
        test: /\.font\.js/,
        use: [
          ...(mode === 'production' ? ['cache-loader'] : []),
          'style-loader',
          'css-loader',
          'webfonts-loader'
        ],
      },
    ],
  },
});
