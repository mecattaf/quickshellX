  For the spec file, the key gotchas beyond what's in QUICKSHELLX.md:

  - cpptrace isn't packaged in Fedora 44 — the existing quickshell-git spec likely uses VENDOR_CPPTRACE=ON
  with FetchContent. Keep that as-is.
  - qt6-qtwebchannel is the sneaky runtime dep — it's never referenced in CMake, only loaded dynamically when
  QML hits import QtWebChannel. Easy to miss in a spec.
  - Package naming — if you want both vanilla quickshell and quickshellX installable, you'll need a different
  binary name or a Conflicts: quickshell. Since your shell configs are in ~/.config/quickshell/ either way, a
  Provides: quickshell + Conflicts: quickshell is probably cleanest.
 
