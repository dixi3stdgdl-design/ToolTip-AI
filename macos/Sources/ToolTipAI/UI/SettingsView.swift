import SwiftUI

public struct SettingsView: View {
    @State private var apiKey: String = ""
    @State private var saveStatus: String = ""
    @State private var isSaved: Bool = false

    public init() {}

    public var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            HStack(spacing: 10) {
                Image(systemName: "sparkle.magnifyingglass")
                    .font(.largeTitle)
                    .foregroundColor(.accentColor)
                VStack(alignment: .leading) {
                    Text("ToolTip AI Mac")
                        .font(.title2.bold())
                    Text("Cognitive Screen Inspector & Decision Engine")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            Divider()

            VStack(alignment: .leading, spacing: 6) {
                Text("Google Gemini API Key:")
                    .font(.headline)
                SecureField("Ingresa tu clave de API (AIzaSy...)", text: $apiKey)
                    .textFieldStyle(.roundedBorder)

                Text("Tu clave se almacena de forma segura en el Keychain nativo de macOS.")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }

            HStack {
                Button("Guardar en Keychain") {
                    if KeychainVault.saveApiKey(apiKey) {
                        saveStatus = "¡Guardado exitosamente!"
                        isSaved = true
                    } else {
                        saveStatus = "Error al guardar en Keychain."
                        isSaved = false
                    }
                }
                .buttonStyle(.borderedProminent)

                if !saveStatus.isEmpty {
                    Text(saveStatus)
                        .font(.caption)
                        .foregroundColor(isSaved ? .green : .red)
                }
            }

            Divider()

            VStack(alignment: .leading, spacing: 8) {
                Text("Atajo de activación:")
                    .font(.subheadline.bold())
                HStack {
                    Text("⌘ + Shift + A")
                        .font(.system(size: 13, weight: .bold, design: .monospaced))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.secondary.opacity(0.15))
                        .cornerRadius(6)
                    Text("o haz clic en el icono de la barra de menú.")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            Spacer()

            HStack {
                Text("Bundle ID: com.dixi3labs.tooltipai • v1.0.0")
                    .font(.system(size: 10))
                    .foregroundColor(.secondary)
                Spacer()
                Text("© 2026 Dixi3 Labs")
                    .font(.system(size: 10))
                    .foregroundColor(.secondary)
            }
        }
        .padding(24)
        .frame(width: 480, height: 320)
        .onAppear {
            if let saved = KeychainVault.loadApiKey() {
                self.apiKey = saved
                self.saveStatus = "Clave activa configurada."
                self.isSaved = true
            }
        }
    }
}
