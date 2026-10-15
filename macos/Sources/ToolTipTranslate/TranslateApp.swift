import SwiftUI
import AppKit
import Vision
import ToolTipCore

@main
struct ToolTipTranslateApp: App {
    @NSApplicationDelegateAdaptor(TranslateAppDelegate.self) var appDelegate

    var body: some Scene {
        MenuBarExtra("ToolTip Translate", systemImage: "character.bubble") {
            Button("Traducir Área en Pantalla") {
                appDelegate.startTranslate()
            }
            Divider()
            Button("Cerrar Translate") {
                NSApplication.shared.terminate(nil)
            }
        }
    }
}

final class TranslateAppDelegate: NSObject, NSApplicationDelegate {
    private var translateWindow: NSPanel?

    func application(_ application: NSApplication, open urls: [URL]) {
        for url in urls {
            if url.scheme == "tooltip-translate" {
                startTranslate()
            }
        }
    }

    func startTranslate() {
        Task { @MainActor in
            guard let capture = await ScreenCaptureManager.shared.captureMainDisplay() else { return }
            guard let tiffData = capture.image.tiffRepresentation,
                  let cgImage = NSBitmapImageRep(data: tiffData)?.cgImage else { return }

            // OCR en el Apple Neural Engine local
            let request = VNRecognizeTextRequest()
            request.recognitionLevel = .accurate
            request.usesLanguageCorrection = true

            let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
            do {
                try handler.perform([request])
                guard let results = request.results, !results.isEmpty else {
                    showTranslationHUD(originalText: "Sin texto", translatedText: "No se detectó texto en la pantalla.")
                    return
                }

                let detectedStrings = results.compactMap { $0.topCandidates(1).first?.string }
                let fullText = detectedStrings.joined(separator: "\n")

                // Si hay API key disponible, traducimos semánticamente con Gemini
                if let apiKey = AppGroupCoordinator.shared.getSharedApiKey(), !apiKey.isEmpty {
                    let translated = await translateWithGemini(text: fullText, apiKey: apiKey)
                    showTranslationHUD(originalText: fullText, translatedText: translated)
                } else {
                    showTranslationHUD(originalText: fullText, translatedText: "[OCR Detectado]\nConfigura tu API Key en el Dashboard para traducción neuronal automática.")
                }
            } catch {
                print("[ToolTipTranslate] Error de Vision: \(error)")
            }
        }
    }

    private func translateWithGemini(text: String, apiKey: String) async -> String {
        guard let url = URL(string: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=\(apiKey)") else {
            return text
        }

        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let prompt = "Traduce el siguiente texto extraído de la pantalla al español neutro de forma clara, natural y concisa. Responde ÚNICAMENTE con la traducción directa:\n\n\(text)"
        let payload: [String: Any] = [
            "contents": [["parts": [["text": prompt]]]]
        ]

        do {
            req.httpBody = try JSONSerialization.data(withJSONObject: payload)
            let (data, _) = try await URLSession.shared.data(for: req)
            if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
               let candidates = json["candidates"] as? [[String: Any]],
               let content = candidates.first?["content"] as? [String: Any],
               let parts = content["parts"] as? [[String: Any]],
               let resultText = parts.first?["text"] as? String {
                return resultText.trimmingCharacters(in: .whitespacesAndNewlines)
            }
        } catch { }
        return text
    }

    private func showTranslationHUD(originalText: String, translatedText: String) {
        if translateWindow == nil {
            let panel = NSPanel(
                contentRect: NSRect(x: 0, y: 0, width: 420, height: 260),
                styleMask: [.borderless, .nonactivatingPanel],
                backing: .buffered,
                defer: false
            )
            panel.isFloatingPanel = true
            panel.level = .floating
            panel.backgroundColor = .clear
            panel.isOpaque = false
            panel.hasShadow = false
            self.translateWindow = panel
        }

        let view = TranslateHUDView(original: originalText, translated: translatedText) { [weak self] in
            self?.translateWindow?.orderOut(nil)
        }

        translateWindow?.contentView = NSHostingView(rootView: view)
        if let screen = NSScreen.main {
            let rect = screen.visibleFrame
            translateWindow?.setFrameOrigin(NSPoint(x: rect.midX - 210, y: rect.midY - 130))
        }
        translateWindow?.orderFrontRegardless()
    }
}

struct TranslateHUDView: View {
    let original: String
    let translated: String
    let onClose: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Label("ToolTip AI Translate", systemImage: "character.bubble")
                    .font(.headline)
                    .foregroundColor(.accentColor)
                Spacer()
                Button(action: onClose) {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(.secondary)
                }
                .buttonStyle(.plain)
            }

            Divider()

            VStack(alignment: .leading, spacing: 4) {
                Text("TEXTO TRADUCIDO")
                    .font(.caption2.bold())
                    .foregroundColor(.secondary)
                Text(translated)
                    .font(.system(size: 13, weight: .medium))
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(10)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.accentColor.opacity(0.1))
            .cornerRadius(8)

            VStack(alignment: .leading, spacing: 4) {
                Text("ORIGINAL DETECTADO (OCR LOCAL)")
                    .font(.caption2.bold())
                    .foregroundColor(.secondary)
                Text(original)
                    .font(.system(size: 11))
                    .foregroundColor(.secondary)
                    .lineLimit(3)
            }

            HStack {
                Text("Apple Vision OCR • Local")
                    .font(.system(size: 9))
                    .foregroundColor(.secondary)
                Spacer()
                Button("Copiar Traducción") {
                    NSPasteboard.general.clearContents()
                    NSPasteboard.general.setString(translated, forType: .string)
                }
                .controlSize(.small)
            }
        }
        .padding(16)
        .frame(width: 420)
        .background(.ultraThinMaterial)
        .cornerRadius(14)
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(Color.white.opacity(0.15), lineWidth: 1)
        )
        .shadow(color: .black.opacity(0.3), radius: 20, x: 0, y: 10)
    }
}
