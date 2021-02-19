import Prism from './prism-core'
import './prism-markup'
import './prism-markup-templating'
import './prism-php'
import './prism-javadoclike'
var typeExpression = /(?:\b[a-zA-Z]\w*|[|\\[\]])+/.source

Prism.languages.phpdoc = Prism.languageUtils.extend('javadoclike', {
  parameter: {
    pattern: RegExp(
      '(@(?:global|param|property(?:-read|-write)?|var)\\s+(?:' +
        typeExpression +
        '\\s+)?)\\$\\w+',
    ),
    lookbehind: true,
  },
})

Prism.languageUtils.insertBefore('phpdoc', 'keyword', {
  'class-name': [
    {
      pattern: RegExp(
        '(@(?:global|package|param|property(?:-read|-write)?|return|subpackage|throws|var)\\s+)' +
          typeExpression,
      ),
      lookbehind: true,
      inside: {
        keyword: /\b(?:callback|resource|boolean|integer|double|object|string|array|false|float|mixed|bool|null|self|true|void|int)\b/,
        punctuation: /[|\\[\]()]/,
      },
    },
  ],
})

Prism.languages.javadoclike.addSupport('php', Prism.languages.phpdoc)
