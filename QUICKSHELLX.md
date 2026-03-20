# QuickshellX

QuickshellX is a fork of [Quickshell](https://github.com/quickshell-mirror/quickshell) that adds QtWebEngine and QtWebChannel support, enabling web-based desktop shell UIs (SolidJS/TypeScript/CSS) rendered inside Wayland layer-shell surfaces.

## Fork changes

The fork surface is minimal (~25 lines across 5 files, 0 new source files) to keep rebasing on upstream straightforward.

### Modified files

**CMakeLists.txt (root)**
- Added `boption(WEBENGINE "WebEngine" ON)` build option
- Added `FATAL_ERROR` guard: WebEngine and jemalloc are mutually exclusive (Chromium's PartitionAlloc conflicts with jemalloc, causing immediate SEGFAULT — discovered in [PR #351](https://github.com/quickshell-mirror/quickshell/pull/351))
- Added conditional `WebEngineQuick` component to `find_package(Qt6 ...)`

**src/build/build.hpp.in**
- Added `#define WEBENGINE @WEBENGINE_DEF@` compile flag (follows `CRASH_HANDLER` pattern)

**src/build/CMakeLists.txt**
- Added `WEBENGINE_DEF` conditional (0/1) for `configure_file`

**src/launch/CMakeLists.txt**
- Added conditional `target_link_libraries(quickshell-launch PRIVATE Qt::WebEngineQuick)`

**src/launch/launch.cpp**
- Added `#include <qtwebenginequickglobal.h>` (guarded by `#if WEBENGINE`)
- Added `UseWebEngine` pragma field and parsing
- Changed `qArgC = 0` to `qArgC = 1` — `argv[0]` is always the program name; Chromium requires it for subprocess spawning. This is safe for all shells (validated by upstream maintainer)
- Added pragma-gated `QtWebEngineQuick::initialize()` call before `QGuiApplication` construction

### What is NOT in the fork

Shell QML configs using WebEngine/WebChannel are user-space — they live in `~/.config/quickshell/` and import Qt's own `QtWebEngine` and `QtWebChannel` QML modules directly. No custom C++ QML types are needed.

## Building

```bash
cmake -GNinja -DCMAKE_BUILD_TYPE=Release -DUSE_JEMALLOC=OFF ..
ninja
```

`-DUSE_JEMALLOC=OFF` is required when WebEngine is ON. The build will emit `FATAL_ERROR` if both are enabled.

To build without WebEngine (identical to upstream behavior):
```bash
cmake -GNinja -DCMAKE_BUILD_TYPE=Release -DWEBENGINE=OFF ..
```

## Fedora packaging notes

The existing `quickshell-git` spec needs these additions for QuickshellX:

**BuildRequires:**
```spec
BuildRequires:  cmake(Qt6WebEngineQuick)
```

**Requires (runtime):**
```spec
Requires:       qt6-qtwebchannel
```

`qt6-qtwebchannel` is loaded as a QML plugin at runtime when the user writes `import QtWebChannel`. Without it, the import fails with a cryptic "module not found" error. The `qt6-qtwebengine` package is pulled in transitively via the `Qt6WebEngineQuick` build dependency.

**CMake flags:**
```spec
%cmake -GNinja \
    -DCMAKE_BUILD_TYPE=Release \
    -DUSE_JEMALLOC=OFF \
    -DVENDOR_CPPTRACE=OFF \
    ...
```

Note: If the existing spec uses `VENDOR_CPPTRACE=ON`, keep it. If it relies on a system `cpptrace` package, keep that too. The only new constraint is `-DUSE_JEMALLOC=OFF`.

**Conflicts:** The package should `Conflicts: quickshell` (or replace it) since both install to the same binary path. Alternatively, name the package `quickshellx` and install to a different binary name.

## Syncing with upstream

The fork touches 5 files with small, isolated changes. To pull upstream:

```bash
git remote add upstream https://github.com/quickshell-mirror/quickshell.git
git fetch upstream
git rebase upstream/master
```

Conflicts are unlikely unless upstream modifies the same lines in `launch.cpp` (pragma parsing or the `qArgC` line) or reworks the `boption()` block in the root `CMakeLists.txt`.

## Release plan

QuickshellX will make its first tagged release once upstream Quickshell merges support for `ext-background-effect-v1`. Until then, this tracks upstream master.

## Reference

See [WEBENGINE_INTEGRATION.md](WEBENGINE_INTEGRATION.md) for the full technical spec including QML usage examples, WebChannel patterns, ObjectModel serialization strategy, and the complete test matrix.
