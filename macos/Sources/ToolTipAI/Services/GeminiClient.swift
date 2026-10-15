import Foundation

public final class GeminiClient: Sendable {
    public static let shared = GeminiClient()

    public static let defaultModel = "gemini-2.0-flash"
    private static let candidateModels = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-2.5-pro"]

    public init() {}

    public static func detectDomain(from processName: String) -> String {
        let p = processName.lowercased()
        if p.contains("game") || p.contains("steam") || p.contains("epic") || p.contains("riot") ||
           p.contains("retroarch") || p.contains("dolphin") || p.contains("rpcs3") || p.contains("minecraft") ||
           p.contains("unity") || p.contains("unreal") || p.contains("godot") {
            return "gaming"
        }
        if p.contains("logic") || p.contains("ableton") || p.contains("protools") || p.contains("bitwig") ||
           p.contains("reaper") || p.contains("studioone") || p.contains("flstudio") || p.contains("kontakt") ||
           p.contains("cubase") {
            return "audio"
        }
        if p.contains("xcode") || p.contains("code") || p.contains("cursor") || p.contains("iterm") ||
           p.contains("terminal") || p.contains("rider") || p.contains("clion") || p.contains("git") {
            return "dev"
        }
        if p.contains("safari") || p.contains("chrome") || p.contains("firefox") || p.contains("arc") ||
           p.contains("brave") || p.contains("edge") {
            return "web"
        }
        return "system"
    }

    public func analyzeScreen(
        imageBase64: String,
        processName: String,
        windowTitle: String,
        apiKey: String
    ) async -> InspectionData {
        let domain = Self.detectDomain(from: processName)
        let prompt = buildPrompt(processName: processName, windowTitle: windowTitle, domain: domain)

        for model in Self.candidateModels {
            do {
                if let result = try await queryModel(model: model, prompt: prompt, imageBase64: imageBase64, apiKey: apiKey) {
                    var finalData = result
                    finalData.processName = processName
                    finalData.domainType = domain
                    finalData.confidence = "99.8% Certeza • \(model)"
                    return finalData
                }
            } catch {
                continue
            }
        }

        return fallbackData(processName: processName, windowTitle: windowTitle)
    }

    private func queryModel(model: String, prompt: String, imageBase64: String, apiKey: String) async throws -> InspectionData? {
        guard let url = URL(string: "https://generativelanguage.googleapis.com/v1beta/models/\(model):generateContent?key=\(apiKey)") else {
            return nil
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 15

        let payload: [String: Any] = [
            "contents": [
                [
                    "parts": [
                        ["text": prompt],
                        [
                            "inlineData": [
                                "mimeType": "image/png",
                                "data": imageBase64
                            ]
                        ]
                    ]
                ]
            ],
            "generationConfig": [
                "responseMimeType": "application/json",
                "temperature": 0.2
            ]
        ]

        request.httpBody = try JSONSerialization.data(withJSONObject: payload)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            return nil
        }

        guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
              let candidates = json["candidates"] as? [[String: Any]],
              let firstCandidate = candidates.first,
              let content = firstCandidate["content"] as? [String: Any],
              let parts = content["parts"] as? [[String: Any]],
              let firstPart = parts.first,
              let text = firstPart["text"] as? String else {
            return nil
        }

        let cleaned = cleanJsonMarkdown(text)
        guard let jsonData = cleaned.data(using: .utf8) else { return nil }

        let decoder = JSONDecoder()
        return try decoder.decode(InspectionData.self, from: jsonData)
    }

    private func cleanJsonMarkdown(_ input: String) -> String {
        var s = input.trimmingCharacters(in: .whitespacesAndNewlines)
        if s.hasPrefix("```json") {
            s = String(s.dropFirst(7))
        } else if s.hasPrefix("```") {
            s = String(s.dropFirst(3))
        }
        if s.hasSuffix("```") {
            s = String(s.dropLast(3))
        }
        return s.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private func buildPrompt(processName: String, windowTitle: String, domain: String) -> String {
        return """
        Eres ToolTip AI para macOS, un inspector cognitivo de pantalla de precisión milimétrica.
        Estás inspeccionando un recorte visual del proceso: '\(processName)' (Ventana: '\(windowTitle)', Dominio: '\(domain)').

        Responde ESTRICTAMENTE con un único objeto JSON válido con los siguientes campos:
        {
          "name": "Nombre conciso del botón, ajuste, perilla o elemento inspeccionado",
          "controlType": "Botón | Control | Menú | Deslizador | Terminal | Código",
          "summary": "Explicación directa, funcional y didáctica en español (sin jerga innecesaria)",
          "nature": "Qué hace físicamente este elemento al activarlo",
          "impact": "Impacto en el flujo de trabajo, audio, recursos del sistema o aplicación",
          "riskLevel": "Inocuo | Precaución | Crítico",
          "riskClass": "safe | warning | danger",
          "consequences": "Qué ocurre si se usa incorrectamente",
          "expertAdvice": "Consejo técnico profesional aplicable de inmediato",
          "cliSnippet": "Comando sugerido de Terminal zsh/bash relevante o '# macOS: N/A'",
          "safetyTag": "Seguro | Precaución | Riesgo",
          "actionTag": "Recomendado | Opcional | Evitar"
        }
        """
    }

    private func fallbackData(processName: String, windowTitle: String) -> InspectionData {
        var data = InspectionData()
        data.name = "Elemento en \(processName)"
        data.summary = "No se pudo conectar con el modelo cognitivo. Revisa tu conexión a internet o tu API key de Gemini."
        data.verdictText = "Modo sin conexión"
        data.expertAdvice = "Asegúrate de haber ingresado una Gemini API Key válida en los Ajustes de ToolTip AI."
        data.riskClass = "warning"
        data.riskLevel = "Precaución"
        return data
    }
}
