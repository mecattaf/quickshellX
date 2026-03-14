# QuickshellX: QtWebEngine + QtWebChannel Integration Plan (v2.1)

## What This Document Is

A complete technical reference for adding QtWebEngine and QtWebChannel support to Quickshell, enabling web-based desktop shell UIs (SolidJS/TypeScript/CSS) that communicate with native Linux desktop services via WebChannel.

**v2 changes:** Redesigned based on API verification against Qt 6.6–6.8 and analysis of [PR #351](https://github.com/quickshell-mirror/quickshell/pull/351). The v1 plan proposed C++ subclassing of `QQuickWebEngineView` and a custom `QWebChannel` wrapper — both are invalid. `QQuickWebEngineView` is a private class (`_p.h` header, no ABI guarantees). WebChannel on the Quick side uses `QQmlWebChannel`, not `QWebChannel`, and must be wired via QML properties. v2 eliminates all custom C++ QML types and uses Qt's own QML types directly.

**v2.1 changes:** Incorporated findings from external scrutiny. Fixed registration timing race condition in QML example (section 3.1). Clarified `values` property type after source verification (section 4). Added runtime dependency notes (section 7). Added performance caveat for initial WebChannel handshake (section 5). Added notes on reload safety for singleton references (section 6).

**Critical discovery from PR #351:** Chromium's memory allocator conflicts with jemalloc. Quickshell enables jemalloc by default (`boption(USE_JEMALLOC)`). WebEngine crashes immediately with jemalloc active (`SEGV_MAPERR` in `base::internal::BindStateHolder::IsCancelled()`). **WebEngine requires `-DUSE_JEMALLOC=OFF` or the REQUIRES chain must enforce mutual exclusion.** See section 2.7.

---

## 1. Architecture Overview

### What the integration provides

A full Linux desktop shell where all UI is web technology (SolidJS) rendered inside transparent Wayland layer-shell surfaces managed by Quickshell. Native services (PipeWire, MPRIS, UPower, BlueZ, NetworkManager, etc.) are bridged to JavaScript via Qt WebChannel's internal Chromium IPC transport.

### What Quickshell already provides (unchanged)

| Layer | Components |
|-------|-----------|
| Windows | `PanelWindow` (layer-shell), `FloatingWindow` (xdg-toplevel), `mask: Region {}` (input regions) |
| Multi-monitor | `Variants` with `Quickshell.screens` model |
| Services | PipeWire, MPRIS, UPower, SystemTray, Bluetooth, NetworkManager, Notifications, Greetd, PAM, Polkit |
| Transparency | `QQuickWindow::setDefaultAlphaBuffer(true)`, premultiplied alpha in `ProxyWindowBase::setColor()` |

### What this integration adds

1. **Build system** — `boption(WEBENGINE)`, conditional `find_package`, link `Qt6::WebEngineQuick` into the launch target
2. **Launch changes** — `UseWebEngine` pragma, `QtWebEngineQuick::initialize()` call, `qArgC` fix
3. **No new C++ QML types** — users import `QtWebEngine` and `QtWebChannel` directly from Qt

### Why no C++ wrapper types

The v1 plan proposed `ShellWebEngineView` (subclassing `QQuickWebEngineView`) and `ShellChannel` (wrapping `QWebChannel`). Research invalidated both:

| v1 assumption | Reality |
|---------------|---------|
| `QQuickWebEngineView` can be subclassed | Header is `qquickwebengineview_p.h` (private). No ABI guarantees between Qt minor versions. |
| `setBackgroundColor()` exists as a C++ method | QML property only. Use `backgroundColor: "transparent"` in QML. |
| Can get `QWebEnginePage*` from `QQuickWebEngineView` | No public API. Internals use `WebContentsAdapter`, not `QWebEnginePage`. |
| WebChannel goes through `QWebEnginePage::setWebChannel()` | For Quick, use the `webChannel` QML property on `WebEngineView`. Takes `QQmlWebChannel*`, not `QWebChannel*`. |
| `QWebChannel` is the right C++ type | QML side uses `QQmlWebChannel` (from `import QtWebChannel`). |

Since everything works through QML properties, no C++ wrapper is needed. The user writes QML that uses Qt's types directly.

---

## 2. Exact Changes Required

### 2.1 File Inventory

```
MODIFIED (5 files, ~25 lines changed)
├── CMakeLists.txt              — +1 boption, +1 conditional find_package component, +jemalloc check
├── src/CMakeLists.txt          — (no change needed — no new subdirectory)
├── src/build/build.hpp.in      — +1 #define WEBENGINE
├── src/build/CMakeLists.txt    — +4 lines (WEBENGINE_DEF logic)
├── src/launch/CMakeLists.txt   — +3 lines (conditional Qt::WebEngineQuick link)
└── src/launch/launch.cpp       — +10 lines (pragma, qArgC fix, initialize() call)

NEW FILES: 0
NEW DIRECTORIES: 0
```

### 2.2 Root CMakeLists.txt

**Add boption** — after line 83 (`boption(NETWORK "Network" ON)`):

```cmake
boption(WEBENGINE "WebEngine" ON)
```

**Add conditional find_package component** — after line 137 (`list(APPEND QT_FPDEPS DBus)` inside the DBUS block), before line 140 (`find_package`):

```cmake
if (WEBENGINE_effective)
    list(APPEND QT_FPDEPS WebEngineQuick)
endif()
```

Note: only `WebEngineQuick` is needed here, not `WebChannel`. The QML engine loads `QtWebChannel` dynamically as a QML plugin when the user writes `import QtWebChannel`. The `WebEngineQuick` component is needed because `launch.cpp` calls `QtWebEngineQuick::initialize()` which requires the library to be linked.

### 2.3 src/build/build.hpp.in

**Add flag** — after the `CRASH_HANDLER` define:

```cpp
#define WEBENGINE @WEBENGINE_DEF@
```

This follows the existing pattern where `CRASH_HANDLER` is defined as 0 or 1 via CMake's `configure_file`.

### 2.4 src/build/CMakeLists.txt

**Add WEBENGINE_DEF logic** — after the CRASH_HANDLER block (lines 12–16):

```cmake
if (WEBENGINE)
    set(WEBENGINE_DEF 1)
else()
    set(WEBENGINE_DEF 0)
endif()
```

### 2.5 src/launch/CMakeLists.txt

**Add conditional link** — after the existing `target_link_libraries` calls:

```cmake
if (WEBENGINE)
    target_link_libraries(quickshell-launch PRIVATE Qt::WebEngineQuick)
endif()
```

This makes the `QtWebEngineQuick::initialize()` symbol available to launch.cpp.

### 2.6 src/launch/launch.cpp

Three changes to this file:

**1. Add conditional include** — after line 30 (after `#endif` of the CRASH_HANDLER include block):

```cpp
#if WEBENGINE
#include <qtwebenginequickglobal.h>
#endif
```

Uses `#if WEBENGINE` (numeric comparison) matching the `#if CRASH_HANDLER` pattern at line 30.

**2. Add pragma field and parsing** — add `bool useWebEngine = false;` to the pragmas struct (lines 72–82), after `bool useSystemStyle = false;` at line 76:

```cpp
bool useWebEngine = false;
```

Add parsing branch in the pragma chain (before the final `else { qCritical() ... }` at line 115):

```cpp
else if (pragma == "UseWebEngine") pragmas.useWebEngine = true;
```

Naming follows the `UseQApplication` convention.

**3. Fix qArgC and call initialize()** — replace line 226 (`auto qArgC = 0;`) with:

```cpp
auto qArgC = 1; // argv[0] must be valid; Chromium requires it, Qt won't consume it

#if WEBENGINE
if (pragmas.useWebEngine) {
    QtWebEngineQuick::initialize();
}
#endif
```

**Why `qArgC = 1` unconditionally:** `argv[0]` is always the program name — verified in source: `launch()` receives `char** argv` from `main()`, so `argv[0]` is always the real program path. Qt doesn't consume it. The original `qArgC = 0` prevented Qt from reading any args, but also caused Chromium to fail on subprocess spawning. This is safe for all shells. PR #351 validated this change.

**Why `QtWebEngineQuick::initialize()` before `QGuiApplication`:** Qt docs across 6.2–6.10 are unambiguous: "This has to be done before QGuiApplication is created." It sets up OpenGL context sharing for Chromium. Calling it after QGuiApplication emits a deprecation warning and may crash in future Qt versions.

**Why pragma-gated:** `initialize()` adds ~50ms startup and loads Chromium's GPU process. Shells not using WebEngine shouldn't pay this cost.

### 2.7 jemalloc Mutual Exclusion (CRITICAL)

**Problem:** Chromium ships its own memory allocator (PartitionAlloc). When Quickshell is built with jemalloc (`-DUSE_JEMALLOC=ON`, the default), Chromium's allocator conflicts with jemalloc, causing an immediate SEGFAULT in the Chromium event loop (`base::internal::BindStateHolder::IsCancelled()`).

This was discovered and confirmed in [PR #351](https://github.com/quickshell-mirror/quickshell/pull/351#issuecomment-4013261180) by @WeraPea: "I had run into the same issue, had to compile quickshell without jemalloc to fix it." The maintainer @outfoxxed confirmed disabling jemalloc fixes it.

**Solution — CMake hard error (Option B):**

```cmake
if (WEBENGINE AND USE_JEMALLOC)
    message(FATAL_ERROR "WEBENGINE and USE_JEMALLOC are incompatible. "
        "Chromium's PartitionAlloc conflicts with jemalloc. "
        "Set -DUSE_JEMALLOC=OFF to use WebEngine.")
endif()
```

Place this after the `boption()` declarations are resolved, before `find_package`. The boption defaults ON, and we require `-DUSE_JEMALLOC=OFF`. Clean and explicit.

### 2.8 Build Configuration for QuickshellX

QuickshellX is a fork — upstream's "no hard dependency" constraint does not apply. We link `Qt::WebEngineQuick` directly (no dynamic loading via `QLibrary::resolve()` with mangled symbols as PR #351 did).

Default build: WebEngine ON, jemalloc OFF:
```bash
cmake -GNinja -DCMAKE_BUILD_TYPE=Release -DUSE_JEMALLOC=OFF ..
```

The `qArgC = 0` → `qArgC = 1` change is unconditional and safe for all configurations (validated by upstream maintainer: "Changing qArgC is fine").

---

## 3. QML Usage (User-Space)

No custom Quickshell QML types are needed. The user imports Qt's own modules directly.

### 3.1 Shell Config (shell.qml)

**Important: Registration timing.** Qt docs state that objects must be registered on a `WebChannel` before any client initializes. The URL on the `WebEngineView` must be set **after** all `registerObject()` calls complete, not declaratively. If the URL is set declaratively, there is a race: `Component.onCompleted` ordering between siblings is not guaranteed by Qt, and a cached or small page could initialize its JS client before registration finishes.

The fix is to set the URL imperatively inside `Component.onCompleted`, after all registrations:

```qml
//@ pragma UseWebEngine

import Quickshell
import QtWebEngine
import QtWebChannel
import Quickshell.Services.Pipewire
import Quickshell.Services.Mpris
import Quickshell.Services.UPower
import Quickshell.Services.SystemTray
import Quickshell.Services.Notifications
import Quickshell.Bluetooth
import Quickshell.Networking

ShellRoot {
    NotificationServer { id: notifServer }

    Variants {
        model: Quickshell.screens
        delegate: PanelWindow {
            property var modelData
            screen: modelData
            anchors.top: true
            anchors.left: true
            anchors.right: true
            height: 32
            color: "transparent"
            exclusionMode: ExclusionMode.Auto

            WebChannel {
                id: channel
                Component.onCompleted: {
                    // registerObject() is inherited from QWebChannel (Q_INVOKABLE)
                    // QML singletons resolve to QObject* when passed to methods
                    channel.registerObject("audio", Pipewire)
                    channel.registerObject("media", Mpris)
                    channel.registerObject("power", UPower)
                    channel.registerObject("tray", SystemTray)
                    channel.registerObject("bluetooth", Bluetooth)
                    channel.registerObject("network", Networking)
                    channel.registerObject("notifications", notifServer)

                    // Load URL AFTER all objects are registered — eliminates race condition
                    // where JS client could initialize before registerObject() completes
                    webView.url = "http://localhost:5173/bar"
                }
            }

            WebEngineView {
                id: webView
                anchors.fill: parent
                backgroundColor: "transparent"  // QML property — evaluated before any URL loads
                webChannel: channel              // QML property — wires internal Chromium IPC transport
                // url is set imperatively in WebChannel.onCompleted above
            }
        }
    }
}
```

**NEEDS TESTING:** Passing QML singletons (like `Pipewire`, `Mpris`) to `registerObject()`. These singletons inherit from `Singleton` -> `Reloadable` -> `QObject`, so they should resolve to valid `QObject*` when passed to a `Q_INVOKABLE` method. However, this has not been verified empirically. If it doesn't work, a QML-side wrapper may be needed.

### 3.2 JavaScript Side (SolidJS)

```typescript
// qwebchannel.js is available at qrc:///qtwebchannel/qwebchannel.js
// when running inside QtWebEngine (no external file needed)
import QWebChannel from "qwebchannel";

// qt.webChannelTransport is automatically injected by QtWebEngine
// when the webChannel property is set on WebEngineView — no WebSocket needed
const channel = new QWebChannel(qt.webChannelTransport, (ch) => {
    const audio = ch.objects.audio;       // Pipewire singleton (QObject proxy)
    const power = ch.objects.power;       // UPower singleton

    // Direct property access on QObject proxies
    console.log(audio.defaultAudioSink.description);  // nested QObject auto-proxied
    console.log(power.onBattery);

    // Signal connections for reactive updates
    audio.defaultAudioSink.audio.volumeChanged.connect(() => {
        updateVolumeUI(audio.defaultAudioSink.audio.volume);
    });

    // Q_INVOKABLE method calls
    const media = ch.objects.media;
    // media.players is an ObjectModel (QAbstractListModel) — see section 4

    // Writable properties
    audio.defaultAudioSink.audio.muted = true;  // calls setMuted()
});
```

### 3.3 Input Regions (Click-Through)

Unchanged from v1 — uses Quickshell's existing `mask: Region {}` system:

```qml
PanelWindow {
    mask: Region {
        // Only the bar area receives mouse input; rest is click-through
        x: 0; y: 0; width: parent.width; height: 32
    }

    WebEngineView { anchors.fill: parent; /* ... */ }
}
```

Keyboard input is separate from input regions — it follows Wayland focus. Panels that need keyboard input (e.g., search bars, text fields) must set `focusable: true` or use `keyboardFocus: WlrKeyboardFocus.OnDemand`.

### 3.4 Production Deployment

The examples use `http://localhost:5173/bar` (Vite dev server). For production, the SolidJS app must be served from one of:

- **`qrc:///` resources** — compiled into the binary via Qt's resource system. Best for distribution.
- **Local file path** — `file:///path/to/dist/index.html`. Simple but path must be stable.
- **Persistent local HTTP server** — e.g., a bundled static file server. Most flexible for development.

This is a shell-author concern, not a fork code change.

---

## 4. ObjectModel Over WebChannel — Known Limitation

### The Problem

Quickshell's service singletons expose collections as `ObjectModel<T>` (a `QAbstractListModel` subclass). Examples: `Pipewire.nodes`, `Mpris.players`, `SystemTray.items`.

**QWebChannel does NOT auto-serialize QAbstractListModel rows.** It exposes the model's QObject API surface (properties, signals, slots), not its data. So `channel.objects.audio.nodes` on the JS side gives you a QObject proxy for the model object — but you cannot iterate its rows with `.forEach()` or index with `[0]`.

### What Does Work

`UntypedObjectModel` (the base class in `src/core/model.hpp`) has:

| Member | Type | Description |
|--------|------|-------------|
| `values` | `Q_PROPERTY(QList<QObject*>)` | Returns all objects as a list. NOTIFY: `valuesChanged`. |
| `indexOf(obj)` | `Q_INVOKABLE` | Returns index of an object. |
| `objectInsertedPost` | Signal | Emitted after an object is inserted (with object + index). |
| `objectRemovedPost` | Signal | Emitted after an object is removed (with object + index). |
| `valuesChanged` | Signal | Emitted on any content change. |

**Source-verified:** The `values` property is declared as `Q_PROPERTY(QList<QObject*> values READ values NOTIFY valuesChanged)` in `src/core/model.hpp:45`. This is a real `QList<QObject*>`, NOT a `QQmlListProperty`. (There are separate `valuesCount`/`valueAt` helpers for QML list access, but the Q_PROPERTY itself returns `QList<QObject*>`.)

### Strategy: Use `values` Property

The `values` property returns `QList<QObject*>`. WebChannel should proxy this as an array of QObject proxies. Each element is a full QObject with properties and signals.

```typescript
const channel = new QWebChannel(qt.webChannelTransport, (ch) => {
    const audio = ch.objects.audio;

    // Access model contents via .values property
    const nodes = audio.nodes.values;  // QList<QObject*> → array of proxies

    // Each node is a proxied QObject with full property access
    nodes.forEach(node => {
        console.log(node.name, node.description, node.audio.volume);
    });

    // React to model changes
    audio.nodes.valuesChanged.connect(() => {
        const updatedNodes = audio.nodes.values;
        rebuildNodeList(updatedNodes);
    });

    // Fine-grained: react to individual insertions/removals
    audio.nodes.objectInsertedPost.connect((object, index) => {
        addNodeToUI(object, index);
    });

    audio.nodes.objectRemovedPost.connect((object, index) => {
        removeNodeFromUI(index);
    });
});
```

### NEEDS TESTING: `QList<QObject*>` Serialization Over WebChannel

**The property type is correct (`QList<QObject*>`), but whether WebChannel's JSON transport serializes it correctly is unverified.** It may serialize as an empty array, an array of null, or fail silently. This is the highest-priority test item.

**Fallback approach (implement only if testing shows `values` doesn't serialize):** Add a `Q_INVOKABLE QVariantList valuesAsVariant()` method to `UntypedObjectModel` that wraps each `QObject*` in a `QVariant`. This is a ~5-line change to `src/core/model.hpp`:

```cpp
Q_INVOKABLE QVariantList valuesAsVariant() const {
    QVariantList result;
    for (auto* obj : this->valuesList) {
        result.append(QVariant::fromValue(obj));
    }
    return result;
}
```

WebChannel can serialize `QVariantList` containing `QObject*` values — each becomes a proxied object on the JS side.

---

## 5. Nested QObject Properties — How They Work Over WebChannel

WebChannel **does** auto-proxy nested `QObject*` properties. This is confirmed by Qt docs: when a published QObject has a `Q_PROPERTY` returning `QObject*`, WebChannel wraps the child object as a proxy on the JS side.

Example chain that works:

```
Pipewire (registered) → defaultAudioSink (PwNodeIface*) → audio (PwNodeAudioIface*) → volume (float)
```

In JavaScript: `audio.defaultAudioSink.audio.volume` — each `.` traversal follows a `Q_PROPERTY(QObject*)` with a NOTIFY signal, and WebChannel creates nested proxies automatically.

**Requirements for auto-proxying:**
- Each property must be `Q_PROPERTY` with a return type of `QObject*` (or subclass)
- Each property must have a `NOTIFY` signal for change detection
- Properties marked `CONSTANT` are read once and cached

All of Quickshell's service singletons already satisfy these requirements.

**NEEDS TESTING:** Verify specific property chains needed for the shell (e.g., `PwNode.audio.volume` — is `audio` a `Q_PROPERTY(QObject*)` with a NOTIFY signal?). Each object in the chain must be QObject-based with proper Q_PROPERTY declarations. Quickshell's services generally use the `DBusPropertyGroup` pattern which satisfies this, but verify the specific chains you need.

**Performance caveat:** The initial WebChannel handshake serializes the full object graph to the JS client. If services have deep/wide object trees (e.g., `Pipewire` with dozens of nodes, each with audio properties), the initial payload could be large and slow. Ongoing updates are batched efficiently (default: 50ms interval). Monitor the initial connection time with DevTools Network tab if it seems sluggish.

---

## 6. Reload Lifecycle

### What Happens on Quickshell Reload

1. New `EngineGeneration` created with fresh `QQmlEngine`
2. Root QML component loaded — new `WebEngineView` instances created
3. Old generation's `destroy()` called — deletes old QML tree including old `WebEngineView` instances
4. Chromium renderer processes tied to destroyed views are cleaned up by Qt

### Singleton References and Reload Safety

Quickshell's singletons (Pipewire, Mpris, etc.) are tied to `EngineGeneration`. After a hot reload, singleton instances are recreated. If WebChannel held a reference to the old singleton, it would be a dangling pointer.

**This is safe in practice** because the entire QML tree — including the `WebChannel` and its `registerObject()` bindings — is destroyed and recreated during reload. The new `WebChannel` in the new QML tree registers the new singleton instances. There is no cross-generation reference leakage as long as the `WebChannel` is declared inside the delegate (which it is in the example above).

### Risk: Chromium Process Leaks

WebEngine manages Chromium processes internally. When a `QQuickWebEngineView` is destroyed, its associated renderer process should be terminated. However:

- The GPU process is shared and may persist across reloads (this is normal)
- Renderer process cleanup may be asynchronous — brief overlap during reload
- No explicit cleanup hook is needed in the Quickshell plugin system since we have no custom C++ types

**Mitigation:** Monitor with `ps aux | grep -i chromium` during reloads. If leaks occur, a custom `QsEnginePlugin` with an `onReload()` hook can be added to force cleanup.

---

## 7. Build System

### 7.1 Fedora Spec Additions

```spec
BuildRequires:      cmake(Qt6WebEngineQuick)
# Qt6WebChannel is loaded as a QML plugin at runtime — no build dep needed
# but must be present at runtime
Requires:           qt6-qtwebchannel
```

The `qt6-qtwebchannel` runtime dependency is needed because `import QtWebChannel` in QML loads it as a plugin. Without it, the import fails silently or with a cryptic "module not found" error.

### 7.2 CMake Invocation

Default (WebEngine ON):
```bash
cmake -GNinja -DCMAKE_BUILD_TYPE=Release -DUSE_JEMALLOC=OFF ..
```

Note: `-DUSE_JEMALLOC=OFF` is required when WebEngine is ON (see section 2.7). The CMake configuration will emit a `FATAL_ERROR` if both are enabled.

Without WebEngine:
```bash
cmake -GNinja -DCMAKE_BUILD_TYPE=Release -DWEBENGINE=OFF ..
```

### 7.3 Compile Definitions

When `WEBENGINE=ON`:
- `build.hpp` defines `WEBENGINE` as `1` (via `configure_file`)
- `launch.cpp` uses `#if WEBENGINE` to guard the include and initialize() call
- Consistent with existing `#if CRASH_HANDLER` pattern

---

## 8. Memory and Performance Considerations

### Per-WebEngineView Overhead

| Process | Memory | Lifetime |
|---------|--------|----------|
| GPU process | ~30–50 MB | Shared across all views, persists while any view exists |
| Renderer process | ~50–150 MB | One per `WebEngineView` instance |
| Utility process | ~10 MB | One per WebEngine profile |

### Multi-Monitor Impact

With `Variants { model: Quickshell.screens }`, each monitor gets its own `WebEngineView`. For 4 monitors:

- 4 renderer processes: ~200–600 MB
- 1 GPU process: ~30–50 MB
- Total: ~250–650 MB for Chromium alone

### Recommendations

1. **One `WebEngineView` per monitor** — use client-side routing in SolidJS to render different components (bar, dock, notifications) within a single view
2. **Lazy loading** — don't create `WebEngineView` for surfaces that aren't visible (e.g., notification popups)
3. **Share WebEngine profile** — reduces utility process overhead

---

## 9. Security Considerations

WebChannel exposes QObject interfaces to JavaScript. The web content has full access to all registered objects — including ability to change audio volume, control media players, manage Bluetooth devices, etc.

**This is by design** — the shell UI needs this access. However:

- Only load trusted content (localhost dev server or bundled HTML)
- Do not load arbitrary URLs in shell `WebEngineView` instances
- WebEngine's Chromium sandbox may need `--no-sandbox` on some Wayland setups — test this
- Consider restricting `webChannelWorld` to isolate the channel from userscripts

---

## 10. Testing Requirements

These must be verified empirically. Items marked "blocking" must pass before the integration is usable.

| # | Test | Method | Blocking? |
|---|------|--------|-----------|
| 1 | QML singleton passing to `registerObject()` | Call `channel.registerObject("test", Pipewire)` from QML, verify JS receives a proxy | Yes — fundamental to the architecture |
| 2 | `QList<QObject*>` serialization over WebChannel | Register an ObjectModel via WebChannel, access `.values` from JS, check if array of proxies | Yes — determines if fallback `valuesAsVariant()` is needed |
| 3 | Transparent background with `backgroundColor: "transparent"` | Set property in QML, verify compositor shows through | Yes — core visual requirement |
| 4 | jemalloc disabled, WebEngine loads without crash | Build with `-DUSE_JEMALLOC=OFF -DWEBENGINE=ON`, load a WebEngineView | Yes — PR #351 showed jemalloc causes SEGFAULT |
| 5 | Chromium subprocess spawning with `qArgC = 1` | Launch shell, verify DevTools work, pages render | Yes — basic functionality |
| 6 | Nested QObject property chain proxying | Access `audio.defaultAudioSink.audio.volume` from JS, verify value | Yes — needed for any useful service access |
| 7 | Deferred URL loading pattern | Verify `webView.url = ...` in `Component.onCompleted` works and objects are available in JS | Yes — validates the race condition fix |
| 8 | IME input in WebEngineView inside layer-shell surface | Type CJK characters in a web input field | No — enhancement, not blocking |
| 9 | Reload process cleanup | Trigger Quickshell reload, check for orphaned Chromium processes | No — can be addressed post-MVP |
| 10 | DevTools accessibility | Navigate to `chrome://inspect` or use remote debugging port | No — development convenience |
| 11 | Initial WebChannel handshake performance | Register a service with many child objects, measure time to `QWebChannel` callback | No — optimization, not blocking |

---

## 11. Complexity Assessment

**Overall: Low. ~25 lines changed across 5 existing files. 0 new files.**

| Component | Lines | Risk | Notes |
|-----------|-------|------|-------|
| CMake boption + find_package + jemalloc check | ~8 | Trivial | Template from existing modules |
| build.hpp.in + CMakeLists.txt | ~6 | Trivial | Follows CRASH_HANDLER pattern exactly |
| launch/CMakeLists.txt link | ~3 | Trivial | Conditional target_link_libraries |
| launch.cpp pragma + init | ~10 | Low | Validated by PR #351 and Qt docs |
| ObjectModel WebChannel compat | ~5 | Medium | May need `valuesAsVariant()` fallback — test first |

The entire integration is build system plumbing and a single `initialize()` call. All WebEngine/WebChannel functionality is Qt's own QML types used directly by the shell author.

---

## 12. Boundary Summary

```
UPSTREAM QUICKSHELL (unchanged)
├── All existing modules, services, window system, compositor integration
└── src/core/model.hpp          — may need +5 lines for valuesAsVariant() fallback

FORK CHANGES (QuickshellX)
├── CMakeLists.txt (root)        — +5 lines (boption, conditional find_package, jemalloc check)
├── src/build/build.hpp.in       — +1 line (#define WEBENGINE)
├── src/build/CMakeLists.txt     — +4 lines (WEBENGINE_DEF conditional)
├── src/launch/CMakeLists.txt    — +3 lines (conditional Qt::WebEngineQuick link)
└── src/launch/launch.cpp        — +10 lines (pragma field, parsing, qArgC, initialize)

USER-SPACE QML (shell author's config, not part of QuickshellX)
├── shell.qml                    — Uses import QtWebEngine + import QtWebChannel
└── SolidJS app                  — Uses qwebchannel.js with qt.webChannelTransport
```

The fork surface is ~23 lines of build system changes and ~10 lines of C++ in a single file. Everything else is Qt's own functionality accessed through standard QML imports.

---

## 13. Prior Art

### PR #351 — quickshell-mirror/quickshell

[PR #351](https://github.com/quickshell-mirror/quickshell/pull/351) by @just-some-entity was the first attempt at WebEngine support in upstream Quickshell. Key learnings:

- **qArgC fix validated** — changing `qArgC = 0` → `1` was accepted by maintainer
- **Pragma approach validated** — `EnableQtWebEngineQuick` pragma gating `initialize()` was the agreed pattern
- **QLibrary/dlopen was a compromise** — to avoid hard linking, they loaded `QtWebEngineQuick::initialize()` via `QLibrary::resolve()` with a mangled C++ symbol name. This is fragile and unnecessary for a fork.
- **jemalloc crash discovered** — Chromium's PartitionAlloc conflicts with jemalloc. SEGFAULT in `base::internal::BindStateHolder::IsCancelled()`. Fix: `-DUSE_JEMALLOC=OFF`.
- **PR is still open** — unmerged as of March 2026 due to the jemalloc crash and stability concerns

Our approach keeps the two validated ideas (pragma + qArgC fix) and replaces the implementation with a direct hard link (appropriate for a fork).

### fabric-webshell — Reference Implementation

[fabric-webshell](https://github.com/Fabric-Development/fabric-webshell) is a Hyprland desktop shell built on the Fabric framework (Python/GTK/WebKit). It proves the web-shell architecture is viable and performant. Key patterns we adopt:

**Bridge architecture:** Fabric exposes Python functions to JavaScript via `bridge.expose_function()`. Functions become Promise-based async calls on `window.fabric.bridge`. Our equivalent: `channel.registerObject()` in QML exposes QObject methods as Promise-based calls on `channel.objects.*`.

**Event-driven updates (native -> JS):** Fabric pushes state changes to JS by injecting custom DOM events via `run_javascript()`:
```python
def fire_event(self, name, **kwargs):
    self.run_javascript(f'window.dispatchEvent(new Event("{name}"))')
```
Our equivalent: WebChannel auto-proxies Qt signals. When `audio.defaultAudioSink.audio.volumeChanged` fires in C++, the JS proxy's `.connect()` callback fires automatically. No manual event injection needed — WebChannel handles this natively.

**Dynamic input regions from JS (InputMaskObserver pattern):** Fabric's most important pattern. A React component uses `ResizeObserver` + `MutationObserver` to track elements with class `"observe"`, collects their bounding rectangles, and pushes them to the native side every 500ms:
```typescript
// Simplified from fabric-webshell/src/components/InputMaskObserver.tsx
const rects = observedElements.map(el => el.getBoundingClientRect());
window.fabric.bridge.setInputRegions(rects);
```
The native side applies these as Cairo input regions (equivalent to `wl_surface.set_input_region()`).

**Our equivalent:** We can implement the same pattern over WebChannel. The JS side collects interactive element rects and calls a registered QML function. The QML side updates the `mask: Region {}` dynamically. This is more ergonomic than hardcoding regions in QML.

**Services exposed by fabric-webshell** (for feature parity reference):

| Service | Fabric (Python) | QuickshellX (Qt) |
|---------|-----------------|-------------------|
| Audio volume | `fabric.audio.Audio` | `Pipewire` singleton |
| Media player | `Playerctl.Player` (D-Bus MPRIS) | `Mpris` singleton |
| Notifications | `fabric.notifications.Notifications` | `NotificationServer` |
| Window manager | `fabric.hyprland.Hyprland` (IPC) | Hyprland IPC module (existing) |
| System stats | `psutil` | Not built-in — user-space JS or QML |
| Color scheme | Pywal JSON file | Not built-in — user-space |

**Tech stack:** React 19, Tailwind CSS 4, Vite 6, GSAP for animations. Our SolidJS + Tailwind stack is comparable.
