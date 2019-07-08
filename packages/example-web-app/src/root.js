import { h, render } from 'preact'

function App() {
  let time = new Date().toLocaleTimeString()
  return (
    <div>
      <h1>Example Web App</h1>
      <span>{time}</span>
    </div>
  )
}

render(<App />, document.getElementById('root'))
