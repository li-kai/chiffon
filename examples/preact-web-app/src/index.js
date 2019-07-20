// import render from 'preact-render-to-string'
import { h } from 'preact'
import App from './App.js'

// TODO: fix prerendering when preactX support lands
function render(comp) {
  return JSON.stringify(comp)
}

function generateCSSReferences(files = [], publicPath = '') {
  return files
    .map(file => `<link href="${publicPath}${file}" rel="stylesheet">`)
    .join('')
}

function generateJSReferences(files = [], publicPath = '') {
  return files
    .map(file => `<script src="${publicPath}${file}" nomodule defer></script>`)
    .join('')
}

function generateMJSReferences(files = [], publicPath = '') {
  return files
    .map(file => `<script src="${publicPath}${file}" type=module></script>`)
    .join('')
}

function defaultTemplate({
  css,
  js,
  mjs,
  title = 'Example Preact Web App',
  htmlAttributes = { lang: 'en' },
  publicPath,
}) {
  const normalizedPublicPath = publicPath || ''
  return `<!DOCTYPE html>
  <html ${Object.entries(htmlAttributes || {})
    .map(attribute => `${attribute[0]}="${attribute[1]}"`)
    .join(' ')}>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${title || ''}</title>
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="manifest" href="/site.webmanifest" />
      ${generateCSSReferences(css, normalizedPublicPath)}
      ${generateMJSReferences(mjs, normalizedPublicPath)}
      ${generateJSReferences(js, normalizedPublicPath)}
    </head>
    <body>
      <div id="root">
      ${render(<App />)}
      </div>
    </body>
  </html>`
}

module.exports = defaultTemplate
