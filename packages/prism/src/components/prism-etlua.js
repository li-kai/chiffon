import Prism from './prism-core'
import './prism-lua'
import './prism-markup'
import './prism-markup-templating'
Prism.languages.etlua = {
  delimiter: {
    pattern: /^<%[-=]?|-?%>$/,
    alias: 'punctuation',
  },
  'language-lua': {
    pattern: /[\s\S]+/,
    inside: Prism.languages.lua,
  },
}

Prism.hooks.add('before-tokenize', function (env) {
  var pattern = /<%[\s\S]+?%>/g
  Prism.languages['markup-templating'].buildPlaceholders(env, 'etlua', pattern)
})

Prism.hooks.add('after-tokenize', function (env) {
  Prism.languages['markup-templating'].tokenizePlaceholders(env, 'etlua')
})
