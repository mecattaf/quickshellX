# Quickshell Integration Guidelines

This document describes the code style, architecture patterns, and contribution
requirements for the quickshell project. Follow it exactly. If something isn't
covered here, look at the existing code and match it.

---

## 1. Code Style Rules

### 1.1 Formatting Tool

All code is formatted with `clang-format`. Run `just fmt` before submitting.
The configuration lives in `.clang-format` at the repo root.

If clang-format produces something stupid, disable it locally:
```cpp
// clang-format off
...code...
// clang-format on
```

This is commonly done around `Q_PROPERTY` blocks that must stay on single
lines for the doc generator, and around `Q_OBJECT_BINDABLE_PROPERTY` blocks.
See `src/wayland/wlr_layershell/wlr_layershell.hpp:99-118` and
`src/services/mpris/player.hpp:89-227` for examples.

### 1.2 Indentation

- **Tabs for indentation, spaces for alignment.** (`UseTab: ForIndentation`)
- Tab width / indent width: **2** (`.clang-format:68-69`)
- Column limit: **100** (`.clang-format:67`)

### 1.3 Brace Placement

K&R style (opening brace on same line) for everything: classes, functions,
control statements, namespaces. Never Allman.

```cpp
// correct
void Foo::bar() {
    if (cond) {
        ...
    } else {
        ...
    }
}

// wrong
void Foo::bar()
{
    ...
}
```

Multi-line control statements use `AfterControlStatement: MultiLine` --
braces go on the next line only when the condition itself spans multiple lines.
See `.clang-format:43-60`.

### 1.4 Header Guards

Use `#pragma once`. Never use `#ifndef` guards.
See every `.hpp` file in the project, e.g. `src/core/singleton.hpp:1`.

### 1.5 Include Ordering

Includes are regrouped automatically by clang-format (`.clang-format:74-83`):

1. **Own header** (in `.cpp` files, the corresponding `.hpp` comes first)
2. **C/C++ standard library** (`<algorithm>`, `<utility>`, etc.)
3. **Third-party / Qt headers** using **lowercase `.h` suffix**: `<qobject.h>`, `<qqmlintegration.h>`, NOT `<QObject>`.
4. **Local project headers** using `"relative/path.hpp"`

Example from `src/core/singleton.cpp:1-10`:
```cpp
#include "singleton.hpp"

#include <qhash.h>
#include <qlogging.h>
#include <qobject.h>
#include <qqmlcontext.h>
#include <qqmlengine.h>

#include "generation.hpp"
#include "reload.hpp"
```

**Rule**: Always use lowercase `.h` Qt headers, e.g. `<qwindow.h>` over `<QWindow>`.
See `HACKING.md:161`.

### 1.6 Naming Conventions

Enforced by `.clang-tidy:56-66`:

| Entity | Convention | Example |
|--------|-----------|---------|
| Classes, Enums | `CamelCase` | `WlrLayershell`, `MprisPlaybackState` |
| Functions, Methods | `camelBack` | `setLayer()`, `onStateChanged()` |
| Member variables | `camelBack` | `compositorPicksScreen` |
| Property-backing members | `m` prefix | `mReloadableId`, `mWatchFiles` |
| Bindable properties | `b` prefix | `bLayer`, `bAnchors`, `bKeyboardFocus` |
| Namespaces | `lower_case` | `qs::wayland::layershell` |
| Constants | `UPPER_CASE` | `LAUNCH_TIME` |
| Local variables/parameters | `camelBack` | `oldInstance`, `iindex` |
| Enum values | `CamelCase` | `Background`, `OnDemand` |

See `src/wayland/wlr_layershell/wlr_layershell.hpp:188-207` for bindable
naming, `src/core/qmlglobal.hpp:60` for `m` prefix on members.

### 1.7 Use of `auto`

From `HACKING.md:32-46`:

Use `auto` when the type is deducible from the expression or when calling
a constructor with arguments. Do not use `auto` for default-constructed or
empty-constructed objects.

```cpp
auto x = someExpression();       // ok - type deducible
auto x = QString::number(3);     // ok - return type obvious
QString x;                       // ok - default constructed
QString x = "foo";               // ok - literal init
auto x = QString("foo");         // ok - constructor with args

auto x = QString();              // AVOID - default ctor, write QString x;
QString x("foo");                // AVOID - use = or auto
```

### 1.8 Use of `this->`

**Always use `this->` explicitly** for member access. This is consistent
throughout the entire codebase. There are zero exceptions.

See `src/core/singleton.cpp:22-23`:
```cpp
if (this->parent() != nullptr || context->contextObject() != this) {
```

See `src/services/mpris/watcher.cpp:37-42`:
```cpp
this->serviceWatcher.setWatchMode(...);
this->serviceWatcher.addWatchedService("org.mpris.MediaPlayer2*");
this->serviceWatcher.setConnection(bus);
this->registerExisting();
```

### 1.9 Pointer Style

Pointer and reference aligned **left** (to the type):
```cpp
QObject* parent       // correct
QObject *parent       // wrong
const QString& name   // correct
const QString &name   // wrong
```
See `.clang-format:33`.

### 1.10 Error Handling Patterns

Use Qt logging categories (`qCDebug`, `qCWarning`, `qCCritical`) for
module-specific logging, and plain `qWarning()` for general warnings.

Define categories using the `QS_LOGGING_CATEGORY` macro (from `src/core/logcat.hpp`)
inside an anonymous namespace at the top of the `.cpp` file:

```cpp
namespace {
QS_LOGGING_CATEGORY(logMprisWatcher, "quickshell.service.mpris.watcher", QtWarningMsg);
}
```

Category naming convention: `quickshell.<module>.<submodule>`, matching the
directory structure. The default level is almost always `QtWarningMsg`.

See `src/services/mpris/watcher.cpp:18-19`, `src/io/socket.cpp:17`,
`src/dbus/properties.cpp:26`.

Return early on error conditions. Do not nest deeply:
```cpp
if (context == nullptr) {
    qWarning() << "Not registering singleton not created in the qml context:" << this;
    return;
}
```
See `src/core/singleton.cpp:15-18`.

### 1.11 `[[nodiscard]]` on Getters

All const getter functions should be marked `[[nodiscard]]`.
See `src/core/qmlglobal.hpp:151`, `src/wayland/wlr_layershell/wlr_layershell.hpp:135-159`.

### 1.12 Whitespace / Logical Units

From `HACKING.md:48-79`:

Put newlines between logical units of code and after closing braces. If a
logical unit is a single line, merge consecutive single-line units:

```cpp
auto x = expr;    // unit 1
auto y = expr;    // unit 2 (single lines, group together)

auto x = expr;
if (x...) {       // one unit: setup + use
    ...
}

auto x = expr;
auto y = expr;

if (x && y) {     // separate: two setup lines need a newline before use
    ...
}
```

### 1.13 Comment Style

- Doc comments for QML-visible items: `///` (body) and `//!` (summary)
- Regular code comments: `//`
- Comment density is **low** -- code should be self-explanatory. Comments
  explain *why*, not *what*.
- Doc comments support markdown and cross-references via `@@[Module.][Type.][member]`

See `HACKING.md:187-200` and `src/core/qmlglobal.hpp:84-148` for examples
of doc comment style.

---

## 2. Module Structure

### 2.1 Directory Layout

Each module lives under `src/` as a subdirectory:
```
src/
  core/           # always built
  window/         # always built
  io/             # always built
  wayland/        # conditional on WAYLAND
    wlr_layershell/
    session_lock/
    hyprland/
      ipc/
      surface/
  services/
    mpris/
    upower/
    pipewire/
  bluetooth/      # conditional on BLUETOOTH
  network/        # conditional on NETWORK
```

### 2.2 Module File Structure

Every module directory contains at minimum:
- `CMakeLists.txt` -- build definition
- One or more `.cpp`/`.hpp` pairs
- `module.md` -- lists headers for doc generation (if the module has QML types)

Optional:
- `test/` subdirectory with automated tests
- `test/manual/` with QML files for manual testing

### 2.3 Namespace Convention

All code lives under the `qs::` root namespace, following the directory
structure:

| Directory | Namespace |
|-----------|-----------|
| `src/core/` | (no extra namespace, or occasionally `qs::log`) |
| `src/wayland/wlr_layershell/` | `qs::wayland::layershell` |
| `src/services/mpris/` | `qs::service::mpris` |
| `src/x11/i3/ipc/` | `qs::i3::ipc` |
| `src/ipc/` | `qs::ipc` |

Core types like `Singleton`, `Reloadable`, `QuickshellGlobal` live at
the top level (no namespace beyond the file scope). See `src/core/singleton.hpp`.

Close namespace with comment: `} // namespace qs::wayland::layershell`
See `src/wayland/wlr_layershell/wlr_layershell.hpp:246`.

### 2.4 Adding a New Module

1. Create the directory under `src/`.
2. Write your `.hpp`/`.cpp` files.
3. Write a `CMakeLists.txt` following the patterns in Section 3.
4. If the module has QML types, create a `module.md` (see Section 2.5).
5. Add conditional `add_subdirectory()` in the parent `CMakeLists.txt`.
6. If the module needs a build option, add a `boption()` call in
   the root `CMakeLists.txt` with appropriate `REQUIRES`.
7. Link the module plugin to the main `quickshell` target.

### 2.5 module.md Format

TOML-like header listing the module name, description, and all headers
containing doc comments:

```toml
name = "Quickshell.Services.Mpris"
description = "Mpris Service"
headers = [
    "player.hpp",
    "watcher.hpp",
]
-----
```

See `src/services/mpris/module.md`, `src/core/module.md`.

---

## 3. CMake Patterns

### 3.1 Build Option Pattern (`boption`)

Defined in `CMakeLists.txt:15-39`. Options with dependencies use `REQUIRES`:

```cmake
boption(WAYLAND "Wayland" ON)
boption(WAYLAND_WLR_LAYERSHELL "  Wlroots Layer-Shell" ON REQUIRES WAYLAND)
boption(SERVICE_MPRIS "Mpris" ON)
```

When adding a new feature, add the `boption()` call in the root
`CMakeLists.txt`, keeping options grouped logically with indentation
showing hierarchy.

### 3.2 Standard QML Module CMakeLists.txt

This is the template. Follow it exactly:

```cmake
# For DBus services: set up interface files first
set_source_files_properties(org.example.Service.xml PROPERTIES
    CLASSNAME DBusExampleService
    NO_NAMESPACE TRUE
)
qt_add_dbus_interface(DBUS_INTERFACES org.example.Service.xml dbus_service)

# Create the static library
qt_add_library(quickshell-mymodule STATIC
    foo.cpp
    bar.cpp
    ${DBUS_INTERFACES}  # if applicable
)

# DBus header include dir (if applicable)
target_include_directories(quickshell-mymodule PRIVATE ${CMAKE_CURRENT_BINARY_DIR})

# Register as QML module
qt_add_qml_module(quickshell-mymodule
    URI Quickshell.MyModule
    VERSION 0.1
    DEPENDENCIES QtQml
)

# Light dependency declarations (no cmake dependency, just qmldir)
qs_add_module_deps_light(quickshell-mymodule Quickshell)

# Install
install_qml_module(quickshell-mymodule)

# Link dependencies
target_link_libraries(quickshell-mymodule PRIVATE Qt::Qml Qt::DBus)
qs_add_link_dependencies(quickshell-mymodule quickshell-dbus)  # soft link dep

# PCH
qs_module_pch(quickshell-mymodule SET dbus)  # or omit SET for default

# Link plugin to main target
target_link_libraries(quickshell PRIVATE quickshell-mymoduleplugin)

# Tests
if (BUILD_TESTING)
    add_subdirectory(test)
endif()
```

### 3.3 Target Naming Convention

| Type | Naming | Example |
|------|--------|---------|
| Static library | `quickshell-<module>` | `quickshell-service-mpris` |
| Plugin (auto) | `quickshell-<module>plugin` | `quickshell-service-mprisplugin` |
| Object library | `quickshell-<module>-init` | `quickshell-wayland-init` |
| Wayland proto | `wlp-<name>` | `wlp-layer-shell` |
| PCH sets | `qs-pchset-<name>` | `qs-pchset-dbus` |

### 3.4 QML Module URI Convention

URIs follow the directory structure:
- `Quickshell` -- core
- `Quickshell.Io` -- io
- `Quickshell.Wayland` -- wayland root
- `Quickshell.Wayland._WlrLayerShell` -- internal sub-module (underscore prefix)
- `Quickshell.Services.Mpris` -- service module
- `Quickshell.Services.UPower` -- service module
- `Quickshell.Bluetooth` -- top-level feature module

Internal/overlay modules that users don't import directly use an underscore prefix.

### 3.5 PCH Sets

Available PCH sets (`cmake/pch.cmake`):
- `common` -- basic Qt types (default if not specified)
- `large` -- common + more Qt types (for big modules like core, wayland)
- `plugin` -- minimal for plugin init files
- `dbus` -- for DBus-based modules
- `wayland-protocol` -- for wayland protocol wrappers

Usage: `qs_module_pch(target SET large)` or just `qs_module_pch(target)` for default.

### 3.6 Conditional Compilation

Guard features in both CMake and C++ with `#ifdef`:

CMake:
```cmake
if (WAYLAND_WLR_LAYERSHELL)
    add_subdirectory(wlr_layershell)
    target_compile_definitions(quickshell-wayland PRIVATE QS_WAYLAND_WLR_LAYERSHELL)
endif()
```

C++:
```cpp
#ifdef QS_WAYLAND_WLR_LAYERSHELL
#include "wlr_layershell/wlr_layershell.hpp"
#endif
```

See `src/wayland/init.cpp:9-11` and `src/wayland/CMakeLists.txt:88-94`.

---

## 4. QML Type Registration

### 4.1 Preferred Method: QML_ELEMENT

Use `QML_ELEMENT` macro in the class declaration. This is the standard method.

```cpp
class WlrLayershell: public ProxyWindowBase {
    Q_OBJECT;
    QML_ELEMENT;
    // ...
};
```

### 4.2 Singletons

Use `QML_SINGLETON` and a static `create` factory, or `QML_NAMED_ELEMENT`
combined with `QML_SINGLETON`:

```cpp
class MprisQml: public QObject {
    Q_OBJECT;
    QML_NAMED_ELEMENT(Mpris);
    QML_SINGLETON;
    // ...
};
```

For the `Quickshell` global singleton, use the `create` factory pattern:
```cpp
static QuickshellGlobal* create(QQmlEngine* engine, QJSEngine* /*unused*/);
```
See `src/core/qmlglobal.hpp:258`.

### 4.3 Uncreatable Types

Types that can only be obtained from other sources:
```cpp
QML_UNCREATABLE("MprisPlayers can only be acquired from Mpris");
```
See `src/services/mpris/player.hpp:229`.

### 4.4 Attached Types

```cpp
QML_ATTACHED(WlrLayershell);
// ...
static WlrLayershell* qmlAttachedProperties(QObject* object);
```
See `src/wayland/wlr_layershell/wlr_layershell.hpp:116-117`.

### 4.5 Enum Types as QML Elements

Enums exposed to QML are wrapped in a namespace with `Q_NAMESPACE` and
`QML_ELEMENT`, or in a QObject class with `Q_ENUM`:

Namespace style (for enums shared across types):
```cpp
namespace WlrLayer { // NOLINT
Q_NAMESPACE;
QML_ELEMENT;

enum Enum : quint8 {
    Background = 0,
    Bottom = 1,
    Top = 2,
    Overlay = 3,
};
Q_ENUM_NS(Enum);
} // namespace WlrLayer
```
See `src/wayland/wlr_layershell/wlr_layershell.hpp:26-43`.

QObject style (for tightly coupled enums):
```cpp
class MprisPlaybackState: public QObject {
    Q_OBJECT;
    QML_ELEMENT;
    QML_SINGLETON;
public:
    enum Enum : quint8 { Stopped = 0, Playing = 1, Paused = 2 };
    Q_ENUM(Enum);
    Q_INVOKABLE static QString toString(MprisPlaybackState::Enum status);
};
```
See `src/services/mpris/player.hpp:20-34`.

### 4.6 Runtime Type Registration (Legacy/Override)

Only used when overlaying types from one module onto another's import.
Uses `qmlRegisterType` and `qmlRegisterModuleImport`:

```cpp
qmlRegisterType<WaylandPanelInterface>("Quickshell._WaylandOverlay", 1, 0, "PanelWindow");
qmlRegisterModuleImport("Quickshell", QQmlModuleImportModuleAny,
    "Quickshell._WaylandOverlay", QQmlModuleImportLatest);
```
See `src/wayland/init.cpp:42-58`. Only do this if you need to overlay a
type from another module.

### 4.7 Plugin Registration

Modules that need init-time logic use the plugin system:

```cpp
// in init.cpp (OBJECT library, not STATIC)
#include "../core/plugin.hpp"

namespace {
class MyPlugin: public QsEnginePlugin {
    QList<QString> dependencies() override { return {"window"}; }
    bool applies() override { return someCondition; }
    void init() override { ... }
    void registerTypes() override { ... }
};
QS_REGISTER_PLUGIN(MyPlugin);
} // namespace
```
See `src/wayland/init.cpp:16-64` and `src/core/plugin.hpp:30-37`.

### 4.8 Doc Annotations

- Summary: `//!` on the line immediately above the class
- Body: `///` lines following the summary
- Properties: `///` directly above the `Q_PROPERTY` line
- `QSDOC_HIDE` hides items from generated docs
- `QSDOC_BASECLASS(Type)` overrides the visible base class
- `QSDOC_TYPE_OVERRIDE(type)` overrides the visible type of a property

```cpp
///! Wlroots layershell window
/// Decorationless window that can be attached to the screen edges.
class WlrLayershell: public ProxyWindowBase {
    QSDOC_BASECLASS(PanelWindowInterface);
    Q_OBJECT;
    /// The shell layer the window sits in. Defaults to `WlrLayer.Top`.
    Q_PROPERTY(WlrLayer::Enum layer READ layer WRITE setLayer NOTIFY layerChanged);
    QSDOC_HIDE Q_PROPERTY(Anchors anchors READ anchors ...);
```
See `src/wayland/wlr_layershell/wlr_layershell.hpp:71-118`.

---

## 5. Class Layout

Follow this order exactly (`HACKING.md:83-158`):

```cpp
class Foo: public QObject {
    // 1. Macros (semicolon terminated)
    Q_OBJECT;
    QML_ELEMENT;
    QML_CLASSINFO(...);

    // 2. Q_PROPERTY declarations (must be single-line for doc generator)
    // Wrap in clang-format off/on if they're long
    Q_PROPERTY(Type prop READ prop WRITE setProp NOTIFY propChanged);

public:
    // 3. Constructor (explicit, may be inline if no body)
    explicit Foo(QObject* parent = nullptr): QObject(parent) {}

    // 4. Static instance getter (if singleton)
    static Foo* instance();

    // 5. Member functions unrelated to properties
    void function();

    // 6. Q_INVOKABLEs with doc comments
    /// Doc comment.
    Q_INVOKABLE void doThing();

    // 7. Property accessors (bindable, getter, setter grouped per property)
    [[nodiscard]] QBindable<T> bindableProp() { return &this->bProp; }
    [[nodiscard]] T prop() const { return this->bProp; }
    void setProp(T value);

signals:
    // 8. Non-property signals first
    void somethingHappened();
    // 9. Property change signals in property order
    void propChanged();

public slots:
    void slot();  // prefer Q_INVOKABLE over public slots

private slots:
    void onSomething();

private:
    // 10. Statics, then functions, then fields
    static const Foo BAR;
    static void helper();

    void internalMethod();

    // 11. Property backing members (m prefix)
    QString mProp;

    // 12. Bindable properties last (b prefix)
    Q_OBJECT_BINDABLE_PROPERTY(Foo, QString, bProp, &Foo::propChanged);
};
```

---

## 6. Commit Message Format

From `HACKING.md:207-219`:

### 6.1 Format

```
scope: short description
```

The scope matches the directory structure. Examples from the actual git history
of commits touching the codebase:

- `core: ...` -- changes to `src/core/`
- `core/plugin: ...` -- specific subsystem
- `wayland/bg: ...` -- wayland background
- `service/mpris: ...` -- service module
- `crash: ...` -- crash handler
- `io: ...` -- io module

### 6.2 Rules

- Scope matches what has been used historically or what makes sense for new code.
- Description is lowercase, imperative mood (e.g., "add X", "fix Y", not "Added X").
- If the commit message isn't sufficient, add a description body explaining the changes.
- **Squash/rebase** additions or edits to previous changes. Keep history
  easily searchable at a glance. Single commits per logical change are preferred.
- If you don't squash, the maintainer will squash for you.

### 6.3 Changelog

If you make a user-visible change since the last tagged release, describe it
in `changelog/next.md`. Follow the existing section structure:
- Breaking Changes
- New Features
- Other Changes
- Bug Fixes
- Packaging Changes

See `changelog/next.md` for the current format.

---

## 7. Test Requirements

### 7.1 When to Write Tests

From `HACKING.md:177-185`:

- Write tests for complex or breakable features.
- The maintainer will ask you to write tests if your change is complex enough.
- All tests that passed before must still pass after your change.

### 7.2 Test Structure

Tests use Qt Test framework. Each test is a QObject class with test methods
as `private slots`:

**Header** (`test/mytest.hpp`):
```cpp
#pragma once

#include <qobject.h>
#include <qtmetamacros.h>

class TestMyThing: public QObject {
    Q_OBJECT;

private slots:
    static void testCase1();
    static void testCase2();
};
```

**Source** (`test/mytest.cpp`):
```cpp
#include "mytest.hpp"

#include <qtest.h>
#include <qtestcase.h>

void TestMyThing::testCase1() {
    // Use QCOMPARE, QVERIFY, etc.
    QCOMPARE(actual, expected);
}

QTEST_MAIN(TestMyThing);
```

See `src/core/test/ringbuf.hpp` and `src/core/test/ringbuf.cpp`.

### 7.3 Test CMakeLists.txt

```cmake
function (qs_test name)
    add_executable(${name} ${ARGN})
    target_link_libraries(${name} PRIVATE Qt::Quick Qt::Test quickshell-core quickshell-window quickshell-ui quickshell-io)
    add_test(NAME ${name} WORKING_DIRECTORY "${CMAKE_CURRENT_BINARY_DIR}" COMMAND $<TARGET_FILE:${name}>)
endfunction()

qs_test(mytest mytest.cpp)
```

See `src/core/test/CMakeLists.txt`.

### 7.4 Running Tests

```sh
just configure debug -DBUILD_TESTING=ON
just test
```

### 7.5 Manual Tests

QML files for interactive testing go in `test/manual/`. These are
standalone QML files that exercise specific features visually.
See `src/window/test/manual/panel.qml` for an example.

---

## 8. Linter Requirements

All contributions must pass `clang-tidy`. The configuration is in `.clang-tidy`.

Key enabled check groups:
- `bugprone-*`
- `concurrency-*`
- `cppcoreguidelines-*` (with many sensible exclusions)
- `modernize-*`
- `performance-*`
- `readability-*` (with exclusions for things like brace requirements)

**All warnings are errors** (`WarningsAsErrors: '*'`).

To run:
```sh
just configure debug -DNO_PCH=ON -DBUILD_TESTING=ON
just lint-changed
```

If the linter complains about something you disagree with, disable it inline
with `// NOLINT` or `// NOLINTNEXTLINE` and explain your reasoning. This is
done throughout the codebase. See `src/core/plugin.hpp:32-38` and
`src/core/util.hpp:46-60` for examples.

---

## 9. PR Checklist

Before submitting a pull request, verify all of the following:

- [ ] **You understand every line of your change.** AI-generated or
  automated-tool submissions without a human in the loop are banned.
  See `CONTRIBUTING.md:8-14`.
- [ ] **The change is a single logical unit.** Do not bundle unrelated changes.
- [ ] **Code is formatted.** Run `just fmt`.
- [ ] **Linter passes.** Run `just lint-changed` (requires `-DNO_PCH=ON -DBUILD_TESTING=ON`).
- [ ] **Tests pass.** Run `just test` (requires `-DBUILD_TESTING=ON`).
- [ ] **New QML types have doc comments.** `//!` summary and `///` body on
  classes, `///` on properties and invokables.
- [ ] **New files with doc comments are added to `module.md`.**
- [ ] **Commit messages follow `scope: description` format.** Squash fixups.
- [ ] **User-visible changes are described in `changelog/next.md`.**
- [ ] **License compatibility is maintained.** External code sources are disclosed.
- [ ] **Headers use `#pragma once`** and lowercase Qt includes (`<qobject.h>`).
- [ ] **`this->` is used for all member access.**
- [ ] **Getters are marked `[[nodiscard]]`.**
- [ ] **Property backing members use `m` prefix, bindables use `b` prefix.**
- [ ] **New build options use `boption()` with appropriate `REQUIRES`.**
- [ ] **QML module URIs follow the `Quickshell.Module.Submodule` convention.**

---

## 10. Quick Reference: Wayland Protocol Integration

For adding a new wayland protocol:

1. Place the `.xml` protocol file in your module directory.
2. Use the `wl_proto()` function to generate C and Qt bindings:
   ```cmake
   wl_proto(wlp-my-protocol my-protocol-v1 "${CMAKE_CURRENT_SOURCE_DIR}")
   ```
3. Link against the generated target:
   ```cmake
   target_link_libraries(quickshell-mymodule PRIVATE
       Qt::Quick Qt::WaylandClient Qt::WaylandClientPrivate wayland-client
       wlp-my-protocol
   )
   ```
4. Use the generated headers:
   ```cpp
   #include "qwayland-my-protocol-v1.h"
   ```

See `src/wayland/wlr_layershell/CMakeLists.txt:17-25` and
`src/wayland/CMakeLists.txt:31-71` for the `wl_proto()` function definition.

---

## 11. Quick Reference: DBus Service Integration

For adding a new DBus service wrapper:

1. Place the `.xml` introspection files in your module directory.
2. Generate interfaces:
   ```cmake
   set_source_files_properties(org.example.Service.xml PROPERTIES
       CLASSNAME DBusExampleService
       NO_NAMESPACE TRUE
   )
   qt_add_dbus_interface(DBUS_INTERFACES org.example.Service.xml dbus_service)
   ```
3. Include generated headers in your library sources:
   ```cmake
   qt_add_library(quickshell-service-example STATIC
       example.cpp
       ${DBUS_INTERFACES}
   )
   target_include_directories(quickshell-service-example PRIVATE ${CMAKE_CURRENT_BINARY_DIR})
   ```
4. Use `QS_DBUS_BINDABLE_PROPERTY_GROUP` and `QS_DBUS_PROPERTY_BINDING` macros
   for reactive DBus property binding.
5. Use the `dbus` PCH set: `qs_module_pch(quickshell-service-example SET dbus)`

See `src/services/mpris/CMakeLists.txt` and `src/services/upower/CMakeLists.txt`.

---

## 12. Singleton / Instance Pattern

Backend singletons (not QML singletons) use a static `instance()` method
with a local static:

```cpp
MprisWatcher* MprisWatcher::instance() {
    static MprisWatcher* instance = new MprisWatcher(); // NOLINT
    return instance;
}
```

The `// NOLINT` is intentional -- clang-tidy complains about the leak but
these are process-lifetime singletons. See `src/services/mpris/watcher.cpp:108-111`.

QML-facing singletons use a thin wrapper that delegates to the backend singleton:

```cpp
class MprisQml: public QObject {
    Q_OBJECT;
    QML_NAMED_ELEMENT(Mpris);
    QML_SINGLETON;
public:
    explicit MprisQml(QObject* parent = nullptr): QObject(parent) {}
    [[nodiscard]] ObjectModel<MprisPlayer>* players();
};

// in .cpp
ObjectModel<MprisPlayer>* MprisQml::players() {
    return MprisWatcher::instance()->players();
}
```

See `src/services/mpris/watcher.hpp:45-57` and `src/services/mpris/watcher.cpp:113-115`.

---

*If anything here is unclear, ask in the
[quickshell-development matrix room](https://matrix.to/#/#quickshell-development:outfoxxed.me)
before guessing.*
