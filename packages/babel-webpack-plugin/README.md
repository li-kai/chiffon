# @chiffon/babel-webpack-plugin

Modern browsers can now load ES modules, which means smaller and faster code!

This plugin allows compiling different versions of JavaScript files with Babel, so you can serve older browsers backwards compatable code with your ES modules.

## Installation

npm:

```sh
npm install --save-dev @chiffon/babel-webpack-plugin
```

yarn:

```sh
yarn add --dev @chiffon/babel-webpack-plugin
```

## Usage

In your webpack config:

```js
const BabelWebpackPlugin = require('@chiffon/babel-webpack-plugin');

module.exports = {
  ...
  module: {
    rules: [
      {
        test: /\.(js|mjs|ts)x?$/,
        use: BabelWebpackPlugin.loader // instead of 'babel-loader'
      },
      ...
    ]
  },
  plugins: [
    new BabelWebpackPlugin({
      targets: [
        {
          target: 'client-legacy',
          excludedPlugins: [],
        },
          target: 'client-modern',
          filename: '[name].[contenthash].mjs',
          chunkFilename: '[name].[contenthash].mjs',
          excludedPlugins: [],
        },
        ...
      ]
    })
    ...
  ]
};
```

@chiffon/babel-webpack-plugin will pass the value of `target` to babel, which you can use like so:

In babel.config.js:

```js
function getBabelWebpackPluginTarget(caller) {
  return caller && caller.target
}

module.exports = function(api) {
  const pluginTarget = api.caller(getBabelWebpackPluginTarget)
  const isModernClient = pluginTarget === 'client-modern'
  const isLegacyClient = pluginTarget === 'client-legacy'

  const presetEnvConfig = {
    modules: isModernClient ? false : 'commonjs',
    targets: { node: 'current' },
  }

  // when pluginTarget is specified, we change preset-env's targets to browsers
  if (isModernClient) {
    presetEnvConfig.targets = { esmodules: true }
  } else if (isLegacyClient) {
    presetEnvConfig.targets = '> 0.25%, not dead'
  }

  return {
    presets: [['@babel/preset-env', presetEnvConfig]],
  }
}
```

Webpack will then build both `index.js` and `index.mjs`.

## FAQ

### What browsers can use ES modules?

All major modern browsers support loading ES modules via the `<script type="module>` tag. [caniuse.com](https://caniuse.com/#feat=es6-module)

### What benefits are there to ES modules?

Since modern browsers also support features like arrow functions, Map, Set and more, there is no need to polyfill or transform those code. This results in a JavaScript bundle that is smaller and faster to download and parse.

### Why compile two or more version?

Older browsers do not understand ES modules, so we still must compile ES5 code in order to provide backwards compatability.

Additionally, you can compile another version for browsers support async/await syntax and get smaller file sizes.

Jason Miller, creator of Preact, explains the various techniques you can apply at https://jasonformat.com/modern-script-loading/.

## References and Further Reading

- [@babel/preset-env targets.esmodules](https://babeljs.io/docs/en/babel-preset-env#targetsesmodules)
- [Jake Archibald: ECMAScript Modules in browsers](https://jakearchibald.com/2017/es-modules-in-browsers/)
- [Modern Script Loading](https://jasonformat.com/modern-script-loading/)
- [freeCodeCamp: using ECMAScript modules](https://www.freecodecamp.org/news/how-to-use-ecmascript-modules-to-build-modular-components-in-javascript-9023205ea42a/)
