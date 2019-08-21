import { h, render } from 'preact'
import AppShell from './AppShell.js'
import './root.css'

const rootNode = document.getElementById('root')
const nodeToReplace = rootNode.firstElementChild
render(<AppShell />, rootNode, nodeToReplace)
console.log('render')
