import React from 'react'
import ReactDOM from 'react-dom/server'
import App from './App.js'

function defaultTemplate({
  css,
  js,
  mjs,
  title = 'Example React Web App',
  htmlAttributes = { lang: 'en' },
}) {
  // First we render the outside parts of html as static string (e.g. head, body)
  // Next, we render the web app root as html (e.g. <App />) and
  // inject this into the outside parts via dangerouslySetInnerHTML because
  // we only need React to hydrate the root element.
  return `<!DOCTYPE html>
  ${ReactDOM.renderToStaticMarkup(
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
        {css.map(cssResourceUrl => (
          <link
            href={`${__webpack_public_path__}${cssResourceUrl}`}
            rel="stylesheet"
          />
        ))}
        {js.map(jsResourceUrl => (
          <script
            src={`${__webpack_public_path__}${jsResourceUrl}`}
            nomodule
            defer
          />
        ))}
        {mjs.map(mjsResourceUrl => (
          <script
            src={`${__webpack_public_path__}${mjsResourceUrl}`}
            type="module"
          />
        ))}
      </head>
      <body>
        <div
          id="root"
          dangerouslySetInnerHTML={{ __html: ReactDOM.renderToString(<App />) }}
        />
      </body>
    </html>,
  )}`
}

module.exports = defaultTemplate
