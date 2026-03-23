//@ pragma UseWebEngine

import Quickshell
import QtWebEngine
import QtQuick

ShellRoot {
    FloatingWindow {
        visible: true
        implicitWidth: 740
        implicitHeight: 520
        color: "transparent"
        title: "Agent Manager"

        WebEngineView {
            anchors.fill: parent
            backgroundColor: "transparent"
            url: "http://localhost:5173/embed/shell/agent"
            settings.javascriptCanAccessClipboard: true
            onNewWindowRequested: function(request) {
                Qt.openUrlExternally(request.requestedUrl)
            }
        }
    }
}
