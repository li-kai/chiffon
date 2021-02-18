import Prism from './prism-core'
import './prism-t4-templating'
import './prism-basic'
import './prism-vbnet'
Prism.languages['t4-vb'] = Prism.languages['t4-templating'].createT4('vbnet')
