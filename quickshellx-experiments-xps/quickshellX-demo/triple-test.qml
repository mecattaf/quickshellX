//@ pragma UseWebEngine

import Quickshell
import Quickshell.Wayland
import QtWebEngine
import QtQuick

ShellRoot {
    // ─── Top Bar ───
    PanelWindow {
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
        }
    }

    // ─── App Launcher (overlay) ───
    PanelWindow {
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
        }
    }

    // ─── Agent (as PanelWindow since FloatingWindow in same ShellRoot) ───
    PanelWindow {
        visible: true
        implicitWidth: 740
        implicitHeight: 520
        color: "transparent"
        exclusionMode: ExclusionMode.Ignore
        WlrLayershell.layer: WlrLayer.Overlay
        WlrLayershell.keyboardFocus: WlrKeyboardFocus.OnDemand

        WebEngineView {
            anchors.fill: parent
            backgroundColor: "transparent"
            url: "http://localhost:5173/embed/shell/agent"
            settings.javascriptCanAccessClipboard: true
        }
    }
}
