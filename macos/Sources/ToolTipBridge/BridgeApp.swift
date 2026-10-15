import SwiftUI
import AppKit
import Network
import ToolTipCore

@main
struct ToolTipBridgeApp: App {
    @NSApplicationDelegateAdaptor(BridgeAppDelegate.self) var appDelegate

    var body: some Scene {
        MenuBarExtra("ToolTip Bridge", systemImage: "antenna.radiowaves.left.and.right") {
            Text("Puerto Local: 8765")
                .font(.caption)
            Divider()
            Button(appDelegate.isRunning ? "Reiniciar Servidor Bridge" : "Iniciar Servidor Bridge") {
                appDelegate.restartServer()
            }
            Divider()
            Button("Cerrar Bridge") {
                NSApplication.shared.terminate(nil)
            }
        }
    }
}

final class BridgeAppDelegate: NSObject, NSApplicationDelegate {
    private var listener: NWListener?
    var isRunning = false

    func applicationDidFinishLaunching(_ notification: Notification) {
        startServer()
    }

    func application(_ application: NSApplication, open urls: [URL]) {
        for url in urls {
            if url.scheme == "tooltip-bridge" {
                restartServer()
            }
        }
    }

    func startServer() {
        do {
            let parameters = NWParameters.tcp
            self.listener = try NWListener(using: parameters, on: 8765)
            self.listener?.stateUpdateHandler = { [weak self] state in
                switch state {
                case .ready:
                    print("[ToolTipBridge] Servidor LAN listo en puerto 8765.")
                    self?.isRunning = true
                case .failed(let error):
                    print("[ToolTipBridge] Fallo de servidor LAN: \(error)")
                    self?.isRunning = false
                default:
                    break
                }
            }
            self.listener?.newConnectionHandler = { connection in
                connection.start(queue: .main)
                // Enviar handshake inicial al cliente móvil Android Companion
                let welcome = "{\"status\":\"connected\",\"server\":\"ToolTip AI Mac Bridge\",\"version\":\"1.0.0\"}\n"
                if let data = welcome.data(using: .utf8) {
                    connection.send(content: data, completion: .idempotent)
                }
            }
            self.listener?.start(queue: .main)
        } catch {
            print("[ToolTipBridge] No se pudo iniciar el listener: \(error)")
        }
    }

    func restartServer() {
        listener?.cancel()
        startServer()
    }
}
