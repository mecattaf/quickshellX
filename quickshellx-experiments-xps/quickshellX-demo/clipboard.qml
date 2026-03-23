//@ pragma UseWebEngine

import Quickshell
import Quickshell.Wayland
import QtWebEngine
import QtQuick

ShellRoot {
    PanelWindow {
        visible: true
        implicitWidth: 804
        implicitHeight: 504
        color: "transparent"
        exclusionMode: ExclusionMode.Ignore
        WlrLayershell.layer: WlrLayer.Overlay
        WlrLayershell.keyboardFocus: WlrKeyboardFocus.OnDemand

        WebEngineView {
            anchors.fill: parent
            backgroundColor: "transparent"
            url: "http://localhost:5173/embed/clipboard"
            settings.javascriptCanAccessClipboard: true
            onNewWindowRequested: function(request) {
                Qt.openUrlExternally(request.requestedUrl)
            }
        }
    }
}
