import webpack, { compilation, Plugin, Output } from 'webpack'

declare module 'webpack' {
  export interface ChildCompiler extends Compiler {
    runAsChild(
      callback: (
        err: Error | null,
        entries: Entry[],
        compilation: compilation.Compilation,
      ) => void,
    ): void
  }

  namespace compilation {
    export interface Compilation {
      createChildCompiler(
        pluginName: string,
        outputOptions: Output,
        plugins: Plugin[],
      ): webpack.ChildCompiler
    }
  }
}
