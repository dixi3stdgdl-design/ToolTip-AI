import SwiftUI
import ToolTipCore

public struct HudView: View {
    public let data: InspectionData
    public var onClose: () -> Void

    public init(data: InspectionData, onClose: @escaping () -> Void) {
        self.data = data
        self.onClose = onClose
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            // Header: Nombre y badges
            HStack(alignment: .center) {
                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: 8) {
                        Image(systemName: "sparkle.magnifyingglass")
                            .foregroundColor(.accentColor)
                            .font(.headline)
                        Text(data.name)
                            .font(.system(size: 16, weight: .bold))
                            .lineLimit(1)
                    }
                    Text("\(data.processName) • \(data.controlType)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()

                // Badge de Seguridad / Riesgo
                Text(data.safetyTag)
                    .font(.caption.bold())
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(data.riskColor.opacity(0.2))
                    .foregroundColor(data.riskColor)
                    .clipShape(Capsule())

                Button(action: onClose) {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(.secondary)
                        .font(.title3)
                }
                .buttonStyle(.plain)
            }

            Divider()

            // Cuadrante 1 y 2: Resumen Funcional y Naturaleza
            VStack(alignment: .leading, spacing: 6) {
                Label("Explicación Funcional", systemImage: "info.circle")
                    .font(.caption.bold())
                    .foregroundColor(.secondary)
                Text(data.summary.isEmpty ? data.verdictText : data.summary)
                    .font(.system(size: 13))
                    .fixedSize(horizontal: false, vertical: true)
            }

            if !data.nature.isEmpty {
                VStack(alignment: .leading, spacing: 4) {
                    Label("Mecanismo", systemImage: "gearshape")
                        .font(.caption.bold())
                        .foregroundColor(.secondary)
                    Text(data.nature)
                        .font(.system(size: 12))
                        .foregroundColor(.secondary)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }

            // Cuadrante 3: Impacto y Consecuencias
            if !data.impact.isEmpty || !data.consequences.isEmpty {
                HStack(alignment: .top, spacing: 12) {
                    if !data.impact.isEmpty {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Impacto")
                                .font(.caption.bold())
                                .foregroundColor(.secondary)
                            Text(data.impact)
                                .font(.system(size: 12))
                                .fixedSize(horizontal: false, vertical: true)
                        }
                    }
                    if !data.consequences.isEmpty {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Consecuencias")
                                .font(.caption.bold())
                                .foregroundColor(data.riskColor)
                            Text(data.consequences)
                                .font(.system(size: 12))
                                .fixedSize(horizontal: false, vertical: true)
                        }
                    }
                }
            }

            // Cuadrante 4: Consejo Pro & Snippet Terminal
            VStack(alignment: .leading, spacing: 6) {
                Label("Consejo Didáctico Pro", systemImage: "lightbulb.fill")
                    .font(.caption.bold())
                    .foregroundColor(.yellow)
                Text(data.expertAdvice.isEmpty ? data.summary : data.expertAdvice)
                    .font(.system(size: 12))
                    .fixedSize(horizontal: false, vertical: true)

                if !data.cliSnippet.isEmpty && data.cliSnippet != "# macOS: N/A" {
                    Text(data.cliSnippet)
                        .font(.system(size: 11, design: .monospaced))
                        .padding(8)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(Color.black.opacity(0.3))
                        .cornerRadius(6)
                }
            }

            // Footer
            HStack {
                Text(data.confidence)
                    .font(.system(size: 10))
                    .foregroundColor(.secondary)
                Spacer()
                Text("Dixi3 Labs • ToolTip AI Mac")
                    .font(.system(size: 10))
                    .foregroundColor(.secondary)
            }
        }
        .padding(18)
        .frame(width: 440)
        .background(.ultraThinMaterial)
        .cornerRadius(14)
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(Color.white.opacity(0.15), lineWidth: 1)
        )
        .shadow(color: .black.opacity(0.3), radius: 20, x: 0, y: 10)
    }
}
