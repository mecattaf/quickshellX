import { useState, useEffect } from 'react'
import './index.css'

const SearchIcon = () => (
  <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
  </svg>
)

const apps = [
  { icon: '📝', name: 'Neovim', sub: 'Edit text files' },
  { icon: '🌐', name: 'Firefox', sub: 'Web browser' },
  { icon: '📁', name: 'Nautilus', sub: 'File manager' },
  { icon: '💬', name: 'Discord', sub: 'Chat & communities' },
  { icon: '🎵', name: 'Spotify', sub: 'Music streaming' },
  { icon: '📧', name: 'Thunderbird', sub: 'Email client' },
  { icon: '⚙️', name: 'Settings', sub: 'System preferences' },
  { icon: '🖥️', name: 'Kitty', sub: 'GPU-accelerated terminal' },
]

function highlightMatch(text: string, query: string) {
  if (!query) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return <>
    {text.slice(0, idx)}
    <span className="highlight">{text.slice(idx, idx + query.length)}</span>
    {text.slice(idx + query.length)}
  </>
}

export default function Launcher() {
  const [selected, setSelected] = useState(0)
  const [query, setQuery] = useState('')

  // Disable Ctrl+scroll zoom — this is a shell widget, not a web page
  useEffect(() => {
    const block = (e: WheelEvent) => { if (e.ctrlKey) e.preventDefault() }
    const blockKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.key === '+' || e.key === '-' || e.key === '=')) e.preventDefault()
    }
    window.addEventListener('wheel', block, { passive: false })
    window.addEventListener('keydown', blockKey)
    return () => { window.removeEventListener('wheel', block); window.removeEventListener('keydown', blockKey) }
  }, [])
  const filtered = apps.filter(a =>
    a.name.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="launcher-root">
      <div className="glass-panel">
        <div className="search-bar">
          <SearchIcon />
          <input className="search-input" placeholder="Search applications..."
            autoFocus
            value={query} onChange={e => { setQuery(e.target.value); setSelected(0) }}
            onKeyDown={e => {
              if (e.key === 'ArrowDown') setSelected(s => Math.min(s + 1, filtered.length - 1))
              if (e.key === 'ArrowUp') setSelected(s => Math.max(s - 1, 0))
            }}
          />
        </div>
        <div className="results">
          <div className="section-header">
            <span>
              <span className="section-title">Applications</span>
              <span className="section-count">{filtered.length}</span>
            </span>
            <div className="section-actions">
              <span className="section-action active">☰</span>
              <span className="section-action">⊞</span>
              <span className="section-action">⊟</span>
            </div>
          </div>
          {filtered.map((app, i) => (
            <div key={app.name}
              className={`result-item ${i === selected ? 'selected' : ''}`}
              onMouseEnter={() => setSelected(i)}>
              <div className="result-icon app-icon" style={{fontSize: 22}}>{app.icon}</div>
              <div className="result-text">
                <span className="result-name">
                  {query ? highlightMatch(app.name, query) : app.name}
                </span>
                <span className="result-subtitle">{app.sub}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="footer">
          <div className="footer-left">
            <span className="footer-tab active">🔍 All</span>
            <span className="footer-tab">⊞ Apps</span>
            <span className="footer-tab">📁 Files</span>
          </div>
          <div className="footer-right">
            <span className="footer-hint">↑↓ nav</span>
            <span className="footer-hint">↵ open</span>
            <span className="footer-hint">Tab actions</span>
          </div>
        </div>
      </div>
    </div>
  )
}
