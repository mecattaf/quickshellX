//@ pragma UseWebEngine

import Quickshell
import QtWebEngine
import QtQuick

ShellRoot {
    FloatingWindow {
        visible: true
        implicitWidth: 960
        implicitHeight: 800
        color: "transparent"
        title: "Faraya Design System"

        WebEngineView {
            anchors.fill: parent
            backgroundColor: "transparent"
            url: "http://localhost:5173/embed/design"
            settings.javascriptCanAccessClipboard: true
            onNewWindowRequested: function(request) {
                Qt.openUrlExternally(request.requestedUrl)
            }
        }
    }
}
