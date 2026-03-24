# Contributing to PR #351: WebEngine Support for Quickshell

## Key Realization: No Code Fork Needed

Once PR #351 merges, WebEngine support is available in upstream quickshell
with zero code changes. The only thing needed is a Fedora COPR spec that
builds with `-DUSE_JEMALLOC=OFF` and adds `qt6-qtwebengine` / `qt6-qtwebchannel`
as dependencies. WebChannel is a pure QML plugin (`import QtWebChannel`) —
no C++ changes required.

**QuickshellX as a code fork is unnecessary.** The "fork" is just a spec file.

---

This walkthrough covers everything you need to do to contribute fixes to
[PR #351](https://github.com/quickshell-mirror/quickshell/pull/351) and
help get it merged.

---

## Step 1: Comment on the PR

Post this on https://github.com/quickshell-mirror/quickshell/pull/351

```
Hey @just-some-entity — I've been working on WebEngine integration in my
own fork (QuickshellX) and I'd like to help push this over the line.

I can address the remaining blockers:
- Add a jemalloc runtime warning when the pragma fires
- Add a manual test QML file (outfoxxed asked for one)
- Fix a few style issues (duplicate include, missing #pragma once, missing EOF newlines)
- Remove the unnecessary try/catch around initialize()
- Rebase onto current master

Would you be open to me opening a PR against your fork's `webview` branch?
Or if you prefer, I can post the changes here as suggestions and you can
apply them yourself.
```

Wait for entity to respond. If they say yes to a PR against their fork,
proceed. If they're unresponsive for a week+, you can open your own PR
against quickshell-mirror/quickshell referencing #351 and crediting entity.

---

## Step 2: Clone entity's fork

```bash
git clone https://github.com/just-some-entity/quickshell.git quickshell-webview-pr
cd quickshell-webview-pr
git checkout webview
```

Verify you're on the right branch:
```bash
git log --oneline -5
```

You should see entity's commits (the latest being merge commits from Jan 2026).

---

## Step 3: Rebase onto upstream master

```bash
git remote add upstream https://github.com/quickshell-mirror/quickshell.git
git fetch upstream
git rebase upstream/master
```

Resolve any conflicts. The changes are small (launch.cpp, new webengine/
directory) so conflicts should be minimal. If launch.cpp has new pragmas
added since entity's last merge, you'll need to re-place the
`EnableQtWebEngineQuick` line in the right spot in the pragma chain.

After rebase, verify the pragma is in zone 1 (among the simple boolean
pragmas, before `IconTheme`):

```cpp
if (pragma == "UseQApplication") pragmas.useQApplication = true;
else if (pragma == "NativeTextRendering") pragmas.nativeTextRendering = true;
else if (pragma == "IgnoreSystemSettings") pragmas.desktopSettingsAware = false;
else if (pragma == "RespectSystemStyle") pragmas.useSystemStyle = true;
else if (pragma == "EnableQtWebEngineQuick") pragmas.useQtWebEngineQuick = true;  // HERE
else if (pragma.startsWith("IconTheme ")) pragmas.iconTheme = pragma.sliced(10);
```

---

## Step 4: Make the code changes

These are the exact changes to make. You can hand them to Claude Code on
your other machine as a task.

### 4.1 Fix `src/webengine/webengine.hpp`

Replace the entire file with:

```cpp
#pragma once

#include <qdebug.h>
#include <qlibrary.h>
#include <qlogging.h>

namespace qs::web_engine {

inline bool init() {
	using InitializeFunc = void (*)();

	QLibrary lib("Qt6WebEngineQuick", 6);
	if (!lib.load()) {
		qWarning() << "Failed to load library:" << lib.errorString();
		qWarning() << "You might need to install the necessary package for Qt6WebEngineQuick.";
		qWarning() << "QtWebEngineQuick is not loaded. Using the qml type WebEngineView from"
		              " QtWebEngine might lead to undefined behaviour!";
		return false;
	}

	qDebug() << "Loaded library Qt6WebEngineQuick";

	auto initialize =
	    reinterpret_cast<InitializeFunc>(lib.resolve("_ZN16QtWebEngineQuick10initializeEv"));
	if (!initialize) {
		qWarning() << "Failed to resolve symbol 'void QtWebEngineQuick::initialize()' in lib"
		              " Qt6WebEngineQuick. This should not happen.";
		qWarning() << "QtWebEngineQuick is not loaded. Using the qml type WebEngineView from"
		              " QtWebEngine might lead to undefined behaviour!";
		return false;
	}

	qDebug() << "Found symbol QtWebEngineQuick::initialize(). Initializing WebEngine...";

	initialize();

	qWarning() << "WebEngine initialized. Note: WebEngine is incompatible with jemalloc."
	              " If quickshell crashes immediately, rebuild with -DUSE_JEMALLOC=OFF.";

	qDebug() << "Successfully initialized QtWebEngineQuick";
	return true;
}

} // namespace qs::web_engine
```

Changes from entity's version:
- Added `#pragma once` (style guide requirement)
- Removed duplicate `#include <QDebug>` (uppercase Qt includes are banned)
- Removed `printNotLoaded()` helper — inlined the warning (one-use function)
- Removed try/catch — `initialize()` doesn't throw, and catching `(...)` around a non-throwing C function is noise
- Added jemalloc warning after successful init — this is the key blocker fix
- Added newline at EOF

### 4.2 Fix `src/webengine/test/webengine.hpp`

Replace the entire file with:

```cpp
#pragma once

#include <qobject.h>
#include <qtmetamacros.h>

class WebEngineInitTest: public QObject {
	Q_OBJECT;

private slots:
	static void init();
};
```

Changes:
- Added `#pragma once`
- Added missing `#include <qtmetamacros.h>` (needed for Q_OBJECT)
- Added semicolon after `Q_OBJECT` (style guide: all macros semicolon-terminated)
- Added newline at EOF

### 4.3 Fix `src/webengine/test/webengine.cpp`

Replace the entire file with:

```cpp
#include "webengine.hpp"

#include <qtest.h>
#include <qtestcase.h>

#include "../webengine.hpp"

void WebEngineInitTest::init() { QVERIFY(qs::web_engine::init()); }

QTEST_MAIN(WebEngineInitTest)
```

Change: added newline at EOF.

### 4.4 Fix `src/webengine/CMakeLists.txt`

Replace with:

```cmake
if (BUILD_TESTING)
	add_subdirectory(test)
endif()
```

Change: added newline at EOF.

### 4.5 Fix `src/webengine/test/CMakeLists.txt`

Replace with:

```cmake
add_executable(webengine webengine.cpp)
target_link_libraries(webengine PRIVATE Qt::Core Qt::Test)
add_test(NAME webengine WORKING_DIRECTORY "${CMAKE_CURRENT_BINARY_DIR}" COMMAND $<TARGET_FILE:webengine>)
```

Change: added newline at EOF.

### 4.6 Add manual test: `src/webengine/test/manual/webengine.qml`

Create this new file:

```qml
//@ pragma EnableQtWebEngineQuick

import Quickshell
import QtWebEngine

FloatingWindow {
	width: 800
	height: 600

	WebEngineView {
		anchors.fill: parent
		url: "data:text/html,<h1>WebEngine works</h1><p>If you see this, QtWebEngineQuick initialized correctly.</p>"
	}
}
```

This is the manual test outfoxxed asked for. Uses a data: URL so it works
without network or a local server.

### 4.7 Verify launch.cpp changes are clean

After rebase, `src/launch/launch.cpp` should have these changes from upstream
master (and nothing else):

1. `#include "../webengine/webengine.hpp"` added to includes
2. `bool useQtWebEngineQuick = false;` in pragma struct
3. `else if (pragma == "EnableQtWebEngineQuick") pragmas.useQtWebEngineQuick = true;` in zone 1
4. `qArgC = 0` changed to `qArgC = 1`
5. `if (pragmas.useQtWebEngineQuick) { web_engine::init(); }` before QGuiApplication creation

No other changes to launch.cpp.

---

## Step 5: Run the checks

```bash
just fmt
just configure debug -DNO_PCH=ON -DBUILD_TESTING=ON
just lint-changed
just test
```

Fix anything that comes up. The most likely issue is clang-tidy complaining
about the `reinterpret_cast` in webengine.hpp — add a `// NOLINT` if needed.

---

## Step 6: Squash into clean commits

The final history should be 2 commits:

```bash
# Commit 1: the qArgC fix (uncontroversial, could merge independently)
git add src/launch/launch.cpp
git commit -m "launch: fix qArgC to 1 for correct argv[0]"

# Commit 2: everything else
git add src/launch/launch.cpp src/webengine/ src/CMakeLists.txt
git commit -m "launch: add EnableQtWebEngineQuick pragma

Load QtWebEngineQuick dynamically via QLibrary when the pragma is set.
Avoids a hard dependency on qtwebengine. Includes jemalloc compatibility
warning and manual test.

Co-authored-by: just-some-entity <entity@jsentity.dev>"
```

Actually, since you're rebasing entity's work, the authorship is already
in the git history. The co-author line is a courtesy. If you're opening a
PR against entity's fork, their commits stay in the history anyway.

If squashing everything into your own commits, definitely credit entity.

---

## Step 7: Push

If opening a PR against entity's fork:

```bash
# Add your own fork as a remote
git remote add myfork https://github.com/mecattaf/quickshell.git
git push myfork webview
```

Then open a PR from `mecattaf/quickshell:webview` → `just-some-entity/quickshell:webview`.

If opening a new PR against upstream (because entity is unresponsive):

```bash
git remote add myfork https://github.com/mecattaf/quickshell.git
git push myfork webview
```

Then open a PR from `mecattaf/quickshell:webview` → `quickshell-mirror/quickshell:master`.
Reference #351 in the description:

```
Builds on the work from #351 by @just-some-entity. Addresses remaining
review feedback:
- Fixes style issues (#pragma once, lowercase includes, EOF newlines)
- Removes unnecessary try/catch
- Adds jemalloc runtime warning
- Adds manual test QML file
- Rebased onto current master
```

---

## Step 8: What to expect in review

Based on the PR analysis, outfoxxed will likely:

1. **Run the manual test QML himself** — make sure it works. Test it yourself
   first with `build/src/quickshell -p src/webengine/test/manual/webengine.qml`
   (built with `-DUSE_JEMALLOC=OFF`)

2. **Check the mangled symbol** — he already flagged this as "iffy". Be ready
   to explain: "The mangled name is stable for this specific function signature
   across GCC and Clang on Linux. The test catches any breakage at build time."

3. **Ask about the jemalloc situation** — your answer: "The pragma makes it
   opt-in, the warning makes the fix obvious, and the test QML lets anyone
   verify it works. Users who want WebEngine rebuild with -DUSE_JEMALLOC=OFF."

4. **Possibly ask about pragma naming** — `EnableQtWebEngineQuick` doesn't
   match the `Use*` convention. If he asks, suggest `UseWebEngine` as an
   alternative. But don't rename it preemptively — it's entity's choice and
   outfoxxed didn't flag it.

---

## What NOT to do

- Don't mention Claude Code or AI in the PR. CONTRIBUTING.md bans AI agents.
  You used Claude as a research tool, the code is yours, you understand every line.
- Don't add a boption, find_package, or hard link. Upstream wants zero build-time deps.
- Don't change the pragma default. It's off by default (pragma-gated).
- Don't try to fix the jemalloc conflict itself. It's a Chromium vs jemalloc issue,
  not something quickshell can solve. Just warn about it.
- Don't bundle unrelated changes. This PR is only about WebEngine init.
