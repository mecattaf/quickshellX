//@ pragma UseWebEngine

import Quickshell
import Quickshell.Wayland
import QtWebEngine
import QtWebChannel
import QtQuick

ShellRoot {
    PanelWindow {
        id: win
        visible: true
        implicitWidth: 420
        implicitHeight: 260
        color: "transparent"

        exclusionMode: ExclusionMode.Ignore
        WlrLayershell.layer: WlrLayer.Overlay
        WlrLayershell.keyboardFocus: WlrKeyboardFocus.OnDemand

        anchors {
            top: true
            right: true
        }

        margins {
            top: 16
            right: 16
        }

        Rectangle {
            id: frame
            anchors.fill: parent
            radius: 12
            color: "transparent"
            clip: true

            WebEngineView {
                id: webView
                anchors.fill: parent
                backgroundColor: "transparent"

                Component.onCompleted: {
                    webView.url = "http://localhost:5173"
                }

                onNewWindowRequested: function(request) {
                    Qt.openUrlExternally(request.requestedUrl)
                }
            }
        }
    }
}
