import { useState, useRef } from 'react'

/* ═══════════════════════════════════════════════
   FARAYA DESIGN SYSTEM — Component Library
   A dark-glass design system for a Wayland shell
   built on niri + ext-background-effect-v1 blur
   ═══════════════════════════════════════════════ */

// ─── Design Tokens ───
const tokens = {
  // Materials (M1–M5): opacity over compositor blur
  material: {
    m1: { bg: 'rgba(10,10,14,0.08)', border: 'rgba(255,255,255,0.03)', blur: 12 },
    m2: { bg: 'rgba(10,10,14,0.22)', border: 'rgba(255,255,255,0.05)', blur: 24 },
    m3: { bg: 'rgba(10,10,14,0.48)', border: 'rgba(255,255,255,0.06)', blur: 40 },
    m4: { bg: 'rgba(10,10,14,0.68)', border: 'rgba(255,255,255,0.07)', blur: 48 },
    m5: { bg: 'rgba(10,10,14,0.85)', border: 'rgba(255,255,255,0.09)', blur: 60 },
  },
  color: {
    text: { primary: '#d4d4d4', secondary: '#888', muted: '#555', dim: '#3a3a3a', inverse: '#111' },
    surface: { hover: 'rgba(255,255,255,0.04)', selected: 'rgba(255,255,255,0.07)', pressed: 'rgba(255,255,255,0.10)' },
    accent: { blue: '#5b8af5', green: '#4ade80', red: '#f87171', orange: '#fb923c', purple: '#a78bfa', yellow: '#facc15' },
    status: { success: '#4ade80', warning: '#fb923c', error: '#f87171', info: '#5b8af5' },
  },
  radius: { xs: 4, sm: 6, md: 8, lg: 12, xl: 16, pill: 9999 },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
  font: {
    family: "'Inter', -apple-system, system-ui, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
    size: { xs: 10, sm: 11, md: 13, lg: 15, xl: 18, xxl: 24, display: 32 },
    weight: { regular: 400, medium: 500, semibold: 600, bold: 700 },
  },
  shadow: {
    sm: '0 2px 8px rgba(0,0,0,0.3)',
    md: '0 8px 24px rgba(0,0,0,0.4), 0 0 0 0.5px rgba(255,255,255,0.03)',
    lg: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 0.5px rgba(255,255,255,0.03)',
  },
  transition: { fast: '100ms ease', normal: '150ms ease', slow: '250ms ease' },
}

// ─── Section wrapper ───
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="ds-section">
      <h2 className="ds-section-title">{title}</h2>
      <div className="ds-section-content">{children}</div>
    </div>
  )
}
function Row({ label, children, gap = 12 }: { label?: string; children: React.ReactNode; gap?: number }) {
  return (
    <div className="ds-row">
      {label && <span className="ds-row-label">{label}</span>}
      <div style={{ display: 'flex', gap, flexWrap: 'wrap', alignItems: 'flex-start' }}>{children}</div>
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MATERIAL SWATCHES (M1–M5)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function Materials() {
  return (
    <Section title="Materials (M1–M5)">
      <p className="ds-desc">Glass intensity tiers. Compositor provides blur via <code>ext-background-effect-v1</code>; shell controls opacity + tint.</p>
      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        {(['m1','m2','m3','m4','m5'] as const).map(m => {
          const mat = tokens.material[m]
          return (
            <div key={m} style={{
              width: 140, height: 180, borderRadius: tokens.radius.lg,
              background: mat.bg, border: `1px solid ${mat.border}`,
              backdropFilter: `blur(${mat.blur}px)`,
              display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
              padding: 14, gap: 4,
              boxShadow: m === 'm4' || m === 'm5' ? tokens.shadow.md : 'none',
            }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{m.toUpperCase()}</span>
              <span style={{ fontSize: 10, color: tokens.color.text.muted }}>
                {Math.round(parseFloat(mat.bg.split(',')[3]) * 100)}% opacity
              </span>
              <span style={{ fontSize: 10, color: tokens.color.text.dim }}>
                blur: {mat.blur}px
              </span>
            </div>
          )
        })}
      </div>
    </Section>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// COLOR PALETTE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function Colors() {
  return (
    <Section title="Color Tokens">
      <Row label="Text">
        {Object.entries(tokens.color.text).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 48, height: 48, borderRadius: 8, background: v, border: '1px solid rgba(255,255,255,0.08)' }} />
            <span style={{ fontSize: 10, color: tokens.color.text.muted }}>{k}</span>
            <span style={{ fontSize: 9, color: tokens.color.text.dim, fontFamily: tokens.font.mono }}>{v}</span>
          </div>
        ))}
      </Row>
      <Row label="Accent">
        {Object.entries(tokens.color.accent).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 48, height: 48, borderRadius: 8, background: v }} />
            <span style={{ fontSize: 10, color: tokens.color.text.muted }}>{k}</span>
          </div>
        ))}
      </Row>
      <Row label="Surface States">
        {Object.entries(tokens.color.surface).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 64, height: 48, borderRadius: 8, background: v, border: '1px solid rgba(255,255,255,0.06)' }} />
            <span style={{ fontSize: 10, color: tokens.color.text.muted }}>{k}</span>
          </div>
        ))}
      </Row>
    </Section>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TYPOGRAPHY
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function Typography() {
  return (
    <Section title="Typography">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { label: 'Display', size: tokens.font.size.display, weight: 700, color: '#eee' },
          { label: 'Title XL', size: tokens.font.size.xxl, weight: 600, color: '#ddd' },
          { label: 'Title', size: tokens.font.size.xl, weight: 600, color: tokens.color.text.primary },
          { label: 'Body Large', size: tokens.font.size.lg, weight: 400, color: tokens.color.text.primary },
          { label: 'Body', size: tokens.font.size.md, weight: 400, color: tokens.color.text.primary },
          { label: 'Caption', size: tokens.font.size.sm, weight: 500, color: tokens.color.text.secondary },
          { label: 'Overline', size: tokens.font.size.xs, weight: 600, color: tokens.color.text.muted, transform: 'uppercase' as const, letterSpacing: '1px' },
        ].map(t => (
          <div key={t.label} style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
            <span style={{ width: 80, fontSize: 10, color: tokens.color.text.dim, flexShrink: 0 }}>{t.size}px / {t.weight}</span>
            <span style={{ fontSize: t.size, fontWeight: t.weight, color: t.color, textTransform: t.transform, letterSpacing: t.letterSpacing }}>
              {t.label} — The quick brown fox
            </span>
          </div>
        ))}
        <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', fontFamily: tokens.font.mono, fontSize: 13, color: tokens.color.text.secondary }}>
          Monospace — <code>const shell = await launch()</code>
        </div>
      </div>
    </Section>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// BUTTONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function Buttons() {
  return (
    <Section title="Buttons">
      <Row label="Primary">
        <button className="ds-btn ds-btn-primary">Launch</button>
        <button className="ds-btn ds-btn-primary" data-hover>Launch (hover)</button>
        <button className="ds-btn ds-btn-primary" disabled>Disabled</button>
      </Row>
      <Row label="Secondary">
        <button className="ds-btn ds-btn-secondary">Settings</button>
        <button className="ds-btn ds-btn-secondary" data-hover>Settings (hover)</button>
        <button className="ds-btn ds-btn-secondary" disabled>Disabled</button>
      </Row>
      <Row label="Ghost">
        <button className="ds-btn ds-btn-ghost">Cancel</button>
        <button className="ds-btn ds-btn-ghost" data-hover>Cancel (hover)</button>
      </Row>
      <Row label="Danger">
        <button className="ds-btn ds-btn-danger">Remove</button>
      </Row>
      <Row label="Icon Buttons">
        <button className="ds-icon-btn">⚙</button>
        <button className="ds-icon-btn">🔍</button>
        <button className="ds-icon-btn">✕</button>
        <button className="ds-icon-btn active">☰</button>
      </Row>
      <Row label="Pill / Kbd">
        <span className="ds-kbd">⌘</span>
        <span className="ds-kbd">K</span>
        <span className="ds-kbd">↵</span>
        <span className="ds-kbd wide">Shift</span>
        <span className="ds-kbd wide">Tab</span>
      </Row>
    </Section>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// INPUTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function Inputs() {
  const [v1, setV1] = useState('')
  const [v2, setV2] = useState('my-workspace')
  return (
    <Section title="Input Fields">
      <Row label="Default">
        <div className="ds-field">
          <label className="ds-label">Workspace Name</label>
          <input className="ds-input" placeholder="My Workspace" value={v1} onChange={e => setV1(e.target.value)} />
        </div>
        <div className="ds-field">
          <label className="ds-label">Workspace URL</label>
          <div className="ds-input-prefix">
            <span className="ds-prefix">faraya.app/</span>
            <input className="ds-input" value={v2} onChange={e => setV2(e.target.value)} />
          </div>
        </div>
      </Row>
      <Row label="Focus / Filled / Disabled">
        <div className="ds-field"><label className="ds-label">Focused</label><input className="ds-input focus" defaultValue="My Workspace" /></div>
        <div className="ds-field"><label className="ds-label">Disabled</label><input className="ds-input" disabled defaultValue="Read only" /></div>
      </Row>
      <Row label="Search">
        <div className="ds-search-input">
          <span className="ds-search-icon">🔍</span>
          <input className="ds-input" placeholder="Search..." />
        </div>
        <div className="ds-search-input lg">
          <span className="ds-search-icon">🔍</span>
          <input className="ds-input" placeholder="Type to search applications..." />
        </div>
      </Row>
    </Section>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DROPDOWNS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function Dropdowns() {
  const [open1, setOpen1] = useState(false)
  const [open2, setOpen2] = useState(true)
  const [sel, setSel] = useState('5-25')
  return (
    <Section title="Dropdowns">
      <Row label="Closed / Open" gap={24}>
        <div style={{ position: 'relative' }}>
          <div className="ds-dropdown-trigger" onClick={() => setOpen1(!open1)}>
            <span>Select company size</span><span className="ds-chevron">▾</span>
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <div className="ds-dropdown-trigger active">
            <span>{sel}</span><span className="ds-chevron">▾</span>
          </div>
          {open2 && (
            <div className="ds-dropdown-menu">
              <div className="ds-dropdown-header">Select company size</div>
              {['Just me', '1-5', '5-25', '25-100', '100-250', '250-1000', '1000+', 'Prefer not to share'].map(o => (
                <div key={o} className={`ds-dropdown-item ${sel === o ? 'selected' : ''}`} onClick={() => setSel(o)}>
                  <span>{o}</span>
                  {sel === o && <span className="ds-check">✓</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </Row>
    </Section>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TAGS / CHIPS / BADGES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function Chips() {
  return (
    <Section title="Tags / Chips / Badges">
      <Row label="Status Badges">
        <span className="ds-badge blue">In Progress</span>
        <span className="ds-badge yellow">Todo</span>
        <span className="ds-badge green">Done</span>
        <span className="ds-badge red">Cancelled</span>
        <span className="ds-badge purple">Backlog</span>
      </Row>
      <Row label="Tags (removable)">
        <span className="ds-tag">🟢 My Workspace <button>×</button></span>
        <span className="ds-tag">🔵 Personal <button>×</button></span>
      </Row>
      <Row label="Action Pills">
        <span className="ds-pill">Project (Build in Public)</span>
        <span className="ds-pill">Framer Projects</span>
        <span className="ds-pill active">Framer Template</span>
      </Row>
      <Row label="Priority Icons">
        {['🔴','🟠','🟡','🔵','⚪'].map((e,i) => (
          <span key={i} className="ds-priority">{e}</span>
        ))}
      </Row>
    </Section>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LIST ITEMS (Linear-style issues)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function ListItems() {
  const issues = [
    { id: 'PER-08', status: '🟠', title: 'Making Linear\'s design system', project: 'Project (Build in Public)', date: 'Apr 10' },
    { id: 'PER-07', status: '🟠', title: 'Create a working prototype', project: 'Project (Build in Public)', date: 'Apr 11' },
    { id: 'PER-06', status: '⚪', title: 'Add a landing page for the design system', project: 'Project (Build in Public)', date: 'Apr 11' },
    { id: 'PER-05', status: '⚪', title: 'Add a live preview page on framer', project: 'Framer Projects', date: 'Apr 11' },
  ]
  return (
    <Section title="List Items">
      <Row label="Issue Row">
        <div className="ds-list">
          {issues.map((issue, i) => (
            <div key={issue.id} className={`ds-list-item ${i === 0 ? 'selected' : ''}`}>
              <span className="ds-list-menu">⋯</span>
              <span className="ds-list-priority">📊</span>
              <span className="ds-list-id">{issue.id}</span>
              <span className="ds-list-status">{issue.status}</span>
              <span className="ds-list-title">{issue.title}</span>
              <span className="ds-list-project">{issue.project}</span>
              <span className="ds-list-date">{issue.date}</span>
              <span className="ds-list-actions">⚙</span>
            </div>
          ))}
        </div>
      </Row>
      <Row label="Section Headers">
        <div className="ds-list" style={{ width: '100%' }}>
          <div className="ds-list-section">
            <span className="ds-list-section-icon">🟠</span>
            <span className="ds-list-section-title">In Progress</span>
            <span className="ds-list-section-count">2</span>
            <span className="ds-list-section-add">+</span>
          </div>
          <div className="ds-list-section">
            <span className="ds-list-section-icon">⚪</span>
            <span className="ds-list-section-title">Todo</span>
            <span className="ds-list-section-count">10</span>
            <span className="ds-list-section-add">+</span>
          </div>
        </div>
      </Row>
    </Section>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SIDEBAR NAVIGATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function Sidebar() {
  return (
    <Section title="Sidebar Navigation">
      <div className="ds-sidebar">
        <div className="ds-sidebar-header">
          <span>🟣 Linear</span> <span className="ds-chevron">▾</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
            <button className="ds-icon-btn sm">🔍</button>
            <button className="ds-icon-btn sm">✏️</button>
          </div>
        </div>
        <div className="ds-sidebar-item"><span>📥</span> Inbox <span className="ds-sidebar-count">22</span></div>
        <div className="ds-sidebar-item active"><span>📋</span> My Issues</div>
        <div className="ds-sidebar-divider" />
        <div className="ds-sidebar-group">Workspace</div>
        <div className="ds-sidebar-item sub"><span>👁</span> Views</div>
        <div className="ds-sidebar-item sub"><span>🗺</span> Roadmaps</div>
        <div className="ds-sidebar-item sub"><span>👥</span> Teams</div>
        <div className="ds-sidebar-divider" />
        <div className="ds-sidebar-group">Your teams <span className="ds-chevron">▾</span></div>
        <div className="ds-sidebar-item sub active"><span>🟦</span> Personal <span className="ds-chevron" style={{marginLeft: 'auto'}}>▾</span></div>
        <div className="ds-sidebar-item sub2">Issues</div>
        <div className="ds-sidebar-item sub2 active">Active</div>
        <div className="ds-sidebar-item sub2">Backlog</div>
        <div className="ds-sidebar-item sub"><span>📊</span> Projects</div>
        <div className="ds-sidebar-item sub"><span>👁</span> Views</div>
      </div>
    </Section>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GLASS PANELS (Shell components)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function GlassPanels() {
  return (
    <Section title="Glass Panels (Shell Surfaces)">
      <p className="ds-desc">Composited shell surfaces using material tiers. In production, blur comes from the Wayland compositor.</p>
      <Row label="Panel Bar (M3)">
        <div className="ds-glass-bar">
          <span style={{fontWeight: 600, fontSize: 13}}>Kitty</span>
          <span style={{fontSize: 12, color: tokens.color.text.muted}}>File</span>
          <span style={{fontSize: 12, color: tokens.color.text.muted}}>Edit</span>
          <span style={{fontSize: 12, color: tokens.color.text.muted}}>View</span>
          <div style={{flex: 1}} />
          <span style={{fontSize: 12}}>📶</span>
          <span style={{fontSize: 12}}>🔋</span>
          <span style={{fontSize: 12, fontVariantNumeric: 'tabular-nums'}}>3:42 PM</span>
        </div>
      </Row>
      <Row label="Notification (M4)">
        <div className="ds-glass-notification">
          <div style={{display: 'flex', gap: 10, alignItems: 'flex-start'}}>
            <span style={{fontSize: 20}}>💬</span>
            <div style={{flex: 1}}>
              <div style={{fontWeight: 600, fontSize: 13, marginBottom: 2}}>Discord</div>
              <div style={{fontSize: 12, color: tokens.color.text.secondary}}>New message from @tom in #general</div>
            </div>
            <span style={{fontSize: 10, color: tokens.color.text.dim}}>now</span>
          </div>
        </div>
      </Row>
      <Row label="Tooltip (M2)">
        <div className="ds-glass-tooltip">Toggle Wi-Fi</div>
        <div className="ds-glass-tooltip">
          <span className="ds-kbd" style={{fontSize: 9}}>⌘</span>
          <span className="ds-kbd" style={{fontSize: 9}}>D</span>
          Open Launcher
        </div>
      </Row>
      <Row label="Control Tile (M4)">
        <div style={{display: 'flex', gap: 8}}>
          <div className="ds-cc-tile active"><span>📶</span><span className="ds-cc-label">Wi-Fi</span></div>
          <div className="ds-cc-tile"><span>🔵</span><span className="ds-cc-label">Bluetooth</span></div>
          <div className="ds-cc-tile"><span>🌙</span><span className="ds-cc-label">DND</span></div>
          <div className="ds-cc-tile active"><span>✈️</span><span className="ds-cc-label">Airplane</span></div>
        </div>
      </Row>
    </Section>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SPACING & RADIUS REFERENCE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function SpacingRadius() {
  return (
    <Section title="Spacing & Radius">
      <Row label="Spacing Scale">
        {Object.entries(tokens.spacing).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ width: v, height: 32, background: 'rgba(90,140,255,0.2)', borderRadius: 2 }} />
            <span style={{ fontSize: 10, color: tokens.color.text.muted }}>{k}</span>
            <span style={{ fontSize: 9, color: tokens.color.text.dim }}>{v}px</span>
          </div>
        ))}
      </Row>
      <Row label="Border Radius">
        {Object.entries(tokens.radius).filter(([k]) => k !== 'pill').map(([k, v]) => (
          <div key={k} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 48, height: 48, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: v }} />
            <span style={{ fontSize: 10, color: tokens.color.text.muted }}>{k} ({v}px)</span>
          </div>
        ))}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 80, height: 32, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9999 }} />
          <span style={{ fontSize: 10, color: tokens.color.text.muted }}>pill</span>
        </div>
      </Row>
    </Section>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN PAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function DesignSystem() {
  return (
    <>
      <div className="wallpaper" />
      <div className="ds-page">
        <div className="ds-header">
          <h1 className="ds-main-title">Faraya Design System</h1>
          <p className="ds-main-desc">
            A dark-glass component library for a Wayland shell.
            Built on niri + <code>ext-background-effect-v1</code> blur protocol.
          </p>
        </div>
        <Materials />
        <Colors />
        <Typography />
        <SpacingRadius />
        <Buttons />
        <Inputs />
        <Dropdowns />
        <Chips />
        <ListItems />
        <Sidebar />
        <GlassPanels />
      </div>
    </>
  )
}
