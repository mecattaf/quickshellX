//@ pragma UseWebEngine

import Quickshell
import Quickshell.Wayland
import QtWebEngine
import QtQuick

ShellRoot {
    PanelWindow {
        id: win
        visible: true
        implicitWidth: 704
        implicitHeight: 504
        color: "transparent"
        exclusionMode: ExclusionMode.Ignore
        WlrLayershell.layer: WlrLayer.Overlay
        WlrLayershell.keyboardFocus: WlrKeyboardFocus.OnDemand

        Rectangle {
            id: frame
            anchors.centerIn: parent
            width: 680
            height: 480
            radius: 12
            color: "transparent"
            clip: true

            WebEngineView {
                id: webView
                anchors.fill: parent
                backgroundColor: "transparent"
                Component.onCompleted: {
                    webView.url = "http://localhost:5173/launcher"
                }

                settings.javascriptCanAccessClipboard: true

                onNewWindowRequested: function(request) {
                    Qt.openUrlExternally(request.requestedUrl)
                }
            }
        }
    }
}
