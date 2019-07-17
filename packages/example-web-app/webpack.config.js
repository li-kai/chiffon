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
    app: './src/root.js',
  },
  output: {
    filename: '[name].js',
    chunkFilename: '[id].js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
  },
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
            options: { name: '[name].[ext]', limit: 8192 },
          },
        ],
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2)$/,
        use: [
          {
            loader: 'url-loader',
            options: { name: '[name].[ext]', limit: 8192 },
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
        minimizer: [
          new TerserPlugin({
            parallel: true,
          }),
          new OptimizeCssAssetsPlugin({}),
        ],
      },
  plugins: [
    new BabelWebpackPlugin({
      targets: [
        {
          target: 'client-legacy',
          excludedPlugins: [PrerenderWebpackPlugin, HtmlWebpackPlugin],
        },
        IS_PROD && {
          target: 'client-modern',
          filename: '[name].mjs',
          chunkFilename: '[id].mjs',
          excludedPlugins: [PrerenderWebpackPlugin, HtmlWebpackPlugin],
        },
      ].filter(Boolean),
    }),
    new HtmlWebpackPlugin(),
    // new PrerenderWebpackPlugin({
    //   filename: 'index.html',
    //   template: path.resolve(__dirname, 'src', 'index.js'),
    // }),
    IS_PROD &&
      new MiniCssExtractPlugin({
        filename: '[name].css',
      }),
  ].filter(Boolean),
}

module.exports = config
