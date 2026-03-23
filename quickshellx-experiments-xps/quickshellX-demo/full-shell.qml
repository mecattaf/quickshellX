//@ pragma UseWebEngine

import Quickshell
import Quickshell.Wayland
import QtWebEngine
import QtQuick

ShellRoot {
    // ─── Top Bar ───
    PanelWindow {
        id: topbar
        visible: true
        color: "transparent"
        implicitHeight: 28

        anchors {
            top: true
            left: true
            right: true
        }

        exclusionMode: ExclusionMode.Auto
        WlrLayershell.layer: WlrLayer.Top
        WlrLayershell.keyboardFocus: WlrKeyboardFocus.None

        WebEngineView {
            anchors.fill: parent
            backgroundColor: "transparent"
            url: "http://localhost:5173/embed/shell/topbar"
            settings.javascriptCanAccessClipboard: true
            onNewWindowRequested: function(request) {
                Qt.openUrlExternally(request.requestedUrl)
            }
        }
    }

    // ─── App Launcher (overlay) ───
    PanelWindow {
        id: launcher
        visible: true
        implicitWidth: 704
        implicitHeight: 504
        color: "transparent"
        exclusionMode: ExclusionMode.Ignore
        WlrLayershell.layer: WlrLayer.Overlay
        WlrLayershell.keyboardFocus: WlrKeyboardFocus.OnDemand

        WebEngineView {
            anchors.fill: parent
            backgroundColor: "transparent"
            url: "http://localhost:5173/embed/app-launcher"
            settings.javascriptCanAccessClipboard: true
            onNewWindowRequested: function(request) {
                Qt.openUrlExternally(request.requestedUrl)
            }
        }
    }
}
