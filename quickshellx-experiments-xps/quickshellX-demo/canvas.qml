//@ pragma UseWebEngine

import Quickshell
import QtWebEngine
import QtQuick

ShellRoot {
    FloatingWindow {
        visible: true
        implicitWidth: 900
        implicitHeight: 520
        color: "transparent"
        title: "Claude Imagine Canvas"

        WebEngineView {
            anchors.fill: parent
            backgroundColor: "transparent"
            url: "http://localhost:5173/embed/shell/canvas"
            settings.javascriptCanAccessClipboard: true
            onNewWindowRequested: function(request) {
                Qt.openUrlExternally(request.requestedUrl)
            }
        }
    }
}
