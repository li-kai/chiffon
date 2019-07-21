declare module 'webpack/lib/RawModule' {
  import webpack from 'webpack'
  export default class RawModule extends webpack.compilation.Module {
    public constructor(
      source: string,
      identifier: string,
      readableIdentifier: string,
    )
  }
}
