# PR Review Reports: Learning from Upstream Quickshell Code Review Culture

## Table of Contents
1. [PR #566 — Background Effect (ext-background-effect-v1)](#pr-566)
2. [PR #351 — WebView/WebEngine Support](#pr-351)
3. [Self-Review: QuickshellX WebEngine Integration](#self-review)
4. [Upstreamability Strategy](#upstream)

---

<a id="pr-566"></a>
## Report 1: PR #566 — `wayland/background-effect: add ext-background-effect-v1 (blur region)`

**Author:** @bbedward (BB)
**Reviewer:** @outfoxxed (maintainer)
**State:** OPEN, CHANGES_REQUESTED (actively iterating as of 2026-03-15)
**Timeline:** 2026-02-13 → ongoing (1 month+, 9 commits, 2 formal review rounds, 15 inline comments across 5 threads)
**Files touched:** 13 (new wayland module + extensions to core/region)

### What the PR Does

Adds Wayland `ext-background-effect-v1` protocol support, enabling blur regions on layer-shell surfaces. Also adds `radius` support to the existing `Region` type for creating approximate rounded regions.

### Review Round 1 (2026-03-06): "CHANGES_REQUESTED"

outfoxxed's summary: *"Rather disappointed in the protocol itself but the implementation is mostly there."*

This single sentence tells you a lot — he separates his opinion of the protocol spec from the code quality. He'll review your implementation on its own merits even if he dislikes the underlying technology.

**4 inline comments filed:**

#### 1.1 Algorithm Design — region.cpp:113

> I'm not quite sure about this one for two reasons:
> 1. Matching exactly what qt does for rounded rectangle corners is a little iffy
> 2. Corners should be an easier primitive to apply than this, especially when you don't need exactly four square ones.
>
> The best way I see to solve both problems at once is to use one QRegion(Ellipse) per corner and two QRegion(Rectangle)s forming a + between the ellipse centers, then unlock the corners.

bbedward had written a pixel-by-pixel loop using `sqrt`/`round` to carve rounded corners out of a rectangle. outfoxxed rejected the entire algorithmic approach. His counter-proposal was specific and implementable: use Qt's built-in `QRegion(Ellipse)` and `QRegion(Rectangle)` primitives composed together.

**Key pattern:** outfoxxed doesn't just say "this is wrong" — he provides an alternative algorithm with enough detail to implement. He thinks in terms of composable geometric primitives, not iterative math.

**Resolution:** bbedward rewrote to use the ellipse + cross approach (commit `565d259` → `9f8d1ed`).

#### 1.2 Protocol Destructors — surface.cpp:23

> Protocol objects should always use their actual destructors. That wl_proxy_destroy is doing at best the exact same thing or at worst leaking a protocol object id.

**Resolution:** bbedward switched to the typed protocol destructor.

#### 1.3 No Inert States — surface.cpp:26

> Inert is a useless state as its not clearly defined if we can ever use the object again, so we have to assume we can't. In any case where the effect would become inert it should be destroyed.

These two comments together reveal a hard rule: **Wayland protocol objects must use typed destructors, and zombie/inert states are banned.** This is non-negotiable.

**Resolution:** bbedward removed the inert state entirely, added `SurfaceAboutToBeDestroyed` event filter to ensure cleanup before wl_surface teardown.

#### 1.4 HiDPI Scaling — qml.cpp:102

> Scaling is not handled. The surface-local coordinates are the worst part of this generally terrible protocol [...] but Qt's internal scaling mechanisms like QT_SCALE_FACTOR have to be accounted for because some people use them for changing logical pixel size in qs.

**Resolution:** bbedward added `QHighDpiScaling::factor(this->mWindow)`.

---

### Review Round 2 (2026-03-11): "CHANGES_REQUESTED" — "Good overall"

**2 new inline comment threads:**

#### 2.1 Cleanup Simplicity — qml.cpp:132

> The intent here is good, but the cleanup isn't super time-sensitive, so onWaylandSurfaceDestroyed's = nullptr should cover it fine already, and pendingBlurRegion is set on surface creation.

bbedward pushed back with evidence:
> I couldn't get around this with this protocol at least specifically, surfaceDestroyed fires after wl_surface_destroy is queued — and the compositor raises a surface_destroyed error (crashes quickshell)

outfoxxed's response:
> Reasonable solution I guess. Feels non ideal but I won't block the pr on it.

**Key pattern:** outfoxxed prefers simpler cleanup. But when the contributor shows a concrete crash, he accepts the complexity. The phrase "I won't block the PR on it" is his way of saying "I disagree with the approach but the evidence justifies it." This is important — **you can push back on outfoxxed, but only with hard evidence (crashes, spec violations, test failures).**

#### 2.2 Scope Expansion (Feature Request + Pragmatic Retreat) — region.cpp:22

> I don't want to expand scope on this much for a mostly unrelated PR but per-corner radius control would still be very useful here for things like inverse corners.

bbedward implemented it. outfoxxed tested it, posted a screenshot showing visual bugs:

> Doesn't really work. At this point we could revert or fix the independent radius changes, your choice, since I don't want to block the main pr on what is essentially a side issue.

bbedward fixed it with a "5 rectangle approach."

**Key pattern:** outfoxxed will suggest enhancements, but explicitly labels them as "side issues" and gives the contributor an escape hatch. He'd rather ship the core feature than block on a bonus feature.

---

### General Comments (not inline)

#### API Pattern — Attached Object

> For consistency with existing interfaces, this should probably be an attached object. See HyprlandWindow for an example.

outfoxxed also asked: *"Do we have any options for blur opacity exposed?"* — showing he thinks about the full API surface, not just what's implemented.

#### Input Validation (latest comment, 2026-03-15)

> Added missing controls to the tester and noticed the corner radius is entirely unclamped at this point so it will break if you take it out of bounds. It should clamp at the point where its bounded by the size of the rect or space used by other corners

**Key pattern:** outfoxxed doesn't just review the code — he runs the test QML himself and finds edge cases. He pushed a commit directly to the PR branch ("better tester" — commit `656303d`). **He will actively contribute to PRs he's reviewing.** This means he expects a working test environment and will catch things that only show up at runtime.

---

### Commit History Analysis

PR #566 has **clean, rebased history**: all 8 of bbedward's commits are rebased onto the same base, with clear message prefixes (`wayland/background-effect:`, `core/region:`). outfoxxed's single commit is at the tip. This is the expected standard.

---

### Summary: outfoxxed Review Mechanisms (PR #566)

| Mechanism | Example |
|-----------|---------|
| **Pattern enforcement** | "Use attached object like HyprlandWindow" |
| **Concrete alternative algorithms** | "Use QRegion(Ellipse) per corner + rectangles forming a +" |
| **Hard rules for protocol lifecycle** | Typed destructors only, no inert states |
| **HiDPI as a checklist item** | Always checks QT_SCALE_FACTOR handling |
| **Evidence-based pushback accepted** | "Won't block if you show me the crash" |
| **Scope labeling** | "Side issue — your choice to fix or revert" |
| **Active testing** | Runs the manual QML test, finds edge cases, pushes fixes |
| **Input validation** | "Entirely unclamped — should clamp" |
| **API surface thinking** | "Do we have blur opacity exposed?" |

---

<a id="pr-351"></a>
## Report 2: PR #351 — `Add support for WebView`

**Author:** @just-some-entity (entity)
**Reviewer:** @outfoxxed (maintainer)
**State:** OPEN (4 months old, unmerged, stalled on jemalloc crash)
**Timeline:** 2025-11-08 → ongoing (13 commits including merge commits, 0 formal inline reviews, all discussion in issue comments)
**Files touched:** 7 (launch.cpp modification + new webengine/ module with QLibrary loader + test)

### What the PR Does

Adds a `//@ pragma EnableQtWebEngineQuick` that dynamically loads `QtWebEngineQuick::initialize()` at runtime via `QLibrary::resolve()` with a mangled C++ symbol name, avoiding any hard link dependency on QtWebEngine.

### The Full Code (for comparison with our approach)

entity's `src/webengine/webengine.hpp` — the entire implementation:

```cpp
namespace qs::web_engine {
inline bool init() {
    using InitializeFunc = void (*)();
    QLibrary lib("Qt6WebEngineQuick", 6);
    if (!lib.load()) {
        qWarning() << "Failed to load library:" << lib.errorString();
        printNotLoaded();
        return false;
    }
    auto initialize =
        reinterpret_cast<InitializeFunc>(lib.resolve("_ZN16QtWebEngineQuick10initializeEv"));
    if (!initialize) {
        qWarning() << "Failed to resolve symbol ...";
        printNotLoaded();
        return false;
    }
    try {
        initialize();
    } catch (...) { ... }
    return true;
}
}
```

Notable characteristics:
- **Header-only** (`inline` function in `.hpp`) — outfoxxed didn't comment on this
- **Mangled symbol name** `_ZN16QtWebEngineQuick10initializeEv` — outfoxxed flagged as "a little iffy"
- **try/catch around initialize()** — defensive but unnecessary; `initialize()` doesn't throw
- **Unconditional include** in launch.cpp — no `#if` guard since dynamic loading gracefully fails
- **Unconditional `add_subdirectory(webengine)`** in src/CMakeLists.txt — NOT guarded by `if (WEBENGINE)` since there's no build-time dependency

### Review Thread Analysis

#### Thread 1: The Dependency Negotiation (3 messages)

**outfoxxed (2025-11-10):**
> Changing qArgC is fine but I do not want to force a dependency on qtwebview or qtwebengine. Can we avoid calling initialize?

**entity (2025-11-10):**
> According to the docs [...] I tested it both with and without [...] no visible issues. However, there are no guarantees, and using it could lead to hard-to-debug undefined behavior [...]  I might review the QtWebView source for initialize() and try to implement it directly in qs [...] This would avoid the dependency, though we would need to manually keep the code in sync with upstream.

**outfoxxed (2025-11-11):**
> if the initialization logic is complex, an acceptable solution would be to have a skeleton header with just that static function, and load the module dynamically if a pragma is set.

**Key pattern:** outfoxxed's hierarchy of acceptable solutions for upstream:
1. Don't call it at all (if safe)
2. Re-implement the initialization logic in quickshell
3. Skeleton header + QLibrary dynamic loading
4. (UNACCEPTABLE) Hard link dependency

entity chose option 3. outfoxxed accepted it.

**Also important:** entity researched and presented options, which outfoxxed appreciated. He doesn't just say "no" — he responds to informed analysis with specific guidance. **Doing your homework before pushing back earns you specific, actionable feedback.**

#### Thread 2: Symbol Stability + Test Request (2 messages)

**outfoxxed (2025-11-12):**
> Looks acceptable, though loading a symbol with a mangled name seems a little iffy. Can you add a manual test so we can make sure it still works in the future?

**entity (2025-11-22, 10-day gap):**
> I agree, but that was the best solution I managed to come up with [...] Also added a regular test for the init function, unless you meant some other form of test with "manual test"

entity added a `QTest` C++ unit test. outfoxxed likely meant a QML test file (matching the PR #566 pattern of `test/manual/`). He didn't push back — possibly because a unit test is actually MORE useful here since it catches symbol resolution failure at build time, not just runtime.

#### Thread 3: The jemalloc Discovery (6 messages, 2026-03-06 → 2026-03-09)

This is the most important thread for us because it directly informed our jemalloc mutual exclusion guard.

**outfoxxed (2026-03-06):**
> Alright so I forgot about this last time because setting up the env to get it loading was annoying, but did that now. Anyway I haven't been able to get it to not immediately crash.

He posted a full SEGV stack trace. Then asked the critical question:

> Disabling jemalloc does fix it but we don't want to do that generally. Does QtWebView have the same problem? Any particular reason we're using WebEngine here?

This reveals two things:
1. He considered whether WebView (lighter) would avoid the problem
2. He's probing whether WebEngine is actually necessary vs. a simpler alternative

**WeraPea** confirmed WebView also crashes with jemalloc.

**outfoxxed's conclusion:**
> Unfortunate. Well we can probably merge this off by default.

**Key pattern:** When confronted with an unsolvable external conflict (Chromium vs jemalloc), outfoxxed's resolution is: **ship it off-by-default, let users opt in.** He won't degrade the default build to accommodate an optional feature.

#### Unexamined: Commit Hygiene

PR #351 has **messy history**: merge commits (`Merge branch 'upstream:master' into webview`), inconsistent author emails (`dev.algorithm253@slmail.me` → `entity@jsentity.dev`), no rebasing. outfoxxed never commented on this, but PR #566 has clean rebased history. For upstream PRs, **clean linear history is the expectation**, even if outfoxxed doesn't always enforce it.

### Pragma Naming Comparison

| PR | Pragma name | Pattern match? |
|----|-------------|---------------|
| #351 (entity) | `EnableQtWebEngineQuick` | No — existing pragmas use `Use*` or verb forms, not `Enable*` |
| QuickshellX (us) | `UseWebEngine` | Yes — matches `UseQApplication` pattern |

outfoxxed didn't comment on entity's naming. But our `UseWebEngine` is more consistent with existing conventions.

---

### Timeline & What It Reveals

| Date | Event | Insight |
|------|-------|---------|
| 2025-11-08 | entity opens PR with hard dep | |
| 2025-11-10 | outfoxxed: "no hard dep" | Reviews within 2 days |
| 2025-11-11 | entity rewrites to QLibrary | Fast turnaround |
| 2025-11-12 | outfoxxed: "acceptable, add test" | Reviews within 1 day |
| 2025-11-22 | entity adds test | 10-day gap |
| 2025-11-22 → 2026-01-17 | **2 month silence** | **Not a priority for outfoxxed** |
| 2026-01-17 | @kRHYME7: "Any update?" | Community demand exists |
| 2026-03-06 | outfoxxed finally tests, finds crash | **Admits he forgot/avoided it** |
| 2026-03-07–08 | jemalloc identified as root cause | Community confirms |
| 2026-03-08 | outfoxxed: "merge off by default" | His proposed resolution |
| 2026-03-09 | entity: "will investigate this week" | Still unresolved |

**The 4-month gap is the most revealing data point.** outfoxxed explicitly said setting up the test environment was "annoying." WebEngine support is low-priority for upstream. Community demand exists but doesn't accelerate the review. This means: **if we want upstream WebEngine, we need to make it trivially easy for outfoxxed to test.** A manual QML test file is essential.

---

<a id="self-review"></a>
## Report 3: Self-Review — QuickshellX WebEngine Integration (commit `10c7c2b`)

### The Code Under Review

```
CMakeLists.txt            — boption(WEBENGINE), jemalloc guard, conditional find_package
src/build/CMakeLists.txt  — WEBENGINE_DEF conditional
src/build/build.hpp.in    — #define WEBENGINE @WEBENGINE_DEF@
src/launch/CMakeLists.txt — conditional Qt::WebEngineQuick link
src/launch/launch.cpp     — pragma field, parsing, qArgC=1, initialize()
```

### Issue 1: Pragma Placement Breaks the Chain Visual Pattern

**Severity: Medium (outfoxxed would request a fix)**

The upstream pragma chain has two zones:
```cpp
// ZONE 1: Simple single-line assignments (no braces)
if (pragma == "UseQApplication") pragmas.useQApplication = true;
else if (pragma == "NativeTextRendering") pragmas.nativeTextRendering = true;
else if (pragma == "IgnoreSystemSettings") pragmas.desktopSettingsAware = false;
else if (pragma == "RespectSystemStyle") pragmas.useSystemStyle = true;
else if (pragma.startsWith("IconTheme ")) pragmas.iconTheme = pragma.sliced(10);

// ZONE 2: Multi-line blocks (with braces, } else if pattern)
else if (pragma.startsWith("Env ")) {
    ...
} else if (pragma.startsWith("ShellId ")) {
    ...
} else if (pragma.startsWith("CacheDir ")) {
    pragmas.cacheDir = pragma.sliced(9).trimmed();
} else {
    qCritical() << "Unrecognized pragma" << pragma;
```

Our code appends to the END of zone 2:
```cpp
} else if (pragma == "UseWebEngine") pragmas.useWebEngine = true;
else {
```

This creates a style break: `else {` follows a braceless single-line statement instead of a `}`. Every other `else` in the chain is preceded by `}`.

**PR #351 got this right** — entity placed their pragma IN zone 1:
```cpp
else if (pragma == "RespectSystemStyle") pragmas.useSystemStyle = true;
else if (pragma == "EnableQtWebEngineQuick") pragmas.useQtWebEngineQuick = true;
else if (pragma.startsWith("IconTheme ")) ...
```

**Fix:** Move `UseWebEngine` into zone 1, after the other simple boolean pragmas:
```cpp
if (pragma == "UseQApplication") pragmas.useQApplication = true;
else if (pragma == "NativeTextRendering") pragmas.nativeTextRendering = true;
else if (pragma == "IgnoreSystemSettings") pragmas.desktopSettingsAware = false;
else if (pragma == "RespectSystemStyle") pragmas.useSystemStyle = true;
else if (pragma == "UseWebEngine") pragmas.useWebEngine = true;     // HERE
else if (pragma.startsWith("IconTheme ")) pragmas.iconTheme = pragma.sliced(10);
```

---

### Issue 2: No Manual Test QML File

**Severity: High for upstream, Medium for fork (outfoxxed explicitly requests these)**

PR #566 ships `src/wayland/background_effect/test/manual/background_effect.qml`.
PR #351 was asked to add a test.
outfoxxed runs these tests himself and pushes fixes to them.
We have: documentation in markdown, but no runnable QML test.

**This is the #1 thing that would delay an upstream PR.** outfoxxed procrastinated 4 months on PR #351 partly because "setting up the env to get it loading was annoying." A `test/manual/webengine.qml` that he can run with `qs -p` is the single highest-ROI thing we can add.

**Fix:** Add `src/launch/test/manual/webengine.qml`:
```qml
//@ pragma UseWebEngine

import Quickshell
import QtWebEngine

FloatingWindow {
    width: 800
    height: 600
    WebEngineView {
        anchors.fill: parent
        url: "data:text/html,<h1>WebEngine works!</h1><p>Qt version: <script>document.write(navigator.userAgent)</script></p>"
        backgroundColor: "transparent"
    }
}
```

Using a `data:` URL means it works without a network connection or local server, removing setup friction.

---

### Issue 3: pragma `useWebEngine` Field Placement in Struct

**Severity: Low (nitpick, but consistent with outfoxxed's pattern-matching)**

In the pragmas struct, `useWebEngine` is placed after `useSystemStyle`:
```cpp
bool useSystemStyle = false;
bool useWebEngine = false;        // after style, before iconTheme
QString iconTheme = ...;
```

PR #351 placed it in the same spot. This is fine and follows the pattern of booleans-first, strings-after. No issue here.

---

### Issue 4: Hard Link vs. Dynamic Loading (Fork vs. Upstream Tension)

**Severity: N/A for fork; BLOCKING for upstream**

Our approach:
```cpp
#if WEBENGINE
#include <qtwebenginequickglobal.h>
#endif
// ...
#if WEBENGINE
if (pragmas.useWebEngine) {
    QtWebEngineQuick::initialize();
}
#endif
```

PR #351's approach:
```cpp
#include "../webengine/webengine.hpp"   // unconditional — QLibrary fails gracefully
// ...
if (pragmas.useQtWebEngineQuick) {
    web_engine::init();                  // QLibrary::resolve at runtime
}
```

**For quickshellX as a fork:** our hard link is cleaner, more reliable, no mangled symbol fragility. Correct choice.

**For upstream PR:** outfoxxed will reject hard `target_link_libraries(... Qt::WebEngineQuick)` on sight. The PR #351 approach is the accepted pattern for upstream.

See [Upstreamability Strategy](#upstream) for how to structure the code to support both.

---

### Issue 5: No `add_subdirectory(webengine)` (Structural Difference from PR #351)

**Severity: Informational**

PR #351 added `src/webengine/` as a new subdirectory with its own CMakeLists.txt, test infrastructure, and the QLibrary wrapper. We put everything directly in `src/launch/` with no new directories.

For a fork where we hard-link, this is correct — there's nothing to put in a separate module. For upstream, the QLibrary wrapper would need its own module directory (matching PR #351's structure).

---

### Issue 6: Missing `module.md`

**Severity: Low (pattern following)**

PR #566 adds `src/wayland/module.md` with a one-line description for the new module. We don't add any module.md because we don't create a new module. Correct — nothing to document at module level since we modify existing files only.

---

### What We Got Right

| Item | Why it's correct | Evidence |
|------|-----------------|---------|
| `qArgC = 1` unconditional | argv[0] always exists | outfoxxed: "Changing qArgC is fine" |
| `UseWebEngine` pragma name | Matches `UseQApplication` convention | Existing pattern |
| `build.hpp.in` pattern | Exact match with `CRASH_HANDLER` | Template pattern |
| `_effective` in root CMake, raw in src/ | All src/ CMakeLists use raw vars | Verified: CRASH_HANDLER, DBUS, BLUETOOTH all use raw |
| `initialize()` before QGuiApplication | Qt docs require this ordering | Correct position in launch flow |
| jemalloc FATAL_ERROR guard | Explicit > silent failure | outfoxxed prefers clear errors |
| No new C++ QML types | Zero API surface | Avoids all pattern-conformance risk from PR #566 |
| Minimal diff (5 files, ~25 lines) | outfoxxed respects focused changes | PR #566 was accepted at ~800 lines; ours is 25 |

---

### Comprehensive Severity Table

| # | Issue | Severity | Blocks upstream? | Blocks fork? |
|---|-------|----------|-----------------|-------------|
| 1 | Pragma in wrong zone of if-chain | Medium | Yes | No (cosmetic) |
| 2 | No manual test QML file | High | Yes (explicitly requested) | No (but strongly recommended) |
| 3 | Hard link instead of QLibrary | N/A for fork | Yes (immediate rejection) | No (correct for fork) |
| 4 | Commit history (merge commits vs rebase) | Low | Maybe (PR #566 rebased) | No |
| 5 | HiDPI for future InputMaskObserver | Informational | No (user-space) | No |

---

<a id="upstream"></a>
## Report 4: Upstreamability Strategy

Given that quickshellX's purpose is WebEngine-ON-by-default, but you'd like to PR back to mainline if possible, here's how to structure the code for both:

### The Core Tension

| Requirement | QuickshellX (fork) | Upstream |
|-------------|-------------------|----------|
| Link type | Hard link (`Qt::WebEngineQuick`) | QLibrary dynamic load |
| Default state | ON | OFF (or no boption at all) |
| jemalloc | OFF globally | ON by default, OFF only for WebEngine users |
| Test | Nice to have | Required (manual QML) |
| `#if WEBENGINE` guard | Yes (conditional compilation) | No (always compiled, fails gracefully at runtime) |

### Recommended Approach: Dual-Path Implementation

Structure the code so the **same launch.cpp changes** work for both fork and upstream, differing only in the build system:

**1. Keep our launch.cpp changes as-is** (with pragma placement fix), but add the QLibrary fallback path:

```cpp
#if WEBENGINE
#include <qtwebenginequickglobal.h>
static void initWebEngine() { QtWebEngineQuick::initialize(); }
#else
// Dynamic loading fallback (upstream-compatible, no hard dep)
#include <qlibrary.h>
static void initWebEngine() {
    QLibrary lib("Qt6WebEngineQuick", 6);
    if (!lib.load()) {
        qWarning() << "QtWebEngineQuick not found:" << lib.errorString();
        return;
    }
    using InitFunc = void(*)();
    auto fn = reinterpret_cast<InitFunc>(
        lib.resolve("_ZN16QtWebEngineQuick10initializeEv"));
    if (fn) fn();
    else qWarning() << "Could not resolve QtWebEngineQuick::initialize()";
}
#endif
```

Then the pragma handler just calls `initWebEngine()` regardless of path.

**2. Keep the boption** — upstream can change its default to OFF.

**3. Add the manual test** — this is the highest-leverage upstream enabler.

**4. Fix pragma placement** — trivial but outfoxxed will notice.

**5. Clean commit history** — rebase before any upstream PR. Single commit or logical split (e.g., "fix qArgC" separate from "add WebEngine pragma").

### What an Upstream PR Would Look Like

Based on PR #351's trajectory and outfoxxed's stated acceptance:

```
Title: launch: add UseWebEngine pragma with dynamic loading

Files changed:
  src/launch/launch.cpp           — pragma + initWebEngine() with QLibrary
  src/launch/test/manual/webengine.qml  — manual test

NO new boption, NO new CMake deps, NO build.hpp change.
WebEngine loads dynamically when pragma is set, fails gracefully if not installed.
qArgC = 1 change can go in a separate preparatory PR.
```

This avoids the hard dependency entirely, which is what outfoxxed accepted in PR #351. The jemalloc issue would need a warning in the test QML or a runtime log message.

### Action Items (Ordered by Impact)

| Priority | Action | Impact |
|----------|--------|--------|
| 1 | Fix pragma placement (move to zone 1) | Removes cosmetic review blocker |
| 2 | Add `test/manual/webengine.qml` with data: URL | Removes #1 upstream blocker; reduces outfoxxed's testing friction |
| 3 | Add QLibrary fallback behind `#else` | Enables upstream PR without changing fork behavior |
| 4 | Split qArgC fix into separate commit | Clean history; uncontroversial change can merge independently |
| 5 | Rebase to linear history before upstream PR | Matches PR #566's commit hygiene standard |
