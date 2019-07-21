declare module 'webpack/lib/optimize/RuntimeChunkPlugin' {
  import webpack, { Plugin } from 'webpack'
  export default class RuntimeChunkPlugin extends Plugin {
    public constructor(
      options:
        | boolean
        | 'single'
        | 'multiple'
        | webpack.Options.RuntimeChunkOptions,
    )
  }
}
