import Foundation
import SwiftUI

public enum SuiteModuleId: String, CaseIterable, Identifiable, Codable, Sendable {
    case assistant = "assistant"
    case translate = "translate"
    case aura = "aura"
    case voice = "voice"
    case bridge = "bridge"

    public var id: String { rawValue }

    public var displayName: String {
        switch self {
        case .assistant: return "ToolTip AI Assistant"
        case .translate: return "ToolTip AI Translate"
        case .aura: return "ToolTip AI Aura"
        case .voice: return "ToolTip AI Voice"
        case .bridge: return "ToolTip AI Bridge"
        }
    }

    public var subtitle: String {
        switch self {
        case .assistant: return "Inspector cognitivo de pantalla en 4 cuadrantes"
        case .translate: return "Traducción flotante instantánea con OCR local y Gemini"
        case .aura: return "Resaltado contextual inteligente, cursor beam y dwell radar"
        case .voice: return "Dictado neuronal ultra-rápido y lectura auditiva TTS"
        case .bridge: return "Enlace local y sincronización con app móvil Android"
        }
    }

    public var urlScheme: String {
        switch self {
        case .assistant: return "tooltip-assistant://"
        case .translate: return "tooltip-translate://"
        case .aura: return "tooltip-aura://"
        case .voice: return "tooltip-voice://"
        case .bridge: return "tooltip-bridge://"
        }
    }

    public var bundleIdentifier: String {
        switch self {
        case .assistant: return "com.dixi3labs.tooltipai.assistant"
        case .translate: return "com.dixi3labs.tooltipai.translate"
        case .aura: return "com.dixi3labs.tooltipai.aura"
        case .voice: return "com.dixi3labs.tooltipai.voice"
        case .bridge: return "com.dixi3labs.tooltipai.bridge"
        }
    }

    public var iconName: String {
        switch self {
        case .assistant: return "sparkle.magnifyingglass"
        case .translate: return "character.bubble"
        case .aura: return "target"
        case .voice: return "mic.fill"
        case .bridge: return "antenna.radiowaves.left.and.right"
        }
    }

    public var regularPriceUSD: String {
        switch self {
        case .assistant: return "Gratis con Suite / $9.99"
        case .translate: return "$9.99 USD"
        case .aura: return "$9.99 USD"
        case .voice: return "$9.99 USD"
        case .bridge: return "$9.99 USD"
        }
    }
}

public struct ModuleRuntimeStatus: Identifiable, Sendable {
    public var id: SuiteModuleId
    public var isRunning: Bool
    public var memoryUsageMB: Double
    public var version: String

    public init(id: SuiteModuleId, isRunning: Bool = false, memoryUsageMB: Double = 0.0, version: String = "1.0.0") {
        self.id = id
        self.isRunning = isRunning
        self.memoryUsageMB = memoryUsageMB
        self.version = version
    }
}
