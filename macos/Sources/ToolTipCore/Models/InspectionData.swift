import Foundation
import SwiftUI

public struct InspectionData: Codable, Identifiable, Sendable {
    public var id: UUID = UUID()

    public var name: String = "Elemento de Pantalla"
    public var controlType: String = "macOS_Control"
    public var confidence: String = "99.8% Certeza"
    public var ocrText: String = ""
    public var verdictText: String = "Análisis completado"
    public var safetyTag: String = "Seguro"
    public var actionTag: String = "Inspeccionar"
    public var summary: String = ""
    public var nature: String = ""
    public var impact: String = ""
    public var riskLevel: String = "Bajo"
    public var riskClass: String = "safe" // "safe", "warning", "danger"
    public var consequences: String = ""
    public var expertAdvice: String = ""
    public var nativeValue: String = ""
    public var nativeHelpText: String = ""
    public var parentContainer: String = ""
    public var frameworkId: String = "AppKit"
    public var vendor: String = "Apple / Tercero"
    public var signStatus: String = "Verificado"
    public var exePath: String = ""
    public var resources: String = "Consumo estándar"
    public var accessKey: String = "Cmd + Clic"
    public var cliSnippet: String = "# Terminal:\nsw_vers"
    public var domainType: String = "system"

    public var processName: String = "Finder"
    public var processId: UInt32 = 0
    public var imageBase64: String? = nil

    enum CodingKeys: String, CodingKey {
        case name, controlType, confidence, ocrText, verdictText
        case safetyTag, actionTag, summary, nature, impact
        case riskLevel, riskClass, consequences, expertAdvice
        case nativeValue, nativeHelpText, parentContainer, frameworkId
        case vendor, signStatus, exePath, resources, accessKey
        case cliSnippet, domainType
    }

    public var riskColor: Color {
        switch riskClass.lowercased() {
        case "danger", "critical", "critico", "alto":
            return .red
        case "warning", "precaucion", "medio":
            return .orange
        default:
            return .green
        }
    }
}
