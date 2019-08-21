const path = require('path')
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const PrerenderWebpackPlugin = require('@chiffon/prerender-webpack-plugin')
const BabelWebpackPlugin = require('@chiffon/babel-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')

const NODE_ENV = process.env.NODE_ENV
const IS_DEV = NODE_ENV === 'development'
const IS_PROD = NODE_ENV === 'production'

const config = {
  mode: NODE_ENV,
  entry: {
    main: './src/root.js',
  },
  output: {
    filename: IS_DEV ? '[name].mjs' : '[name].[contenthash].mjs',
    chunkFilename: IS_DEV ? '[name].mjs' : '[name].[contenthash].mjs',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
  },
  devtool: IS_DEV ? 'eval-source-map' : 'source-map',
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          IS_DEV && 'style-loader',
          IS_PROD && MiniCssExtractPlugin.loader,
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              ident: 'postcss',
              plugins: [require('autoprefixer')],
            },
          },
          ,
        ].filter(Boolean),
      },
      {
        test: /\.(js|mjs|ts)$/,
        use: BabelWebpackPlugin.loader,
      },
      {
        test: /\.(png|gif|jpg|jpeg)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              name: IS_DEV ? '[name].[ext]' : '[name].[contenthash].[ext]',
              limit: 8192,
            },
          },
        ],
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              name: IS_DEV ? '[name].[ext]' : '[name].[contenthash].[ext]',
              limit: 8192,
            },
          },
        ],
      },
    ],
  },
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
  },
  optimization: IS_DEV
    ? {}
    : {
        moduleIds: 'hashed',
        minimizer: [
          new TerserPlugin({
            parallel: true,
          }),
          new OptimizeCssAssetsPlugin({}),
        ],
        runtimeChunk: {
          name: 'runtime',
        },
        splitChunks: {
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
          },
        },
      },
  plugins: [
    new BabelWebpackPlugin({
      targets: [
        {
          target: 'client-modern',
          excludedPlugins: [PrerenderWebpackPlugin, HtmlWebpackPlugin],
        },
        IS_PROD && {
          target: 'client-legacy',
          filename: IS_DEV ? '[name].js' : '[name].[contenthash].js',
          chunkFilename: IS_DEV ? '[name].js' : '[name].[contenthash].js',
          excludedPlugins: [PrerenderWebpackPlugin, HtmlWebpackPlugin],
        },
      ].filter(Boolean),
    }),
    // new HtmlWebpackPlugin(),
    new PrerenderWebpackPlugin({
      filename: 'index.html',
      template: path.resolve(__dirname, 'src', 'index.js'),
    }),
    IS_PROD &&
      new MiniCssExtractPlugin({
        filename: IS_DEV ? '[name].css' : '[name].[contenthash].css',
      }),
  ].filter(Boolean),
}

module.exports = config
