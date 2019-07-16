import * as babel from '@babel/core'
import loaderUtils from 'loader-utils'
import webpack from 'webpack'
import { RawSourceMap } from 'source-map'

const LOADER_NAME = 'babel-webpack-plugin/loader'

/**
 * Adopted from
 * https://github.com/babel/babel-loader
 *
 * @param source string | Buffer
 * @param sourceMap RawSourceMap | undefined
 */
const babelLoader: webpack.loader.Loader = function(
  source: string | Buffer,
  sourceMap?: RawSourceMap,
) {
  const loaderOptions = { ...loaderUtils.getOptions(this) }

  // Standardize on 'sourceMaps' as the key passed through to Webpack, so that
  // users may safely use either one alongside our default use of
  // 'this.sourceMap' below without getting error about conflicting aliases.
  if (loaderOptions.sourceMap && !loaderOptions.sourceMaps) {
    loaderOptions.sourceMaps = loaderOptions.sourceMap
    delete loaderOptions.sourceMap
  }

  const { target, ...loaderBabelOptions } = loaderOptions
  const filename = this.resourcePath
  const babelOptions: babel.TransformOptions = {
    ...loaderBabelOptions,
    filename,
    inputSourceMap: sourceMap || undefined,
    // Set the default sourcemap behavior based on Webpack's mapping flag,
    // but allow users to override if they want.
    sourceMaps:
      loaderOptions.sourceMaps === undefined
        ? this.sourceMap
        : loaderOptions.sourceMaps,
    // Ensure that Webpack will get a full absolute path in the sourcemap
    // so that it can properly map the module back to its internal cached
    // modules.
    sourceFileName: filename,
    caller: {
      name: LOADER_NAME,
      supportsStaticESM: true,
      // @ts-ignore supportsDynamicImport may be used by babel plugins
      supportsDynamicImport: true,
    },
  }

  const callback = this.async()
  if (!callback) throw new Error('No callback found')

  const previousTarget = process.env.TARGET
  process.env.TARGET = target || this.target
  const config = babel.loadPartialConfig(babelOptions)
  process.env.TARGET = previousTarget
  if (!config) {
    // If the file was ignored, pass through the original source.
    callback(null, source, sourceMap)
    return
  }

  const options = config.options
  if (options.sourceMaps === 'inline') {
    // Babel has this weird behavior where if you set "inline", we
    // inline the sourcemap, and set 'result.map = null'. This results
    // in bad behavior from Babel since the maps get put into the code,
    // which Webpack does not expect, and because the map we return to
    // Webpack is null, which is also bad. To avoid that, we override the
    // behavior here so "inline" just behaves like 'true'.
    options.sourceMaps = true
  }

  const code = typeof source === 'string' ? source : source.toString()
  babel.transform(code, options, function(err, result) {
    if (err) {
      callback(err)
    } else if (!result) {
      callback(new Error('No result generated'))
    } else {
      // @ts-ignore callback can accept null as falsy values
      callback(null, result.code, result.map)
    }
  })
}

export = babelLoader
