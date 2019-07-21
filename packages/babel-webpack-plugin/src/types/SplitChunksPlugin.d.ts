declare module 'webpack/lib/optimize/SplitChunksPlugin' {
  import webpack, { Plugin } from 'webpack'
  export default class SplitChunksPlugin extends Plugin {
    public constructor(options: webpack.Options.SplitChunksOptions)
  }
}
