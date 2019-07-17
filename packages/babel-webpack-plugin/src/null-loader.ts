import webpack from 'webpack'

/**
 * Null Loader that allows file to skip compilation
 */
const nullLoader: webpack.loader.Loader = function() {}

const EMPTY_BUFFER = Buffer.alloc(0)

nullLoader.pitch = function() {
  return EMPTY_BUFFER
}

nullLoader.raw = true

export = nullLoader
