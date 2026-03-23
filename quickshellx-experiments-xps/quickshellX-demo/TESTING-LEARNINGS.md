# QuickshellX Demo — Learnings from Testing

**Date:** 2026-03-14

## Environment

- niri compositor on Fedora 44 (Atomic/Silverblue)
- QuickshellX built in `quickshellx-build` toolbox from `~/quickshellX`
- React/Vite app at `~/raycast-demo` serving on `localhost:5173/launcher`

## What Worked

1. **WebEngineView renders inside QuickshellX** — React app loads and renders correctly
2. **Transparent backgrounds** — both QML (`color: "transparent"`) and WebEngine (`backgroundColor: "transparent"`) work, compositor shows through
3. **`ext-background-effect-v1` compositing** — niri's blur protocol works with the transparent surface; CSS only needs `rgba` opacity/tint, no `backdrop-filter` needed
4. **Vite HMR** — hot module reload works inside the WebEngineView, CSS/JS changes reflect instantly
5. **Keyboard input** — search field receives focus and keystrokes
6. **Mouse interaction** — hover selection on list items works
7. **SF Pro font** — loads from system fonts (`/usr/share/fonts/url-fonts/Apple-SF/`)
8. **Layer-shell overlay** — `PanelWindow` with `WlrLayershell.layer: WlrLayer.Overlay` floats above all windows
9. **Rounded corners via QML clip** — wrapping WebEngineView in `Rectangle { radius: 12; clip: true }` clips Chromium's rendering to the rounded shape. The window is sized slightly larger than the panel (12px padding each side) to give the corners room to render.

## Issues Encountered

### 1. FloatingWindow tiles in niri
**Problem:** `FloatingWindow` (xdg-toplevel) gets tiled by niri like any regular window. Toggle-floating untiles the whole window but it's not shell-like behavior.
**Fix:** Use `PanelWindow` with layer-shell properties instead. Layer-shell surfaces bypass the compositor's tiling/window management entirely.

### 2. Layer-shell surface blocks input in its full bounds
**Problem:** A `PanelWindow` that is larger than its visible content (e.g., 720px window with 680px glass panel) creates a transparent-but-input-blocking border. Everything under the surface is unclickable, even if pixels are transparent.
**Fix:** Size the window to exactly match the content. Set `implicitWidth`/`implicitHeight` to the panel dimensions. When rounded corners require padding (see #5), keep the padding minimal (12px per side) and accept the small dead zone, or use `mask: Region {}` for pixel-perfect input regions.

### 3. `anchors.centerIn` doesn't exist on PanelWindow
**Problem:** `PanelWindow { anchors.centerIn: true }` fails — `Cannot assign to non-existent property "centerIn"`. PanelWindow uses layer-shell anchoring, not QML Item anchors.
**Fix:** Remove it. A PanelWindow with no anchors set defaults to centered on the screen (layer-shell behavior).

### 4. `width`/`height` deprecated on PanelWindow/FloatingWindow
**Problem:** Setting `width: 720` emits: `Setting 'width' is deprecated. Set 'implicitWidth' instead.`
**Fix:** Use `implicitWidth` and `implicitHeight`.

### 5. Rounded corners — solved with QML clip
**Problem:** The glass panel CSS has `border-radius: 12px`, but Wayland surfaces (`wl_surface`) are always rectangular. When the panel fills the surface edge-to-edge, corners are clipped square.
**Fix:** Wrap the WebEngineView in a QML `Rectangle` with `radius` and `clip: true`. The window is sized slightly larger (704x504) with the clipped rectangle (680x480) centered inside. The transparent padding gives the CSS border-radius room to render, and QML's clip masks Chromium's output to the rounded shape.

```qml
Rectangle {
    anchors.centerIn: parent
    width: 680; height: 480
    radius: 12
    color: "transparent"
    clip: true

    WebEngineView {
        anchors.fill: parent
        backgroundColor: "transparent"
        // ...
    }
}
```

### 6. WebEngineView allows zoom by default
**Problem:** Ctrl+scroll and Ctrl+plus/minus zoom the web content inside the WebEngineView. This is browser behavior, not appropriate for a shell widget.
**Fix:** Block zoom events in JavaScript:
```javascript
window.addEventListener('wheel', (e) => { if (e.ctrlKey) e.preventDefault() }, { passive: false })
window.addEventListener('keydown', (e) => {
  if (e.ctrlKey && (e.key === '+' || e.key === '-' || e.key === '=')) e.preventDefault()
})
```

### 7. pkill timing with toolbox processes
**Problem:** `pkill -f "quickshell"` can accidentally kill the host's vanilla quickshell (your running shell). The toolbox-launched process has a different process tree.
**Fix:** Use a more specific pattern like `pkill -f "quickshellX/build-webengine"` or track the PID explicitly.

## Current Configuration

### shell.qml
```qml
//@ pragma UseWebEngine

import Quickshell
import Quickshell.Wayland
import QtWebEngine
import QtQuick

ShellRoot {
    PanelWindow {
        id: win
        visible: true
        implicitWidth: 704
        implicitHeight: 504
        color: "transparent"
        exclusionMode: ExclusionMode.Ignore
        WlrLayershell.layer: WlrLayer.Overlay
        WlrLayershell.keyboardFocus: WlrKeyboardFocus.OnDemand

        Rectangle {
            id: frame
            anchors.centerIn: parent
            width: 680
            height: 480
            radius: 12
            color: "transparent"
            clip: true

            WebEngineView {
                id: webView
                anchors.fill: parent
                backgroundColor: "transparent"
                Component.onCompleted: {
                    webView.url = "http://localhost:5173/launcher"
                }

                settings.javascriptCanAccessClipboard: true

                onNewWindowRequested: function(request) {
                    Qt.openUrlExternally(request.requestedUrl)
                }
            }
        }
    }
}
```

### CSS overrides for embedded mode
```css
body:has(.launcher-root) {
  background: transparent;
  overflow: hidden;
  touch-action: none;
}
.launcher-root {
  position: fixed; inset: 0;
  display: flex; align-items: center; justify-content: center;
  background: transparent;
  overflow: hidden;
}
.launcher-root .glass-panel {
  width: 100%; height: 100%;
  background: rgba(10, 10, 12, 0.92);
  border-radius: 12px;
}
```

### JS zoom prevention
```javascript
// In the launcher component — block Ctrl+scroll and Ctrl+plus/minus
useEffect(() => {
  const block = (e: WheelEvent) => { if (e.ctrlKey) e.preventDefault() }
  const blockKey = (e: KeyboardEvent) => {
    if (e.ctrlKey && (e.key === '+' || e.key === '-' || e.key === '=')) e.preventDefault()
  }
  window.addEventListener('wheel', block, { passive: false })
  window.addEventListener('keydown', blockKey)
  return () => { window.removeEventListener('wheel', block); window.removeEventListener('keydown', blockKey) }
}, [])
```

## Key Takeaways

1. **Use `PanelWindow` + layer-shell for shell surfaces**, not `FloatingWindow`
2. **Size the window to match content** to avoid input-blocking dead zones
3. **`ext-background-effect-v1` blur works end-to-end** — CSS glass material composites correctly with compositor blur
4. **Vite dev server works great for development** — HMR inside WebEngineView is seamless
5. **Rounded corners work** via QML `Rectangle { radius; clip: true }` wrapping the WebEngineView
6. **Disable browser zoom** in JS — shell widgets shouldn't zoom
7. **No WebChannel needed for pure visual demos** — only needed when bridging native services to JS

## Not Yet Tested

- WebChannel with `registerObject()` for Quickshell singletons
- `QList<QObject*>` serialization over WebChannel
- Production deployment (qrc/file:// instead of localhost)
- Multi-monitor with `Variants { model: Quickshell.screens }`
- Quickshell reload behavior with WebEngineView
- Input regions (`mask: Region {}`) with WebEngineView
