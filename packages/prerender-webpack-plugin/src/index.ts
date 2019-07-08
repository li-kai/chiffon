import path from 'path'
import webpack from 'webpack'

interface Options {
  filename?: string
  template?: string | ((input: TemplateInput) => string),
  context?: { [key: string]: any }
}

/**
 * Adopted from
 * https://github.com/styleguidist/mini-html-webpack-plugin
 * https://github.com/rasmuskl/simple-html-webpack-plugin
 * https://github.com/zaaack/htmls-webpack-plugin
 */
class PrerenderWebpackPlugin implements webpack.Plugin { // extend causes cyclic dependencies
  private options: Options

  constructor(options: Options = {}) {
    this.options = options
    this.plugin = this.plugin.bind(this)
  }

  plugin(compilation: webpack.compilation.Compilation, callback: () => void) {
    // @ts-ignore options does exist on compilation
    const { publicPath } = compilation.options.output
    const { filename = 'index.html', template, context } = this.options

    let templateFn = defaultTemplate;
    if (typeof template === 'string') {
      templateFn = require(template);
    } else if (template) {
      templateFn = template;
    }

    const files = getFiles(normalizeEntrypoints(compilation.entrypoints))

    const source = templateFn(
      Object.assign({}, { publicPath }, context, files),
    )

    compilation.assets[filename] = {
      size: () => source.length,
      source: () => source,
    }

    callback()
  }

  apply(compiler: webpack.Compiler) {
    if (compiler.hooks) {
      // Webpack 4
      compiler.hooks.emit.tapAsync('MiniHtmlWebpackPlugin', this.plugin)
    } else {
      // Webpack 3
      compiler.plugin('emit', this.plugin)
    }
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

function normalizeEntrypoints(
  entrypoints: webpack.compilation.Compilation['entrypoints'],
) {
  // Webpack 4
  if (entrypoints.forEach) {
    return entrypoints
  }

  // Webpack 3
  return new Map(Object.entries(entrypoints))
}

interface TemplateInput {
  css?: string[] | null | undefined
  js?: string[] | null | undefined
  title?: string | null | undefined
  publicPath?: string | null | undefined
  htmlAttributes?: { [key: string]: string } | null
  [key: string]: any
}

function defaultTemplate({
  css,
  js,
  title,
  htmlAttributes = { lang: 'en' },
  publicPath,
}: TemplateInput) {
  const normalizedPublicPath = publicPath || ''
  return `<!DOCTYPE html>
  <html ${Object.entries(htmlAttributes || {})
    .map(attribute => `${attribute[0]}="${attribute[1]}"`)
    .join(' ')}>
    <head>
      <meta charset="UTF-8">
      <title>${title || ''}</title>

      ${generateCSSReferences(css || [], normalizedPublicPath)}
    </head>
    <body>
      ${generateJSReferences(js || [], normalizedPublicPath)}
    </body>
  </html>`
}

function generateCSSReferences(files: string[] = [], publicPath: string = '') {
  return files
    .map(file => `<link href="${publicPath}${file}" rel="stylesheet">`)
    .join('')
}

function generateJSReferences(files: string[] = [], publicPath: string = '') {
  return files
    .map(file => `<script src="${publicPath}${file}"></script>`)
    .join('')
}

export default PrerenderWebpackPlugin
export { defaultTemplate, generateCSSReferences, generateJSReferences }
