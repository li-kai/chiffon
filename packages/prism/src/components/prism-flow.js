import Prism from './prism-core'
import './prism-clike'
import './prism-javascript'
Prism.languages.flow = Prism.languageUtils.extend('javascript', {})

Prism.languageUtils.insertBefore('flow', 'keyword', {
  type: [
    {
      pattern: /\b(?:[Nn]umber|[Ss]tring|[Bb]oolean|Function|any|mixed|null|void)\b/,
      alias: 'tag',
    },
  ],
})
Prism.languages.flow[
  'function-variable'
].pattern = /(?!\s)[_$a-z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*=\s*(?:function\b|(?:\([^()]*\)(?:\s*:\s*\w+)?|(?!\s)[_$a-z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)\s*=>))/i
delete Prism.languages.flow['parameter']

Prism.languageUtils.insertBefore('flow', 'operator', {
  'flow-punctuation': {
    pattern: /\{\||\|\}/,
    alias: 'punctuation',
  },
})

if (!Array.isArray(Prism.languages.flow.keyword)) {
  Prism.languages.flow.keyword = [Prism.languages.flow.keyword]
}
Prism.languages.flow.keyword.unshift(
  {
    pattern: /(^|[^$]\b)(?:type|opaque|declare|Class)\b(?!\$)/,
    lookbehind: true,
  },
  {
    pattern: /(^|[^$]\B)\$(?:await|Diff|Exact|Keys|ObjMap|PropertyType|Shape|Record|Supertype|Subtype|Enum)\b(?!\$)/,
    lookbehind: true,
  },
)
