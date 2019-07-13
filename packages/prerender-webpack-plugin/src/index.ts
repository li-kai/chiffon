import path from 'path'
import webpack, { SingleEntryPlugin } from 'webpack'
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

  constructor(options: Options) {
    this.options = options
  }

  /**
   * Entrypoint that webpack calls at the start
   *
   * @param compiler webpack.Compiler
   */
  apply(compiler: webpack.Compiler) {
    compiler.hooks.make.tap(PLUGIN_NAME, compilation => {
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

      compilation.hooks.additionalAssets.tapAsync(PLUGIN_NAME, callback => {
        const files = getFiles(compilation.entrypoints)

        // Run child compilation
        childCompiler.runAsChild((err, entries) => {
          if (err) {
            compilation.errors.push(err)
            return
          }

          entries.forEach(entry => {
            const filenames = Array.isArray(entry.files)
              ? entry.files
              : [entry.files]
            if (filenames.length > 1) {
              throw new Error(
                'Unexpected condition: more than one filename found.',
              )
            }

            const filename = filenames[0]
            const source = compilation.assets[filename].source()
            delete compilation.assets[filename]

            const fn = safeEval(source)
            const output = fn(files)

            compilation.assets[filename] = {
              size: () => output.length,
              source: () => output,
            }
          })

          callback()
        })
      })
    })
  }
}

function getFiles(entrypoints: webpack.compilation.Compilation['entrypoints']) {
  const ret: { [key: string]: string[] } = {}

  entrypoints.forEach(entry => {
    entry.getFiles().forEach((file: string) => {
      const extension = path.extname(file).replace(/\./, '')
      if (!extension) return

      if (!ret[extension]) {
        ret[extension] = []
      }

      ret[extension].push(file)
    })
  })

  return ret
}

export interface TemplateInput {
  css?: string[] | null | undefined
  js?: string[] | null | undefined
  [key: string]: any
}

export default PrerenderWebpackPlugin
