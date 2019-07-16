import webpack from 'webpack'
import JsonpTemplatePlugin from 'webpack/lib/web/JsonpTemplatePlugin'
import SplitChunksPlugin from 'webpack/lib/optimize/SplitChunksPlugin'
import RuntimeChunkPlugin from 'webpack/lib/optimize/RuntimeChunkPlugin'
import EntryConfigPlugin from './EntryConfigPlugin'

const PLUGIN_NAME = 'babel-webpack-plugin'

interface PublicTargetOptions extends webpack.Output {
  target: string
  excludedPlugins?: webpack.Plugin[] | null
  additionalPlugins?: webpack.Plugin[] | null
}
interface PublicOptions {
  targets: PublicTargetOptions[]
}

interface PrivateTargetOptions extends webpack.Output {
  target: string
  excludedPlugins: webpack.Plugin[]
  additionalPlugins: webpack.Plugin[]
}
interface PrivateOptions {
  targets: PrivateTargetOptions[]
}

/**
 * Adopted from
 * https://github.com/styleguidist/mini-html-webpack-plugin
 * https://github.com/rasmuskl/simple-html-webpack-plugin
 * https://github.com/zaaack/htmls-webpack-plugin
 */
class BabelWebpackPlugin implements webpack.Plugin {
  // extend causes cyclic dependencies
  private options: PrivateOptions
  public static loader = require.resolve('./loader.js')

  public constructor(options: PublicOptions) {
    const targets = options.targets.map(option => {
      const newOptions: PrivateTargetOptions = {
        ...option,
        excludedPlugins: option.excludedPlugins || [],
        additionalPlugins: option.additionalPlugins || [],
      }
      newOptions.excludedPlugins.push(BabelWebpackPlugin)
      newOptions.additionalPlugins.push(new webpack.IgnorePlugin(/\.css$/))
      return newOptions
    })
    this.options = { targets }
    this.compilerMakeHook = this.compilerMakeHook.bind(this)
  }

  /**
   * Entrypoint that webpack calls at the start
   *
   * @param compiler webpack.Compiler
   */
  public apply(compiler: webpack.Compiler): void {
    compiler.hooks.make.tap(PLUGIN_NAME, compilation => {
      this.compilerMakeHook(compiler, compilation)
    })
  }

  private compilerMakeHook(
    compiler: webpack.Compiler,
    compilation: webpack.compilation.Compilation,
  ) {
    let targetAssetsPromises: Promise<{
      entries: webpack.Entry[]
      childCompilation: webpack.compilation.Compilation
    }>[]
    targetAssetsPromises = this.options.targets.map(options =>
      BabelWebpackPlugin.buildTargetAssets(compiler, compilation, options),
    )

    compilation.hooks.additionalAssets.tapPromise(PLUGIN_NAME, async () => {
      try {
        const targetAssets = await Promise.all(targetAssetsPromises)
        for (const { childCompilation } of targetAssets) {
          const assetKeys = Object.keys(childCompilation.assets)
          for (let i = 0; i < assetKeys.length; i++) {
            const key = assetKeys[i]
            compilation.assets[key] = childCompilation.assets[key]
          }
          childCompilation.assets = {}
          for (const [key, value] of childCompilation.namedChunkGroups) {
            compilation.namedChunkGroups.set(key, value)
          }
          childCompilation.namedChunkGroups.clear()
        }
      } catch (error) {
        compilation.errors.push(error)
      }
    })
  }

  private static buildTargetAssets(
    compiler: webpack.Compiler,
    compilation: webpack.compilation.Compilation,
    targetOptions: PrivateTargetOptions,
  ): Promise<{
    entries: webpack.Entry[]
    childCompilation: webpack.compilation.Compilation
  }> {
    const {
      target,
      excludedPlugins,
      additionalPlugins,
      ...targetOutputOptions
    } = targetOptions

    const outputOptions = {
      ...compiler.options.output,
      ...targetOutputOptions,
    }
    /**
     * We are deliberatly not passing plugins in createChildCompiler.
     * All webpack does with plugins is to call `apply` method on them
     * with the childCompiler.
     * But by then we haven't given childCompiler a fileSystem or other options
     * which a few plugins might expect while execution the apply method.
     * We do call the `apply` method of all plugins by ourselves later in the code
     */
    const childCompiler = compilation.createChildCompiler(
      PLUGIN_NAME,
      outputOptions,
      [],
    )
    childCompiler.context = compiler.context
    childCompiler.inputFileSystem = compiler.inputFileSystem
    childCompiler.outputFileSystem = compiler.outputFileSystem
    childCompiler.hooks.compilation.tap(PLUGIN_NAME, compilation => {
      compilation.hooks.normalModuleLoader.tap(
        PLUGIN_NAME,
        (context, module) => {
          // @ts-ignore property loaders does exist but is not typed
          const newLoaders = module.loaders as webpack.NewLoader[]
          for (let i = 0; i < newLoaders.length; i++) {
            const newLoader = newLoaders[i]
            if (newLoader.loader !== BabelWebpackPlugin.loader) return
            newLoader.options = { ...newLoader.options, target }
          }
        },
      )
    })
    // await BabelWebpackPlugin.injectTarget(target, childCompiler.options.module)

    const plugins = compiler.options.plugins || []
    plugins
      // Only copy over mini-extract-text-plugin (excluding it breaks extraction entirely)
      .filter(
        plugin =>
          !excludedPlugins.some(
            // @ts-ignore webpack.Plugin is extended and not implemented
            excludedPlugin => plugin instanceof excludedPlugin,
          ),
      )
      // Add the additionalPlugins
      .concat(additionalPlugins)
      // Call the `apply` method of all plugins by ourselves.
      .forEach(plugin => {
        plugin.apply(childCompiler)
      })

    new EntryConfigPlugin(compiler.context, compiler.options.entry).apply(
      childCompiler,
    )

    // Convert entry chunk to entry file
    new JsonpTemplatePlugin().apply(childCompiler)

    if (compiler.options.optimization) {
      if (compiler.options.optimization.splitChunks) {
        new SplitChunksPlugin(
          Object.assign({}, compiler.options.optimization.splitChunks),
        ).apply(childCompiler)
      }
      if (compiler.options.optimization.runtimeChunk) {
        new RuntimeChunkPlugin(
          Object.assign({}, compiler.options.optimization.runtimeChunk),
        ).apply(childCompiler)
      }
    }

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
}

export = BabelWebpackPlugin
