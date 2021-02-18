import Prism from './prism-core'
import './prism-t4-templating'
import './prism-clike'
import './prism-csharp'
Prism.languages.t4 = Prism.languages['t4-cs'] = Prism.languages[
  't4-templating'
].createT4('csharp')
