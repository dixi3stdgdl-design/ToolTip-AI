import SwiftUI
import AppKit
import ToolTipCore

@main
struct ToolTipAuraApp: App {
    @NSApplicationDelegateAdaptor(AuraAppDelegate.self) var appDelegate

    var body: some Scene {
        MenuBarExtra("ToolTip Aura", systemImage: "target") {
            Button(appDelegate.isAuraActive ? "Desactivar Aura Cursor" : "Activar Aura Cursor") {
                appDelegate.toggleAura()
            }
            Divider()
            Button("Cerrar Aura") {
                NSApplication.shared.terminate(nil)
            }
        }
    }
}

final class AuraAppDelegate: NSObject, NSApplicationDelegate {
    var isAuraActive = false
    private var overlayWindow: NSWindow?
    private var trackingTimer: Timer?

    func applicationDidFinishLaunching(_ notification: Notification) {
        setupOverlay()
    }

    func application(_ application: NSApplication, open urls: [URL]) {
        for url in urls {
            if url.scheme == "tooltip-aura" {
                toggleAura()
            }
        }
    }

    func toggleAura() {
        isAuraActive.toggle()
        if isAuraActive {
            overlayWindow?.orderFrontRegardless()
            startTracking()
        } else {
            overlayWindow?.orderOut(nil)
            stopTracking()
        }
    }

    private func setupOverlay() {
        guard let screen = NSScreen.main else { return }
        let window = NSWindow(
            contentRect: screen.frame,
            styleMask: [.borderless],
            backing: .buffered,
            defer: false
        )
        window.level = .floating
        window.backgroundColor = .clear
        window.isOpaque = false
        window.ignoresMouseEvents = true
        window.hasShadow = false

        window.contentView = NSHostingView(rootView: AuraOverlayView())
        self.overlayWindow = window
    }

    private func startTracking() {
        trackingTimer = Timer.scheduledTimer(withTimeInterval: 0.03, repeats: true) { [weak self] _ in
            self?.overlayWindow?.contentView?.needsDisplay = true
        }
    }

    private func stopTracking() {
        trackingTimer?.invalidate()
        trackingTimer = nil
    }
}

struct AuraOverlayView: View {
    @State private var mousePos: CGPoint = .zero

    var body: some View {
        GeometryReader { _ in
            let pos = NSEvent.mouseLocation
            ZStack {
                // Anillo de enfoque suave alrededor del cursor
                Circle()
                    .stroke(Color.cyan.opacity(0.4), lineWidth: 2)
                    .frame(width: 48, height: 48)
                    .position(x: pos.x, y: (NSScreen.main?.frame.height ?? 1080) - pos.y)

                Circle()
                    .fill(Color.cyan.opacity(0.12))
                    .frame(width: 48, height: 48)
                    .position(x: pos.x, y: (NSScreen.main?.frame.height ?? 1080) - pos.y)
            }
        }
    }
}
