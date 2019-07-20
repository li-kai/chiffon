import { h } from 'preact'

export default function App() {
  let time = new Date().toLocaleTimeString()
  return (
    <div>
      <h1>Example Web App</h1>
      <span>{time}</span>
    </div>
  )
}
