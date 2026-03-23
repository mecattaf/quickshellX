import { useState } from 'react'
import './index.css'

// ─── Icons (inline SVG) ───
const SearchIcon = () => (
  <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
  </svg>
)

const Arrow = () => <span style={{color: 'var(--text-dim)', fontSize: 11}}>←</span>

// ─── Emoji icons for demo (in real shell these would be actual app icons) ───
export const apps = [
  { icon: '📝', name: 'Neovim', sub: 'Edit text files', color: '#4a9' },
  { icon: '🌐', name: 'Firefox', sub: 'Web browser', color: '#f60' },
  { icon: '📁', name: 'Nautilus', sub: 'File manager', color: '#48f' },
  { icon: '💬', name: 'Discord', sub: 'Chat & communities', color: '#58f' },
  { icon: '🎵', name: 'Spotify', sub: 'Music streaming', color: '#1db954' },
  { icon: '📧', name: 'Thunderbird', sub: 'Email client', color: '#0a84ff' },
  { icon: '⚙️', name: 'Settings', sub: 'System preferences', color: '#888' },
  { icon: '🖥️', name: 'Kitty', sub: 'GPU-accelerated terminal', color: '#999' },
]

export const files = [
  { icon: '📄', name: 'config.toml', sub: '~/.config/niri/', type: 'File' },
  { icon: '📁', name: 'dotfiles', sub: '~/mecattaf/', type: 'Folder' },
  { icon: '🖼️', name: 'wallpaper.png', sub: '~/Desktop/', type: 'Image' },
]

export const commands = [
  { icon: '⬅️', name: 'Left Half', sub: 'Window Management' },
  { icon: '➡️', name: 'Right Half', sub: 'Window Management' },
  { icon: '⬆️', name: 'Almost Maximize', sub: 'Window Management' },
  { icon: '🔳', name: 'Toggle Full Screen', sub: 'Window Management' },
  { icon: '↙️', name: 'Bottom Left Quarter', sub: 'Window Management' },
  { icon: '↗️', name: 'Top Right Quarter', sub: 'Window Management' },
  { icon: '⅓', name: 'Last Third', sub: 'Window Management' },
  { icon: '⅔', name: 'Last Two Thirds', sub: 'Window Management' },
]

export const clipboardItems = [
  { icon: '🖼️', name: 'Image (1200 × 1000)', time: 'Today' },
  { icon: '🥭', name: 'Two Mangos (640 × 427)', time: 'Today' },
  { icon: '✨', name: 'magic.png (640 × 360)', time: 'Today' },
  { icon: '🏔️', name: 'Image (842 × 420)', time: 'Today' },
]

// ─── Variation 1: App Launcher ───
export function AppLauncher() {
  const [selected, setSelected] = useState(0)
  const [query, setQuery] = useState('')
  const filtered = apps.filter(a =>
    a.name.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="glass-panel">
      <div className="search-bar">
        <SearchIcon />
        <input className="search-input" placeholder="Search applications..."
          value={query} onChange={e => setQuery(e.target.value)} />
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
  )
}

// ─── Variation 2: Command Palette (with parameter chips) ───
export function CommandPalette() {
  const [selected, setSelected] = useState(0)
  return (
    <div className="glass-panel deep">
      <div className="search-bar">
        <SearchIcon />
        <input className="search-input" defaultValue="create" placeholder="Search commands..." />
        <div className="search-chips">
          <span className="search-chip filled">Buy milk</span>
          <span className="search-chip">when (eg. "today")</span>
        </div>
      </div>
      <div className="results">
        <div className="section-header">
          <span className="section-title">Results</span>
        </div>
        {[
          { icon: '☑️', name: 'Create To-Do', sub: 'Things' },
          { icon: '📋', name: 'Create Snippet', sub: 'Snippets' },
          { icon: '🧩', name: 'Create Extension', sub: 'Developer' },
          { icon: '🤖', name: 'Create AI Command', sub: 'AI' },
          { icon: '⚡', name: 'Create Script Command', sub: 'Scripts' },
          { icon: '🔗', name: 'Create Quicklink', sub: 'Quicklinks' },
        ].map((cmd, i) => (
          <div key={cmd.name}
            className={`result-item ${i === selected ? 'selected' : ''}`}
            onMouseEnter={() => setSelected(i)}>
            <div className="result-icon" style={{fontSize: 20}}>{cmd.icon}</div>
            <div className="result-text">
              <span className="result-name">{cmd.name}</span>
            </div>
            <div className="result-meta">
              <span className="result-badge">{cmd.sub}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="footer">
        <div className="footer-left">
          <span className="footer-tab">⚡ Open Command</span>
        </div>
        <div className="footer-right">
          <span className="footer-hint"><span className="kbd">↵</span></span>
          <span className="footer-hint">Actions <span className="kbd">⌘</span><span className="kbd">K</span></span>
        </div>
      </div>
    </div>
  )
}

// ─── Variation 3: Window Management ───
export function WindowManager() {
  const [selected, setSelected] = useState(2)
  return (
    <div className="glass-panel warm">
      <div className="search-bar">
        <SearchIcon />
        <input className="search-input" defaultValue="window management" />
      </div>
      <div className="results">
        <div className="section-header">
          <span className="section-title">Results</span>
        </div>
        {commands.map((cmd, i) => (
          <div key={cmd.name}
            className={`result-item ${i === selected ? 'selected' : ''}`}
            onMouseEnter={() => setSelected(i)}>
            <div className="result-icon" style={{
              fontSize: 16,
              background: i === selected ? 'rgba(80,80,255,0.2)' : 'rgba(80,80,255,0.1)',
              color: '#8888ff',
              borderRadius: 6,
            }}>{cmd.icon}</div>
            <div className="result-text">
              <span className="result-name">{cmd.name}</span>
            </div>
            <div className="result-meta">
              <span className="result-badge">{cmd.sub}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="footer">
        <div className="footer-left">
          <span className="footer-tab">⚙️</span>
        </div>
        <div className="footer-right">
          <span className="footer-hint">Open Command <span className="kbd">↵</span></span>
          <span className="footer-hint">Actions <span className="kbd">⌘</span><span className="kbd">K</span></span>
        </div>
      </div>
    </div>
  )
}

// ─── Variation 4: Clipboard Manager (Split Pane) ───
export function ClipboardManager() {
  const [selected, setSelected] = useState(3)
  return (
    <div className="glass-panel" style={{width: 780}}>
      <div className="search-bar">
        <Arrow />
        <input className="search-input" placeholder="Type to filter entries..." />
        <div className="search-chips">
          <span className="search-chip filled">Images Only ▾</span>
        </div>
      </div>
      <div className="split-pane">
        <div className="split-left">
          <div className="section-header">
            <span className="section-title">Today</span>
          </div>
          {clipboardItems.map((item, i) => (
            <div key={item.name}
              className={`result-item ${i === selected ? 'selected' : ''}`}
              onMouseEnter={() => setSelected(i)}>
              <div className="result-icon" style={{fontSize: 18}}>{item.icon}</div>
              <div className="result-text">
                <span className="result-name" style={{fontSize: 12}}>{item.name}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="split-right">
          <div className="preview-image">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="30" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
              <path d="M20 55 Q40 20 60 55" stroke="rgba(255,255,255,0.15)" strokeWidth="1" fill="none"/>
            </svg>
          </div>
          <div style={{borderTop: '1px solid var(--glass-border)', paddingTop: 12}}>
            <div style={{fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8}}>Information</div>
            <div className="info-table">
              <span className="info-label">Application</span><span className="info-value">Finder</span>
              <span className="info-label">Content Type</span><span className="info-value">Image</span>
              <span className="info-label">Path</span><span className="info-value">~/Desktop/wallpaper.png</span>
              <span className="info-label">Dimensions</span><span className="info-value">842 × 420</span>
            </div>
          </div>
        </div>
      </div>
      <div className="footer">
        <div className="footer-left">
          <span className="footer-tab" style={{color: 'var(--text-dim)'}}>📋 Clipboard History</span>
        </div>
        <div className="footer-right">
          <span className="footer-hint">Copy to Clipboard <span className="kbd">↵</span></span>
          <span className="footer-hint">Actions <span className="kbd">⌘</span><span className="kbd">K</span></span>
        </div>
      </div>
    </div>
  )
}

// ─── Variation 5: Notes / Rich Content ───
export function NotesView() {
  return (
    <div className="glass-panel" style={{width: 580}}>
      <div className="notes-content">
        <div className="notes-category">Meeting Notes</div>
        <h1 className="notes-title">Meeting notes</h1>
        <p className="notes-body">
          Make sure to go through <a href="#">beta feedback</a> after the
          meeting and push new improvements behind feature flag.
        </p>
        <hr className="notes-divider" />
        <h2 className="notes-task-title">Task list</h2>
        {[
          { text: 'Collect and go through beta feedback', done: true },
          { text: 'Add settings entry point case', done: false },
          { text: 'Need to handle multiple accounts case', done: false },
          { text: 'Add error for profile pic file size', done: false },
          { text: 'Look into crash on sign out', done: false },
          { text: 'add feature flag for launch', done: false },
        ].map((task, i) => (
          <div key={i} className={`task-item ${task.done ? 'done' : ''}`}>
            <div className={`task-checkbox ${task.done ? 'checked' : ''}`} />
            <span>{task.text}</span>
          </div>
        ))}
      </div>
      <div className="footer">
        <div className="footer-left" />
        <div className="footer-right">
          <span className="footer-hint"><span className="kbd">↵</span></span>
          <span className="footer-hint"><span className="kbd">⌘</span><span className="kbd">K</span></span>
        </div>
      </div>
    </div>
  )
}

// ─── Variation 6: Grid + List mixed (like DMS screenshot) ───
export function MixedView() {
  const [selected, setSelected] = useState(0)
  return (
    <div className="glass-panel">
      <div className="search-bar">
        <SearchIcon />
        <input className="search-input" defaultValue="neovim" />
      </div>
      <div className="results">
        <div className="section-header">
          <span>
            <span className="section-title">Applications</span>
            <span className="section-count">2</span>
          </span>
          <div className="section-actions">
            <span className="section-action active">☰</span>
            <span className="section-action">⊞</span>
          </div>
        </div>
        {[
          { icon: '📝', name: 'Neovim', sub: 'Edit text files' },
          { icon: '👻', name: 'Neovim (Ghostty)', sub: 'Edit in floating Ghostty' },
        ].map((app, i) => (
          <div key={app.name}
            className={`result-item ${i === selected ? 'selected' : ''}`}
            onMouseEnter={() => setSelected(i)}>
            <div className="result-icon app-icon" style={{fontSize: 22}}>{app.icon}</div>
            <div className="result-text">
              <span className="result-name">
                {highlightMatch(app.name, 'neovim')}
              </span>
              <span className="result-subtitle">{app.sub}</span>
            </div>
          </div>
        ))}

        <div className="section-header" style={{marginTop: 4}}>
          <span>
            <span className="section-title">Configs</span>
            <span className="section-count">3</span>
          </span>
          <div className="section-actions">
            <span className="section-action">☰</span>
            <span className="section-action active">⊞</span>
            <span className="section-action">⊟</span>
          </div>
        </div>
        <div className="grid-view">
          {['Custom Neovim', 'Dev Neovim', 'Linux Neovim', 'Minimal Neovim'].map((name, i) => (
            <div key={name} className={`grid-item ${i === 0 ? 'selected' : ''}`}>
              <div className="grid-icon">📝</div>
              <span className="grid-label">{name}</span>
            </div>
          ))}
        </div>

        <div className="section-header" style={{marginTop: 4}}>
          <span className="section-title">Settings</span>
          <span className="section-count">1</span>
        </div>
        <div className="result-item">
          <div className="result-icon" style={{fontSize: 18}}>⚙️</div>
          <div className="result-text">
            <span className="result-name">{highlightMatch('neovim', 'neovim')}</span>
            <span className="result-subtitle">Theme & Colors</span>
          </div>
          <div className="result-meta">
            <span className="result-badge">Plugin</span>
          </div>
        </div>
      </div>
      <div className="footer">
        <div className="footer-left">
          <span className="footer-tab active">🔍 All</span>
          <span className="footer-tab">⊞ Apps</span>
          <span className="footer-tab">📁 Files</span>
          <span className="footer-tab">🧩 Plugins</span>
        </div>
        <div className="footer-right">
          <span className="footer-hint">↑↓ nav</span>
          <span className="footer-hint">↵ open</span>
        </div>
      </div>
    </div>
  )
}

// ─── Highlight helper ───
export function highlightMatch(text: string, query: string) {
  if (!query) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return <>
    {text.slice(0, idx)}
    <span className="highlight">{text.slice(idx, idx + query.length)}</span>
    {text.slice(idx + query.length)}
  </>
}

// ─── Main App ───
export default function App() {
  return (
    <>
      <div className="wallpaper" />
      <div className="demo-container">
        <span className="demo-label">1 — App Launcher</span>
        <AppLauncher />

        <span className="demo-label">2 — Command Palette with Chips</span>
        <CommandPalette />

        <span className="demo-label">3 — Window Management (warm glass)</span>
        <WindowManager />

        <span className="demo-label">4 — Clipboard Manager (split pane)</span>
        <ClipboardManager />

        <span className="demo-label">5 — Notes / Rich Content</span>
        <NotesView />

        <span className="demo-label">6 — Mixed List + Grid (DMS style)</span>
        <MixedView />
      </div>
    </>
  )
}
