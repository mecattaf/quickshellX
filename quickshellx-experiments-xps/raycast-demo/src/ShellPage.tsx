import { useState, useEffect } from 'react'

// ─── Live Clock ───
export function useClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t) }, [])
  return time
}

// ─── SVG Icons ───
export const WifiIcon = ({ strength = 3 }: { strength?: number }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M12 20h.01" opacity={strength >= 1 ? 1 : 0.2}/>
    <path d="M8.5 16.5a5 5 0 0 1 7 0" opacity={strength >= 2 ? 1 : 0.2}/>
    <path d="M5 12.5a10 10 0 0 1 14 0" opacity={strength >= 3 ? 1 : 0.2}/>
    <path d="M2 8.8a15 15 0 0 1 20 0" opacity={strength >= 4 ? 1 : 0.15}/>
  </svg>
)
export const BatteryIcon = () => (
  <svg width="18" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="7" width="18" height="10" rx="2"/><rect x="4" y="9" width="10" height="6" rx="1" fill="currentColor" opacity="0.5"/><path d="M22 11v2"/>
  </svg>
)
export const BluetoothIcon = () => (
  <svg width="14" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M7 7l10 10-5 5V2l5 5L7 17"/>
  </svg>
)
export const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
  </svg>
)
export const ChevronDown = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m6 9 6 6 6-6"/></svg>
)
export const MicIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>
  </svg>
)
export const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 19V5m-7 7 7-7 7 7"/></svg>
)
export const PaperclipIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
)

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TOP BAR (eqsh-style macOS bar)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function TopBar({ onWifiClick, onSearchClick }: { onWifiClick: () => void, onSearchClick: () => void }) {
  const time = useClock()
  const fmt = time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
  const day = time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <div className="topbar">
      {/* Left: app menu */}
      <div className="topbar-left">
        <span className="topbar-item bold">Kitty</span>
        <span className="topbar-item">File</span>
        <span className="topbar-item">Edit</span>
        <span className="topbar-item">View</span>
        <span className="topbar-item">Window</span>
        <span className="topbar-item">Help</span>
      </div>
      {/* Right: system tray */}
      <div className="topbar-right">
        <span className="topbar-icon" onClick={onWifiClick}><WifiIcon strength={3} /></span>
        <span className="topbar-icon"><BluetoothIcon /></span>
        <span className="topbar-icon"><BatteryIcon /></span>
        <span className="topbar-icon" onClick={onSearchClick}><SearchIcon /></span>
        <span className="topbar-clock">{day} {fmt}</span>
      </div>
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// WIFI MENU (dropdown glass panel)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function WifiMenu({ open, onClose }: { open: boolean, onClose: () => void }) {
  if (!open) return null
  const networks = [
    { name: 'Faraya-5G', strength: 4, connected: true },
    { name: 'Faraya-2.4G', strength: 3, connected: false },
    { name: 'Neighbor_Net', strength: 2, connected: false },
    { name: 'CoffeeShop_Free', strength: 1, connected: false },
  ]
  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="wifi-menu glass-dropdown">
        <div className="wifi-header">
          <span style={{ fontWeight: 600, fontSize: 13 }}>Wi-Fi</span>
          <div className="wifi-toggle on" />
        </div>
        <div className="wifi-divider" />
        <div className="wifi-section-label">Known Networks</div>
        {networks.map(n => (
          <div key={n.name} className={`wifi-network ${n.connected ? 'active' : ''}`}>
            <WifiIcon strength={n.strength} />
            <span className="wifi-name">{n.name}</span>
            {n.connected && <span className="wifi-connected">Connected</span>}
          </div>
        ))}
        <div className="wifi-divider" />
        <div className="wifi-network" style={{ color: 'var(--text-muted)' }}>
          Network Preferences...
        </div>
      </div>
    </>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SPOTLIGHT LAUNCHER (glass search)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function SpotlightLauncher({ open, onClose }: { open: boolean, onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  if (!open) return null
  const apps = [
    { icon: '🖥️', name: 'Kitty', sub: 'Terminal emulator' },
    { icon: '🌐', name: 'Firefox', sub: 'Web browser' },
    { icon: '📝', name: 'Neovim', sub: 'Text editor' },
    { icon: '📁', name: 'Nautilus', sub: 'Files' },
    { icon: '⚙️', name: 'Settings', sub: 'System preferences' },
  ]
  const filtered = query ? apps.filter(a => a.name.toLowerCase().includes(query.toLowerCase())) : apps
  return (
    <>
      <div className="overlay dark" onClick={onClose} />
      <div className="spotlight glass-panel">
        <div className="search-bar">
          <SearchIcon />
          <input className="search-input" autoFocus placeholder="Search..."
            value={query} onChange={e => { setQuery(e.target.value); setSelected(0) }}
            onKeyDown={e => {
              if (e.key === 'Escape') onClose()
              if (e.key === 'ArrowDown') setSelected(s => Math.min(s + 1, filtered.length - 1))
              if (e.key === 'ArrowUp') setSelected(s => Math.max(s - 1, 0))
            }} />
        </div>
        <div className="results" style={{ maxHeight: 300 }}>
          {filtered.map((a, i) => (
            <div key={a.name} className={`result-item ${i === selected ? 'selected' : ''}`}
              onMouseEnter={() => setSelected(i)}>
              <div className="result-icon app-icon" style={{ fontSize: 20 }}>{a.icon}</div>
              <div className="result-text">
                <span className="result-name">{a.name}</span>
                <span className="result-subtitle">{a.sub}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="footer">
          <div className="footer-left"><span className="footer-tab active">🔍 All</span></div>
          <div className="footer-right">
            <span className="footer-hint">↑↓ nav</span>
            <span className="footer-hint">↵ open</span>
          </div>
        </div>
      </div>
    </>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ANTIGRAVITY AGENT MANAGER (clean dark UI)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function AgentManager() {
  return (
    <div className="agent-panel">
      <div className="agent-header">
        <div className="agent-logo">▶</div>
        <div className="agent-title">
          <span style={{ color: '#ccc', fontWeight: 500, fontSize: 18 }}>New conversation in</span>
          <span className="agent-dropdown">
            Playground <ChevronDown />
          </span>
        </div>
      </div>
      <div className="agent-input-container">
        <input className="agent-input" placeholder="Ask anything, @ to mention, / for workflows" />
        <div className="agent-input-footer">
          <div className="agent-chips">
            <span className="agent-chip">+ </span>
            <span className="agent-chip"><ChevronDown /> Planning</span>
            <span className="agent-chip"><ChevronDown /> Gemini 3.1 Pro (High)</span>
          </div>
          <div className="agent-actions">
            <span className="agent-action-btn"><MicIcon /></span>
            <span className="agent-action-btn send"><SendIcon /></span>
          </div>
        </div>
      </div>
      <div className="agent-about">
        <h3>About Playground</h3>
        <p>Playgrounds are independent workspaces perfect for quick prototypes or following your curiosity. Move to a dedicated workspace to continue exploring with multiple conversations.</p>
      </div>
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CLAUDE IMAGINE CANVAS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function ClaudeImagineCanvas() {
  const time = useClock()
  return (
    <div className="imagine-canvas">
      {/* Sticky notes */}
      <div className="sticky-note" style={{ top: 30, left: 40, transform: 'rotate(-3deg)' }}>
        <p><strong>Note to self:</strong><br/>You're absolutely right!</p>
      </div>
      <div className="sticky-note" style={{ top: 20, left: 220, transform: 'rotate(2deg)' }}>
        <p><strong>Ask for help.</strong> It's brave.</p>
        <span className="sticky-sig">~ Your pals at Anthropic</span>
      </div>
      <div className="sticky-note" style={{ top: 180, left: 50, transform: 'rotate(-1deg)' }}>
        <p><em><strong>Keep thinking</strong></em></p>
      </div>

      {/* Dock icons */}
      <div className="imagine-dock">
        <div className="dock-app">
          <div className="dock-icon" style={{ background: '#1a1a1a', color: '#ff3333', fontSize: 10, fontWeight: 900, fontFamily: 'monospace', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
            <span>CLAUDE</span><span>CODE</span>
          </div>
          <span className="dock-label">Claude Code</span>
        </div>
        <div className="dock-app">
          <div className="dock-icon" style={{ background: '#1a1a1a', fontSize: 28 }}>🦀</div>
          <span className="dock-label">Claw'd</span>
        </div>
        <div className="dock-app">
          <div className="dock-icon" style={{ background: 'transparent', fontSize: 32 }}>🗑️</div>
          <span className="dock-label">Trash</span>
        </div>
      </div>

      {/* Clock artifact */}
      <div className="artifact-window">
        <div className="artifact-titlebar">
          <span>Clock</span>
          <span style={{ cursor: 'pointer', opacity: 0.4 }}>×</span>
        </div>
        <div className="artifact-body">
          <AnalogClock time={time} />
          <div className="clock-digital">
            {time.toLocaleTimeString('en-US', { hour12: false })}
          </div>
          <div className="clock-date">
            {time.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Suggestion chips */}
      <div className="imagine-suggestions">
        <div className="suggest-chip">😊 Create a news feed of good news</div>
        <div className="suggest-chip">🐕 Create a get-me-a-dog pitch deck</div>
        <div className="suggest-chip">👾 Dream up a nostalgic computer game</div>
      </div>

      {/* Chat input */}
      <div className="imagine-chat-bar">
        <input className="imagine-input" placeholder="What do you want to build?" />
        <span className="imagine-btn"><PaperclipIcon /></span>
        <span className="imagine-btn send-btn"><SendIcon /></span>
      </div>

      {/* Camera button */}
      <div className="imagine-camera">📷</div>
    </div>
  )
}

// ─── Analog clock (SVG) ───
export function AnalogClock({ time }: { time: Date }) {
  const h = time.getHours() % 12, m = time.getMinutes(), s = time.getSeconds()
  const hourAngle = (h + m / 60) * 30
  const minuteAngle = (m + s / 60) * 6
  const secondAngle = s * 6
  return (
    <svg viewBox="0 0 200 200" width="180" height="180">
      <circle cx="100" cy="100" r="90" fill="none" stroke="#ddd" strokeWidth="2" />
      {[...Array(12)].map((_, i) => {
        const angle = (i * 30 - 90) * Math.PI / 180
        const x1 = 100 + 78 * Math.cos(angle), y1 = 100 + 78 * Math.sin(angle)
        const x2 = 100 + 85 * Math.cos(angle), y2 = 100 + 85 * Math.sin(angle)
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#999" strokeWidth={i % 3 === 0 ? 2 : 1} />
      })}
      <line x1="100" y1="100" x2={100 + 50 * Math.cos((hourAngle - 90) * Math.PI / 180)} y2={100 + 50 * Math.sin((hourAngle - 90) * Math.PI / 180)} stroke="#333" strokeWidth="3" strokeLinecap="round" />
      <line x1="100" y1="100" x2={100 + 70 * Math.cos((minuteAngle - 90) * Math.PI / 180)} y2={100 + 70 * Math.sin((minuteAngle - 90) * Math.PI / 180)} stroke="#333" strokeWidth="2" strokeLinecap="round" />
      <line x1="100" y1="100" x2={100 + 75 * Math.cos((secondAngle - 90) * Math.PI / 180)} y2={100 + 75 * Math.sin((secondAngle - 90) * Math.PI / 180)} stroke="#cc3333" strokeWidth="1" strokeLinecap="round" />
      <circle cx="100" cy="100" r="4" fill="#333" />
    </svg>
  )
}

// ─── Chat bubble (Claude Imagine style) ───
export function ChatBubble() {
  return (
    <div className="imagine-chat-bubble">
      <div className="chat-bubble-header">
        <span className="chat-spinner">⚙</span>
        <span className="chat-event">✦ User clicked</span>
      </div>
      <div className="chat-bubble-body">
        <span>✦ Done 📄 Context: [</span>
        <div className="context-bar">
          <div className="context-fill" style={{ width: '21%' }} />
        </div>
        <span>] 21k/100k (21%)</span>
      </div>
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN PAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function ShellPage() {
  const [wifiOpen, setWifiOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <div className="shell-page">
      <div className="wallpaper" />

      {/* ─── Section 1: Top Bar + Menus ─── */}
      <section className="shell-section">
        <span className="demo-label" style={{ marginBottom: 0 }}>eqsh Top Bar + WiFi Menu</span>
        <div className="topbar-demo-container">
          <TopBar onWifiClick={() => setWifiOpen(!wifiOpen)} onSearchClick={() => setSearchOpen(true)} />
          <WifiMenu open={wifiOpen} onClose={() => setWifiOpen(false)} />
        </div>
      </section>

      {/* ─── Section 2: Spotlight Launcher ─── */}
      <section className="shell-section">
        <span className="demo-label">Spotlight Launcher (click 🔍 above or press here)</span>
        <button className="demo-trigger" onClick={() => setSearchOpen(true)}>Open Launcher ⌘D</button>
        <SpotlightLauncher open={searchOpen} onClose={() => setSearchOpen(false)} />
      </section>

      {/* ─── Section 3: Antigravity Agent Manager ─── */}
      <section className="shell-section">
        <span className="demo-label">Antigravity Agent Manager</span>
        <AgentManager />
      </section>

      {/* ─── Section 4: Claude Imagine Canvas ─── */}
      <section className="shell-section">
        <span className="demo-label">Claude Imagine Canvas</span>
        <ClaudeImagineCanvas />
      </section>

      {/* ─── Section 5: Chat Bubble (dark glass) ─── */}
      <section className="shell-section">
        <span className="demo-label">Claude Imagine Chat Bubble</span>
        <ChatBubble />
        <div className="imagine-chat-bar" style={{ maxWidth: 600, margin: '12px auto 0' }}>
          <input className="imagine-input" placeholder="What do you want to build?" defaultValue="Imagine William Shakespeare's computer" />
          <span className="imagine-btn"><PaperclipIcon /></span>
          <span className="imagine-btn send-btn"><SendIcon /></span>
        </div>
      </section>
    </div>
  )
}
