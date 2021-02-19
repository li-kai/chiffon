import Prism from './prism-core'
import './prism-markup'
import './prism-markup-templating'
import './prism-php'
Prism.languageUtils.insertBefore('php', 'variable', {
  this: /\$this\b/,
  global: /\$(?:_(?:SERVER|GET|POST|FILES|REQUEST|SESSION|ENV|COOKIE)|GLOBALS|HTTP_RAW_POST_DATA|argc|argv|php_errormsg|http_response_header)\b/,
  scope: {
    pattern: /\b[\w\\]+::/,
    inside: {
      keyword: /static|self|parent/,
      punctuation: /::|\\/,
    },
  },
})
