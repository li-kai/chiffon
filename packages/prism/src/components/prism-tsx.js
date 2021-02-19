import Prism from './prism-core'
import './prism-markup'
import './prism-clike'
import './prism-javascript'
import './prism-typescript'
import './prism-jsx'
var typescript = Prism.util.clone(Prism.languages.typescript)
Prism.languages.tsx = Prism.languageUtils.extend('jsx', typescript)

// This will prevent collisions between TSX tags and TS generic types.
// Idea by https://github.com/karlhorky
// Discussion: https://github.com/PrismJS/prism/issues/2594#issuecomment-710666928
var tag = Prism.languages.tsx.tag
tag.pattern = RegExp(
  /(^|[^\w$]|(?=<\/))/.source + '(?:' + tag.pattern.source + ')',
  tag.pattern.flags,
)
tag.lookbehind = true
