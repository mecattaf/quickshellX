import { useEffect, ReactNode } from 'react'

export default function EmbedWrapper({ rootClass, scrollable, children }: {
  rootClass?: string
  scrollable?: boolean
  children: ReactNode
}) {
  useEffect(() => {
    const blockWheel = (e: WheelEvent) => { if (e.ctrlKey) e.preventDefault() }
    const blockKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.key === '+' || e.key === '-' || e.key === '=')) e.preventDefault()
    }
    window.addEventListener('wheel', blockWheel, { passive: false })
    window.addEventListener('keydown', blockKey)
    return () => { window.removeEventListener('wheel', blockWheel); window.removeEventListener('keydown', blockKey) }
  }, [])

  return (
    <div className={`embed-root${scrollable ? ' scrollable' : ''}${rootClass ? ` ${rootClass}` : ''}`}>
      {children}
    </div>
  )
}
