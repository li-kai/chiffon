const path = require('path')
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const PrerenderWebpackPlugin = require('@chiffon/prerender-webpack-plugin')
const BabelWebpackPlugin = require('@chiffon/babel-webpack-plugin')
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
        test: /\.(js|ts)$/,
        exclude: /(node_modules)/,
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
          target: 'js',
          filename: '[name].js',
          chunkFilename: '[id].js',
          excludedPlugins: [PrerenderWebpackPlugin],
        },
        IS_PROD && {
          target: 'mjs',
          filename: '[name].mjs',
          chunkFilename: '[id].mjs',
          excludedPlugins: [PrerenderWebpackPlugin],
        },
      ].filter(Boolean),
    }),
    new PrerenderWebpackPlugin({
      filename: 'index.html',
      template: path.resolve(__dirname, 'src', 'index.js'),
    }),
    IS_PROD &&
      new MiniCssExtractPlugin({
        filename: '[name].css',
      }),
  ].filter(Boolean),
}

module.exports = config
