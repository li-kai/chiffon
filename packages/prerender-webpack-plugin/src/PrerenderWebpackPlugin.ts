import path from 'path'
import webpack, { SingleEntryPlugin } from 'webpack'
import { RawSource } from 'webpack-sources'
import { minify, Options as HtmlMinifierOptions } from 'html-minifier'
import { safeEval, getFunctionFromModule } from './utils'

const PLUGIN_NAME = 'prerender-webpack-plugin'

interface Options {
  filename: string
  template: string
  minify?: boolean | HtmlMinifierOptions
}

interface TemplateInput {
  css?: string[] | undefined
  js?: string[] | undefined
  [key: string]: string[] | undefined
}

/**
 * Adopted from
 * https://github.com/styleguidist/mini-html-webpack-plugin
 * https://github.com/rasmuskl/simple-html-webpack-plugin
 * https://github.com/zaaack/htmls-webpack-plugin
 */
class PrerenderWebpackPlugin implements webpack.Plugin {
  // extend causes cyclic dependencies
  private readonly options: Options

  public constructor(options: Options) {
    this.options = options
  }

  /**
   * Entrypoint that webpack calls at the start.
   *
   * @param compiler webpack.Compiler
   */
  public apply(compiler: webpack.Compiler): void {
    compiler.hooks.make.tap(PLUGIN_NAME, (compilation): void => {
      this.compilerMakeHook(compiler, compilation)
    })
    compiler.hooks.afterCompile.tap(PLUGIN_NAME, (compilation): void => {
      this.compilerAfterCompileHook(compiler, compilation)
    })
  }

  /**
   * Entrypoint that webpack calls during the `make` phase.
   * see: https://webpack.js.org/api/compiler-hooks/#make
   *
   * @param compiler webpack.Compiler
   * @param compilation webpack.compilation.Compilation
   */
  private compilerMakeHook(
    compiler: webpack.Compiler,
    compilation: webpack.compilation.Compilation,
  ): void {
    const childCompilerPromise = PrerenderWebpackPlugin.runChildCompiler(
      compiler,
      compilation,
      this.options.template,
      this.options.filename,
    )

    /**
     * Adds the generated html file as an additional asset.
     * see: https://webpack.js.org/api/compilation-hooks/#additionalassets
     */
    compilation.hooks.additionalAssets.tapPromise(PLUGIN_NAME, () => {
      const files = PrerenderWebpackPlugin.getFiles(compilation.entrypoints)
      const htmlMinify = PrerenderWebpackPlugin.getHtmlMinifier(
        compiler,
        this.options.minify,
      )

      return childCompilerPromise
        .then((childCompilerOutput) => {
          const { entries, childCompilation } = childCompilerOutput
          for (const entry of entries) {
            let filename: string
            if (Array.isArray(entry.files)) {
              if (entry.files.length > 1) {
                throw new Error(
                  'Unexpected behavior: more than one file per entry found',
                )
              }
              filename = entry.files[0]
            } else {
              filename = entry.files
            }

            const source = compilation.assets[filename].source()
            delete compilation.assets[filename]
            delete childCompilation.assets[filename]
            for (const fileDependency of childCompilation.fileDependencies) {
              compilation.fileDependencies.add(fileDependency)
            }

            const code = safeEval(filename, source)
            const fn = getFunctionFromModule(code)
            const html = fn(files)
            if (typeof html !== 'string') {
              throw new Error('Prerender did not result in a string')
            }
            const output = htmlMinify(html)
            compilation.assets[filename] = new RawSource(output)
          }
        })
        .catch((error) => {
          compilation.errors.push(error)
        })
    })
  }

  /**
   * Entrypoint that webpack calls during the `afterCompile` phase.
   * see: https://webpack.js.org/api/compiler-hooks/#aftercompile
   *
   * @param compiler webpack.Compiler
   * @param compilation webpack.compilation.Compilation
   */
  private compilerAfterCompileHook(
    compiler: webpack.Compiler,
    compilation: webpack.compilation.Compilation,
  ): void {
    compilation.fileDependencies.add(this.options.template)
  }

  /**
   * Runs a child compiler that returns output of the entry,
   * which in this case, is the template file.
   *
   * @param compiler webpack.Compiler
   * @param compilation webpack.compilation.Compilation
   * @param options Options
   * @returns Promise<entries, childCompilation>
   */
  private static runChildCompiler(
    compiler: webpack.Compiler,
    compilation: webpack.compilation.Compilation,
    template: Options['template'],
    filename: Options['filename'],
  ): Promise<{
    entries: webpack.Entry[]
    childCompilation: webpack.compilation.Compilation
  }> {
    const outputOptions = {
      ...compiler.options.output,
      filename,
    }

    const childCompiler = compilation.createChildCompiler(
      PLUGIN_NAME,
      outputOptions,
      [],
    )

    // Needed for HMR. Even if your plugin don't support HMR,
    // this code seems to be always needed just in case to prevent possible errors
    // childCompiler.hooks.compilation.tap(
    //   PLUGIN_NAME,
    //   (compilation: webpack.compilation.Compilation) => {
    //     if (compilation.cache) {
    //       if (!compilation.cache[name]) {
    //         compilation.cache[name] = {}
    //       }

    //       compilation.cache = compilation.cache[name]
    //     }
    //   },
    // )

    const entryName = path.parse(template).name
    new SingleEntryPlugin(compiler.context, template, entryName).apply(
      childCompiler,
    )

    // Return child compilation execution as a promise
    return new Promise((resolve, reject) => {
      childCompiler.runAsChild((err, entries, childCompilation) => {
        if (err) {
          reject(err)
          return
        }
        resolve({
          entries,
          childCompilation,
        })
      })
    })
  }

  private static getHtmlMinifier(
    compiler: webpack.Compiler,
    minifyOptions: Options['minify'],
  ): (htmlString: string) => string {
    let htmlMinifierOptions: HtmlMinifierOptions | undefined

    let minifyConfig = minifyOptions
    if (minifyOptions == null) {
      minifyConfig = compiler.options.mode === 'production'
    }
    if (minifyConfig === true) {
      // default html minifier options following
      // https://github.com/jantimon/html-webpack-plugin#minification
      htmlMinifierOptions = {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true,
      }
    } else if (minifyConfig === false) {
      htmlMinifierOptions = undefined
    } else {
      htmlMinifierOptions = minifyConfig
    }

    return (text) => minify(text, htmlMinifierOptions)
  }

  private static getFiles(
    entrypoints: webpack.compilation.Compilation['entrypoints'],
  ): TemplateInput {
    const ret: { [key: string]: string[] } = {}

    entrypoints.forEach((entry): void => {
      entry.getFiles().forEach((file: string): void => {
        const extension = path.extname(file).replace(/\./, '')
        if (!extension) return

        if (ret[extension] == null) {
          ret[extension] = []
        }

        ret[extension].push(file)
      })
    })

    return ret
  }
}

export default PrerenderWebpackPlugin
