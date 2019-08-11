import { h, render } from 'preact'
import App from './App.js'
import './root.css'

const rootNode = document.getElementById('root')
const nodeToReplace = rootNode.firstElementChild
render(<App />, rootNode, nodeToReplace)
