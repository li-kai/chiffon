declare module 'webpack/lib/optimize/SplitChunksPlugin' {
  import webpack, { Plugin } from 'webpack'
  export default class SplitChunksPlugin extends Plugin {
    constructor(options: webpack.Options.SplitChunksOptions)
  }
}
