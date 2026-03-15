# QuickshellX Demo — First Successful Run

**Date:** 2026-03-14

## What Was Tested

A standalone React app launcher UI rendered inside a QuickshellX `FloatingWindow` via QtWebEngine, with transparent background composited by niri.

## Stack

```
niri (Wayland compositor, ext-background-effect-v1 blur)
  └── QuickshellX (FloatingWindow, color: "transparent")
        └── QtWebEngine (WebEngineView, backgroundColor: "transparent")
              └── React/Vite dev server (localhost:5173/launcher)
                    └── Glass panel UI (CSS opacity/tint over compositor blur)
```

## Files

| File | Purpose |
|------|---------|
| `~/quickshellX-demo/shell.qml` | QML config — `FloatingWindow` with `WebEngineView` pointing at `/launcher` route |
| `~/raycast-demo/src/Launcher.tsx` | Standalone app launcher component (extracted from full demo) |
| `~/raycast-demo/src/main.tsx` | Added `/launcher` route that skips the nav bar |
| `~/raycast-demo/src/index.css` | Added `.launcher-root` styles — transparent body, centered panel, no scrollbar |

## QML Config

```qml
//@ pragma UseWebEngine

import Quickshell
import QtWebEngine
import QtQuick

ShellRoot {
    FloatingWindow {
        id: win
        visible: true
        implicitWidth: 720
        implicitHeight: 520
        color: "transparent"

        WebEngineView {
            id: webView
            anchors.fill: parent
            backgroundColor: "transparent"
            Component.onCompleted: {
                webView.url = "http://localhost:5173/launcher"
            }

            onNewWindowRequested: function(request) {
                Qt.openUrlExternally(request.requestedUrl)
            }
        }
    }
}
```

## How To Run

Terminal 1 — Vite dev server:
```bash
cd ~/raycast-demo && npm run dev
```

Terminal 2 — QuickshellX (from toolbox):
```bash
toolbox run -c quickshellx-build ~/quickshellX/build-webengine/src/quickshell -p ~/quickshellX-demo/shell.qml
```

## Results

- QuickshellX launched and loaded the web content successfully
- Transparent background worked — the compositor's wallpaper/windows were visible behind the glass panel
- The glass material effect (CSS `rgba` opacity + tint) composites correctly with niri's `ext-background-effect-v1` blur protocol — no `backdrop-filter` needed on the web side, the compositor handles the gaussian blur natively
- Vite HMR works — changes to the React code hot-reload inside the WebEngineView
- Keyboard input works (search field received focus and keystrokes)
- Mouse hover/selection on list items works

## Observations

- `FloatingWindow` creates an xdg-toplevel (regular window managed by the compositor). For a real launcher, use `PanelWindow` with layer-shell overlay to float above all windows without decorations.
- `width`/`height` on `FloatingWindow` emit deprecation warnings — use `implicitWidth`/`implicitHeight` instead.
- No WebChannel was needed for this demo since no native services were bridged. WebChannel integration is the next step for connecting Pipewire, MPRIS, etc. to the JS side.
- The `body:has(.launcher-root)` CSS selector makes the HTML body transparent only on the `/launcher` route, leaving the full demo app intact on other routes.

## What This Proves

The full architecture is viable: web technologies (React/SolidJS + CSS) can render desktop shell UI inside Wayland layer-shell surfaces managed by Quickshell, with the compositor providing native blur behind transparent surfaces. No Electron. No embedded browser chrome. Just a QML window with a WebEngineView.

## Next Steps

1. Switch to `PanelWindow` with layer-shell overlay for real launcher behavior
2. Wire up WebChannel to expose Quickshell services (Pipewire, MPRIS, etc.) to JS
3. Test `QList<QObject*>` serialization over WebChannel (see WEBENGINE_INTEGRATION.md section 10)
4. Build production bundle (qrc or file:// instead of localhost dev server)
5. Port from React to SolidJS for the actual shell
