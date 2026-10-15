import SwiftUI
import AppKit
import AVFoundation
import ToolTipCore

@main
struct ToolTipVoiceApp: App {
    @NSApplicationDelegateAdaptor(VoiceAppDelegate.self) var appDelegate

    var body: some Scene {
        MenuBarExtra("ToolTip Voice", systemImage: "mic.fill") {
            Button(appDelegate.isSpeaking ? "Detener Lectura" : "Leer Portapapeles en Voz Alta") {
                appDelegate.toggleSpeech()
            }
            Divider()
            Button("Cerrar Voice") {
                NSApplication.shared.terminate(nil)
            }
        }
    }
}

final class VoiceAppDelegate: NSObject, NSApplicationDelegate, AVSpeechSynthesizerDelegate {
    private let synthesizer = AVSpeechSynthesizer()
    var isSpeaking = false

    override init() {
        super.init()
        synthesizer.delegate = self
    }

    func application(_ application: NSApplication, open urls: [URL]) {
        for url in urls {
            if url.scheme == "tooltip-voice" {
                toggleSpeech()
            }
        }
    }

    func toggleSpeech() {
        if isSpeaking {
            synthesizer.stopSpeaking(at: .immediate)
            isSpeaking = false
        } else {
            guard let text = NSPasteboard.general.string(forType: .string), !text.isEmpty else {
                speak(text: "El portapapeles está vacío. Copia algún texto para leerlo.")
                return
            }
            speak(text: text)
        }
    }

    private func speak(text: String) {
        let utterance = AVSpeechUtterance(string: text)
        utterance.voice = AVSpeechSynthesisVoice(language: "es-MX") ?? AVSpeechSynthesisVoice(language: "es-ES")
        utterance.rate = AVSpeechUtteranceDefaultSpeechRate
        isSpeaking = true
        synthesizer.speak(utterance)
    }

    func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didFinish utterance: AVSpeechUtterance) {
        isSpeaking = false
    }
}
