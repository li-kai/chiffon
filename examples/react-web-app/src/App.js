import React, { useState, useLayoutEffect } from 'react'

export default function App() {
  const [time, setTime] = useState('')
  useLayoutEffect(() => {
    setTime(new Date().toLocaleTimeString())
  })

  return (
    <div>
      <h1>Example Web App</h1>
      <span>{time}</span>
    </div>
  )
}
