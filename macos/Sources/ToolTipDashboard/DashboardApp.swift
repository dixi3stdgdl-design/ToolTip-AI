import SwiftUI
import AppKit
import ToolTipCore

@main
struct ToolTipDashboardApp: App {
    @NSApplicationDelegateAdaptor(DashboardAppDelegate.self) var appDelegate

    var body: some Scene {
        WindowGroup {
            CockpitView()
        }
        .windowStyle(.hiddenTitleBar)
        .defaultSize(width: 820, height: 560)

        MenuBarExtra("ToolTip AI Cockpit", systemImage: "square.grid.2x2") {
            Button("Abrir Dashboard") {
                appDelegate.openMainWindow()
            }
            Divider()
            ForEach(SuiteModuleId.allCases) { module in
                Button("Iniciar \(module.displayName)") {
                    AppGroupCoordinator.shared.launchModule(module)
                }
            }
            Divider()
            Button("Salir de ToolTip Suite") {
                NSApplication.shared.terminate(nil)
            }
        }
    }
}

final class DashboardAppDelegate: NSObject, NSApplicationDelegate {
    func openMainWindow() {
        NSApp.activate(ignoringOtherApps: true)
        if let window = NSApp.windows.first {
            window.makeKeyAndOrderFront(nil)
        }
    }
}

struct CockpitView: View {
    @State private var apiKey: String = ""
    @State private var savedKeyMessage: String = ""
    @State private var activeModules: Set<String> = []

    var body: some View {
        HStack(spacing: 0) {
            // Sidebar izquierdo: Identidad de Marca y Ajustes Core
            VStack(alignment: .leading, spacing: 20) {
                HStack(spacing: 10) {
                    Image(systemName: "sparkle.magnifyingglass")
                        .font(.system(size: 24, weight: .bold))
                        .foregroundColor(.accentColor)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("ToolTip AI")
                            .font(.system(size: 18, weight: .bold))
                        Text("Suite Cockpit • macOS")
                            .font(.system(size: 11))
                            .foregroundColor(.secondary)
                    }
                }
                .padding(.top, 16)

                Divider()

                VStack(alignment: .leading, spacing: 8) {
                    Text("Google Gemini API")
                        .font(.caption.bold())
                        .foregroundColor(.secondary)

                    SecureField("Clave AIzaSy...", text: $apiKey)
                        .textFieldStyle(.roundedBorder)

                    Button("Sincronizar Suite") {
                        AppGroupCoordinator.shared.setSharedApiKey(apiKey)
                        savedKeyMessage = "✓ Sincronizado en Keychain & App Group"
                    }
                    .buttonStyle(.borderedProminent)
                    .controlSize(.small)

                    if !savedKeyMessage.isEmpty {
                        Text(savedKeyMessage)
                            .font(.system(size: 10))
                            .foregroundColor(.green)
                    }
                }

                Spacer()

                VStack(alignment: .leading, spacing: 6) {
                    Text("BUNDLE SUITE LICENCIA")
                        .font(.system(size: 9, weight: .bold))
                        .foregroundColor(.secondary)
                    Text("$48.88 USD")
                        .font(.title3.bold())
                    Text("5 Apps + Companion • Dixi3 Labs")
                        .font(.system(size: 10))
                        .foregroundColor(.secondary)
                }
                .padding(12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color.secondary.opacity(0.1))
                .cornerRadius(10)
            }
            .padding(20)
            .frame(width: 260)
            .background(Color(NSColor.controlBackgroundColor))

            Divider()

            // Panel Principal: Las 5 Aplicaciones Desacopladas
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Ecosistema de Módulos")
                                .font(.title2.bold())
                            Text("Cada herramienta opera como un proceso desacoplado bajo demanda.")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        Spacer()
                    }
                    .padding(.top, 16)

                    LazyVStack(spacing: 12) {
                        ForEach(SuiteModuleId.allCases) { module in
                            ModuleCardView(module: module)
                        }
                    }
                }
                .padding(24)
            }
            .background(Color(NSColor.windowBackgroundColor))
        }
        .onAppear {
            if let existing = AppGroupCoordinator.shared.getSharedApiKey() {
                self.apiKey = existing
            }
        }
    }
}

struct ModuleCardView: View {
    let module: SuiteModuleId
    @State private var isHovered = false

    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: module.iconName)
                .font(.system(size: 24))
                .foregroundColor(.accentColor)
                .frame(width: 44, height: 44)
                .background(Color.accentColor.opacity(0.12))
                .clipShape(RoundedRectangle(cornerRadius: 10))

            VStack(alignment: .leading, spacing: 3) {
                HStack(spacing: 8) {
                    Text(module.displayName)
                        .font(.system(size: 14, weight: .bold))
                    Text(module.regularPriceUSD)
                        .font(.system(size: 10, weight: .semibold))
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color.secondary.opacity(0.15))
                        .cornerRadius(4)
                }

                Text(module.subtitle)
                    .font(.system(size: 12))
                    .foregroundColor(.secondary)
                    .lineLimit(1)
            }

            Spacer()

            Button(action: {
                AppGroupCoordinator.shared.launchModule(module)
            }) {
                HStack(spacing: 4) {
                    Image(systemName: "arrow.up.forward.app")
                    Text("Lanzar")
                }
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.regular)
        }
        .padding(14)
        .background(Color(NSColor.controlBackgroundColor))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.secondary.opacity(0.15), lineWidth: 1)
        )
    }
}
