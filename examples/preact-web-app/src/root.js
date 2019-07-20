import { h, render } from 'preact'
import App from './App.js'
import './root.css'

const rootNode = document.getElementById('root')

// replaceNode instead of appending due to prerendering
if (process.env.NODE_ENV === 'production') {
  const nodeToReplace = rootNode.firstElementChild
  render(<App />, rootNode, nodeToReplace)
} else {
  render(<App />, rootNode)
}
