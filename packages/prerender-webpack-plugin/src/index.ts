import path from 'path'
import webpack, { SingleEntryPlugin } from 'webpack'
import { RawSource } from 'webpack-sources'
import { safeEval } from './utils'

const PLUGIN_NAME = 'prerender-webpack-plugin'

interface Options {
  filename: string
  template: string
}

/**
 * Adopted from
 * https://github.com/styleguidist/mini-html-webpack-plugin
 * https://github.com/rasmuskl/simple-html-webpack-plugin
 * https://github.com/zaaack/htmls-webpack-plugin
 */
class PrerenderWebpackPlugin implements webpack.Plugin {
  // extend causes cyclic dependencies
  private options: Options

  public constructor(options: Options) {
    this.options = options
  }

  /**
   * Entrypoint that webpack calls at the start
   *
   * @param compiler webpack.Compiler
   */
  public apply(compiler: webpack.Compiler): void {
    compiler.hooks.make.tap(PLUGIN_NAME, (compilation): void => {
      const outputOptions = {
        ...compiler.options.output,
        filename: this.options.filename,
      }

      const childCompiler = compilation.createChildCompiler(
        PLUGIN_NAME,
        outputOptions,
        [],
      )

      // childCompiler.context = compiler.context
      // childCompiler.inputFileSystem = compiler.inputFileSystem
      // childCompiler.outputFileSystem = compiler.outputFileSystem

      // Add SingleEntryPlugin to make all this work
      const entryName = path.parse(this.options.template).name
      new SingleEntryPlugin(
        compiler.context,
        this.options.template,
        entryName,
      ).apply(childCompiler)

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

      compilation.hooks.additionalAssets.tapAsync(
        PLUGIN_NAME,
        (callback): void => {
          const files = PrerenderWebpackPlugin.getFiles(compilation.entrypoints)

          // Run child compilation
          childCompiler.runAsChild((err, entries): void => {
            if (err) {
              compilation.errors.push(err)
              return
            }

            for (const entry of entries) {
              let filename: string
              if (Array.isArray(entry.files)) {
                if (entry.files.length > 1) {
                  compilation.errors.push(
                    new Error('More than one file per entry found'),
                  )
                  callback()
                  return
                }
                filename = entry.files[0]
              } else {
                filename = entry.files
              }

              const source = compilation.assets[filename].source()
              delete compilation.assets[filename]

              try {
                const fn = safeEval(source)
                if (typeof fn !== 'function') {
                  throw new Error('No function was exported')
                }
                const output = fn(files)
                compilation.assets[filename] = new RawSource(output)
              } catch (error) {
                compilation.errors.push(error)
                callback()
                return
              }
            }

            callback()
          })
        },
      )
    })
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

export interface TemplateInput {
  css?: string[] | undefined
  js?: string[] | undefined
  [key: string]: string[] | undefined
}

export default PrerenderWebpackPlugin
