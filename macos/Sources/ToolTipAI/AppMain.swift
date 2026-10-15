import SwiftUI
import AppKit

@main
struct ToolTipMacApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate

    var body: some Scene {
        MenuBarExtra("ToolTip AI", systemImage: "sparkle.magnifyingglass") {
            Button("Inspeccionar Pantalla (⌘ + Shift + A)") {
                appDelegate.triggerInspection()
            }
            .keyboardShortcut("A", modifiers: [.command, .shift])

            Divider()

            Button("Ajustes & API Key...") {
                appDelegate.openSettings()
            }

            Divider()

            Button("Salir de ToolTip AI") {
                NSApplication.shared.terminate(nil)
            }
        }
    }
}

final class AppDelegate: NSObject, NSApplicationDelegate {
    private var hudPanel: NSPanel?
    private var settingsWindow: NSWindow?

    func applicationDidFinishLaunching(_ notification: Notification) {
        // Registrar atajo global sin pedir permisos de accesibilidad
        GlobalHotkeyManager.shared.register { [weak self] in
            self?.triggerInspection()
        }
    }

    func triggerInspection() {
        Task { @MainActor in
            guard let apiKey = KeychainVault.loadApiKey(), !apiKey.isEmpty else {
                openSettings()
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

        // Centrar HUD en la pantalla principal o cerca del cursor
        if let screen = NSScreen.main {
            let screenRect = screen.visibleFrame
            let x = screenRect.midX - 220
            let y = screenRect.midY - 150
            hudPanel?.setFrameOrigin(NSPoint(x: x, y: y))
        }

        hudPanel?.orderFrontRegardless()
    }

    func openSettings() {
        if settingsWindow == nil {
            let window = NSWindow(
                contentRect: NSRect(x: 0, y: 0, width: 480, height: 320),
                styleMask: [.titled, .closable],
                backing: .buffered,
                defer: false
            )
            window.title = "Ajustes de ToolTip AI"
            window.center()
            window.contentView = NSHostingView(rootView: SettingsView())
            self.settingsWindow = window
        }
        settingsWindow?.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
    }
}
