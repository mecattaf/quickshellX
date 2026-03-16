//@ pragma UseWebEngine

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
