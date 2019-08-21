import { h } from 'preact'
import { useState, useEffect } from 'preact/hooks'

export default function AppShell() {
  const [Component, setComponent] = useState(null)

  useEffect(() => {
    import('./App').then(({ default: App }) => {
      setComponent(App)
    })
  }, [])

  return (
    <div>
      <h1>Exampled Web App</h1>
      {Component}
    </div>
  )
}
