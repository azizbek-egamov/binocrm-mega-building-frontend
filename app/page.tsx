'use client'

import { useEffect } from 'react'
import App from '@/src/App'
import '@/src/index.css'

export default function Page() {
  useEffect(() => {
    // Ensure the root html element has the proper attributes
    const htmlElement = document.documentElement
    htmlElement.style.margin = '0'
    htmlElement.style.padding = '0'
  }, [])

  return (
    <div style={{ margin: 0, padding: 0, width: '100%', minHeight: '100vh' }}>
      <App />
    </div>
  )
}
