import SwiftUI
import AppKit
import ToolTipCore

@main
struct ToolTipAssistantApp: App {
    @NSApplicationDelegateAdaptor(AssistantAppDelegate.self) var appDelegate

    var body: some Scene {
        MenuBarExtra("ToolTip Assistant", systemImage: "sparkle.magnifyingglass") {
            Button("Inspeccionar Pantalla (⌘ + Shift + A)") {
                appDelegate.triggerInspection()
            }
            .keyboardShortcut("A", modifiers: [.command, .shift])

            Divider()

            Button("Cerrar Assistant") {
                NSApplication.shared.terminate(nil)
            }
        }
    }
}

final class AssistantAppDelegate: NSObject, NSApplicationDelegate {
    private var hudPanel: NSPanel?

    func applicationDidFinishLaunching(_ notification: Notification) {
        GlobalHotkeyManager.shared.register { [weak self] in
            self?.triggerInspection()
        }
    }

    func application(_ application: NSApplication, open urls: [URL]) {
        for url in urls {
            if url.scheme == "tooltip-assistant" {
                triggerInspection()
            }
        }
    }

    func triggerInspection() {
        Task { @MainActor in
            guard let apiKey = AppGroupCoordinator.shared.getSharedApiKey(), !apiKey.isEmpty else {
                return
            }

            guard let capture = await ScreenCaptureManager.shared.captureMainDisplay() else {
                return
            }

            let frontmost = NSWorkspace.shared.frontmostApplication
            let processName = frontmost?.localizedName ?? "Finder"
            let windowTitle = frontmost?.localizedName ?? "macOS Window"

            let data = await GeminiClient.shared.analyzeScreen(
                imageBase64: capture.base64Image,
                processName: processName,
                windowTitle: windowTitle,
                apiKey: apiKey
            )

            showHud(with: data)
        }
    }

    private func showHud(with data: InspectionData) {
        if hudPanel == nil {
            let panel = NSPanel(
                contentRect: NSRect(x: 0, y: 0, width: 440, height: 300),
                styleMask: [.borderless, .nonactivatingPanel],
                backing: .buffered,
                defer: false
            )
            panel.isFloatingPanel = true
            panel.level = .floating
            panel.backgroundColor = .clear
            panel.isOpaque = false
            panel.hasShadow = false
            self.hudPanel = panel
        }

        let hudView = HudView(data: data) { [weak self] in
            self?.hudPanel?.orderOut(nil)
        }

        hudPanel?.contentView = NSHostingView(rootView: hudView)

        if let screen = NSScreen.main {
            let screenRect = screen.visibleFrame
            let x = screenRect.midX - 220
            let y = screenRect.midY - 150
            hudPanel?.setFrameOrigin(NSPoint(x: x, y: y))
        }

        hudPanel?.orderFrontRegardless()
    }
}
