import React from 'react'
import ReactDOM from 'react-dom'
import App from './App.js'
import './root.css'

const init =
  process.env.NODE_ENV === 'production' ? ReactDOM.hydrate : ReactDOM.render
init(<App />, document.getElementById('root'))
