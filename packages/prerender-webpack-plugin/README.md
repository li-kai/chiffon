# @chiffon/prerender-webpack-plugin

Prerender your index.html via JavaScript, allowing for easy customization.

## Installation

npm:

```sh
npm install --save-dev @chiffon/prerender-webpack-plugin
```

yarn:

```sh
yarn add --dev @chiffon/prerender-webpack-plugin
```

## Usage

In your webpack config:

```js
const PrerenderWebpackPlugin = require('@chiffon/prerender-webpack-plugin');

module.exports = {
  ...
  plugins: [
    // instead of 'HtmlWebpackPlugin'
    new PrerenderWebpackPlugin({
      filename: 'index.html',
      template: path.resolve(__dirname, 'src', 'index.js'),
    }),
    ...
  ]
};
```

@chiffon/prerender-webpack-plugin will pass the output file paths like JavaScript and CSS to your function in `index.js`, which must return a string:

```jsx
// index.js
import React from 'react'
import ReactDOM from 'react-dom/server'
import App from './App.js'

function defaultTemplate({ css, js }) {
  // First we render the outside parts of html as static string (e.g. head, body)
  // Next, we render the web app root as html (e.g. <App />) and
  // inject this into the outside parts via dangerouslySetInnerHTML because
  // we only need React to hydrate the root element.
  return `<!DOCTYPE html>
  ${ReactDOM.renderToStaticMarkup(
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>My Web App</title>
        {css &&
          css.map(cssResourceUrl => (
            <link
              href={`${__webpack_public_path__}${cssResourceUrl}`}
              rel="stylesheet"
            />
          ))}
        {js &&
          js.map(jsResourceUrl => (
            <script
              src={`${__webpack_public_path__}${jsResourceUrl}`}
              nomodule
              defer
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

export default defaultTemplate
```

## FAQ

### What is prerendering?

Single Page Applications (SPA) like those made from create-react-app, vue-cli and similar tools require JavaScript to run before creating the components in the HTML.

Prerendering is generating the HTML during compile time (e.g. webpack build), so that users see some content before JavaScript is downloaded and parsed.

### Why prerender?

Prerendering results in better perceived performance as users see the content earlier.

There are some Search Engine Optimisations (SEO) benefits too as search engine crawlers are better with plain HTML than SPAs.

### What are the downsides to prerendering?

Even though your content is prerendered, user interactions like clicks and key presses may not trigger as JavaScript has not executed yet. If you have large JavaScript files, this may not be ideal.

Certain applications such as internal apps may not benefit from faster content.

## References and Further Reading

- [Google: App shell model](https://developers.google.com/web/fundamentals/architecture/app-shell)
- [Netlify: Prerendering explained](https://www.netlify.com/blog/2016/11/22/prerendering-explained/)
- [Client-side vs Prerendering vs SSR](https://www.toptal.com/front-end/client-side-vs-server-side-pre-rendering)
