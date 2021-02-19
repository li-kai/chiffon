import Prism from './prism-core'
import './prism-json'
Prism.languages.jsonp = Prism.languageUtils.extend('json', {
  punctuation: /[{}[\]();,.]/,
})

Prism.languageUtils.insertBefore('jsonp', 'punctuation', {
  function: /(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*\()/,
})
