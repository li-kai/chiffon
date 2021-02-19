import render from 'preact-render-to-string'
import { h } from 'preact'
import App from './App.js'

function defaultTemplate({
  css,
  js,
  mjs,
  title = 'Example Preact Web App',
  htmlAttributes = { lang: 'en' },
}) {
  return `<!DOCTYPE html>
  ${render(
    <html {...htmlAttributes}>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href={`${__webpack_public_path__}apple-touch-icon.png`}
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href={`${__webpack_public_path__}favicon-32x32.png`}
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href={`${__webpack_public_path__}favicon-16x16.png`}
        />
        <link
          rel="manifest"
          href={`${__webpack_public_path__}site.webmanifest`}
        />
        {css &&
          css.map((cssResourceUrl) => (
            <link
              href={`${__webpack_public_path__}${cssResourceUrl}`}
              rel="stylesheet"
            />
          ))}
        {js &&
          js.map((jsResourceUrl) => (
            <script
              src={`${__webpack_public_path__}${jsResourceUrl}`}
              nomodule
              defer
            />
          ))}
        {mjs &&
          mjs.map((mjsResourceUrl) => (
            <script
              src={`${__webpack_public_path__}${mjsResourceUrl}`}
              type="module"
            />
          ))}
      </head>
      <body>
        <div id="root">
          <App />
        </div>
      </body>
    </html>,
  )}`
}

export default defaultTemplate
