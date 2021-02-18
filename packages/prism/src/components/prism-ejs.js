import Prism from './prism-core'
import './prism-clike'
import './prism-markup'
import './prism-javascript'
import './prism-markup-templating'
Prism.languages.ejs = {
  delimiter: {
    pattern: /^<%[-_=]?|[-_]?%>$/,
    alias: 'punctuation',
  },
  comment: /^#[\s\S]*/,
  'language-javascript': {
    pattern: /[\s\S]+/,
    inside: Prism.languages.javascript,
  },
}

Prism.hooks.add('before-tokenize', function (env) {
  var ejsPattern = /<%(?!%)[\s\S]+?%>/g
  Prism.languages['markup-templating'].buildPlaceholders(env, 'ejs', ejsPattern)
})

Prism.hooks.add('after-tokenize', function (env) {
  Prism.languages['markup-templating'].tokenizePlaceholders(env, 'ejs')
})

Prism.languages.eta = Prism.languages.ejs
