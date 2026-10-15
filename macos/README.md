# 🍏 ToolTip AI — macOS Edition

**Cognitive Screen Inspector & Assisted Decision Engine for macOS**  
*Organización:* Dixi3 Labs  
*Bundle Identifier:* `com.dixi3labs.tooltipai`  
*Target OS:* macOS 14.0+ (Apple Silicon & Intel)  

---

## 🏗️ Arquitectura Técnica

1. **Lenguaje y UI:** Swift 5.9+ y SwiftUI nativo con `MenuBarExtra` y `NSPanel` flotante en material translúcido (`.ultraThinMaterial`).
2. **Captura de Pantalla:** `ScreenCaptureKit` (`SCShareableContent`, `SCScreenshotManager`) con aceleración por hardware.
3. **Atajo Global:** API Carbon (`RegisterEventHotKey`) activado por defecto con `Cmd + Shift + A` sin necesidad de permisos invasivos de Accesibilidad.
4. **Criptografía de Credenciales:** `Security.framework` (Keychain nativo de macOS), reemplazo directo de Windows DPAPI.
5. **Inferencia Cognitiva:** `GeminiClient` con autodetección de dominios (Audio/DAWs como Logic Pro/Ableton, Desarrollo en Xcode/VSCode, Navegación y Sistema).

---

## 🚀 Compilación en la Nube (GitHub Actions)

Este módulo se compila automáticamente mediante GitHub Actions en cada `git push`:
* **Runner:** `macos-14` (Apple Silicon M1/M2)
* **Resultado:** Se genera el archivo `ToolTipAI-macOS-preview.zip` descargable directamente en la pestaña **Actions** de GitHub sin costo alguno.

---

## 🔒 Privacidad y App Store Compliance

* Cumple con los lineamientos de **App Sandbox** (`com.apple.security.app-sandbox`).
* Declara `NSScreenCaptureUsageDescription` en `Info.plist`.
* Cero almacenamiento de imágenes en servidores intermediarios (comunicación directa TLS 1.3 con Google Gemini APIs).
