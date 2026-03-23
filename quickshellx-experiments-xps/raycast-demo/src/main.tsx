import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import ShellPage from './ShellPage.tsx'
import DesignSystem from './DesignSystem.tsx'
import Launcher from './Launcher.tsx'
import EmbedAppLauncher from './embeds/EmbedAppLauncher.tsx'
import EmbedCommandPalette from './embeds/EmbedCommandPalette.tsx'
import EmbedWindowManager from './embeds/EmbedWindowManager.tsx'
import EmbedClipboard from './embeds/EmbedClipboard.tsx'
import EmbedNotes from './embeds/EmbedNotes.tsx'
import EmbedMixed from './embeds/EmbedMixed.tsx'
import EmbedTopBar from './embeds/EmbedTopBar.tsx'
import EmbedWifi from './embeds/EmbedWifi.tsx'
import EmbedSpotlight from './embeds/EmbedSpotlight.tsx'
import EmbedAgent from './embeds/EmbedAgent.tsx'
import EmbedCanvas from './embeds/EmbedCanvas.tsx'
import EmbedDesign from './embeds/EmbedDesign.tsx'

function Nav() {
  const { pathname } = useLocation()
  if (pathname === '/launcher' || pathname.startsWith('/embed/')) return null
  return (
    <nav style={{
      position: 'fixed', top: 12, left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999, display: 'flex', gap: 4, padding: 4,
      background: 'rgba(10,10,12,0.8)', backdropFilter: 'blur(20px)',
      borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)',
      fontFamily: 'Inter, system-ui', fontSize: 12,
    }}>
      {[
        { to: '/', label: 'Launchers' },
        { to: '/shell', label: 'Shell + Canvas' },
        { to: '/design', label: 'Design System' },
      ].map(({ to, label }) => (
        <NavLink key={to} to={to} end style={({ isActive }) => ({
          padding: '6px 14px', borderRadius: 7, color: '#aaa', textDecoration: 'none',
          background: isActive ? 'rgba(255,255,255,0.06)' : 'transparent',
        })}>{label}</NavLink>
      ))}
    </nav>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Nav />
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/shell" element={<ShellPage />} />
        <Route path="/design" element={<DesignSystem />} />
        <Route path="/launcher" element={<Launcher />} />
        {/* Embedded routes for QuickshellX windows */}
        <Route path="/embed/app-launcher" element={<EmbedAppLauncher />} />
        <Route path="/embed/command-palette" element={<EmbedCommandPalette />} />
        <Route path="/embed/window-manager" element={<EmbedWindowManager />} />
        <Route path="/embed/clipboard" element={<EmbedClipboard />} />
        <Route path="/embed/notes" element={<EmbedNotes />} />
        <Route path="/embed/mixed" element={<EmbedMixed />} />
        <Route path="/embed/shell/topbar" element={<EmbedTopBar />} />
        <Route path="/embed/shell/wifi" element={<EmbedWifi />} />
        <Route path="/embed/shell/spotlight" element={<EmbedSpotlight />} />
        <Route path="/embed/shell/agent" element={<EmbedAgent />} />
        <Route path="/embed/shell/canvas" element={<EmbedCanvas />} />
        <Route path="/embed/design" element={<EmbedDesign />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
