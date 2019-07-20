import path from 'path'
import webpack, { SingleEntryPlugin } from 'webpack'
import { RawSource } from 'webpack-sources'
import { minify, Options as HtmlMinifierOptions } from 'html-minifier'
import { safeEval } from './utils'

const PLUGIN_NAME = 'prerender-webpack-plugin'

interface Options {
  filename: string
  template: string
  minify?: boolean | HtmlMinifierOptions
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
  ) {
    let htmlMinifierOptions: HtmlMinifierOptions | undefined
    if (this.options.minify == null) {
      this.options.minify = compiler.options.mode === 'production'
    }
    if (this.options.minify === true) {
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
    } else if (this.options.minify === false) {
      htmlMinifierOptions = undefined
    } else {
      htmlMinifierOptions = this.options.minify
    }

    const childCompilerPromise = PrerenderWebpackPlugin.runChildCompiler(
      compiler,
      compilation,
      this.options,
    )

    /**
     * Adds the generated html file as an additional asset.
     * see: https://webpack.js.org/api/compilation-hooks/#additionalassets
     */
    compilation.hooks.additionalAssets.tapPromise(PLUGIN_NAME, () => {
      const files = PrerenderWebpackPlugin.getFiles(compilation.entrypoints)

      return childCompilerPromise
        .then(childCompilerOutput => {
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

            const fn = safeEval(filename, source)
            if (typeof fn !== 'function') {
              throw new Error('No function was exported')
            }
            const output = minify(fn(files), htmlMinifierOptions)
            compilation.assets[filename] = new RawSource(output)
          }
        })
        .catch(error => {
          compilation.errors.push(error)
        })
    })
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
    options: Options,
  ): Promise<{
    entries: webpack.Entry[]
    childCompilation: webpack.compilation.Compilation
  }> {
    const outputOptions = {
      ...compiler.options.output,
      filename: options.filename,
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

    const entryName = path.parse(options.template).name
    new SingleEntryPlugin(compiler.context, options.template, entryName).apply(
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

  private static getFiles(
    entrypoints: webpack.compilation.Compilation['entrypoints'],
  ): PrerenderWebpackPlugin.TemplateInput {
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

namespace PrerenderWebpackPlugin {
  export interface TemplateInput {
    css?: string[] | undefined
    js?: string[] | undefined
    [key: string]: string[] | undefined
  }
}

export default PrerenderWebpackPlugin
