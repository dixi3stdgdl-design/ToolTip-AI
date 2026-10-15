# 🍏 ToolTip AI Suite — macOS Edition (Arquitectura Dual)

**Cognitive Screen Inspector, Translation, Aura, Voice & Bridge Suite for macOS**  
*Organización:* Dixi3 Labs  
*App Group Identifier:* `group.com.dixi3labs.tooltipai`  
*Target OS:* macOS 14.0+ (Apple Silicon & Intel)  

---

## 🏛️ Las 2 Vías de Distribución (Arquitectura Dual)

### 1. Vía 1: Suite Todo-en-Uno (`ToolTipDashboard.app`)
* Contenedor maestro con el Cockpit de control central.
* Contiene los 5 motores desacoplados en `Contents/Helpers/`.
* Cumple al 100% con la Directriz 4.3 de Apple (Cero rechazos por spam).

### 2. Vía 2: Los 5 Módulos Independientes (App Store Bundle)
Cada herramienta se compila como su propio ejecutable `.app` independiente, comunicándose mediante el **App Group** (`group.com.dixi3labs.tooltipai`) y **Deep Links (URL Schemes)**:

| Módulo | Bundle Identifier | URL Scheme | Función |
| :--- | :--- | :--- | :--- |
| **ToolTip Dashboard** | `com.dixi3labs.tooltipai.dashboard` | `tooltip-suite://` | Cockpit central y gestor de licencias |
| **ToolTip Assistant** | `com.dixi3labs.tooltipai.assistant` | `tooltip-assistant://` | Inspector cognitivo en 4 cuadrantes |
| **ToolTip Translate** | `com.dixi3labs.tooltipai.translate` | `tooltip-translate://` | Traductor flotante con OCR local Vision |
| **ToolTip Aura** | `com.dixi3labs.tooltipai.aura` | `tooltip-aura://` | Resaltador contextual, cursor beam y dwell radar |
| **ToolTip Voice** | `com.dixi3labs.tooltipai.voice` | `tooltip-voice://` | Dictado y síntesis auditiva TTS |
| **ToolTip Bridge** | `com.dixi3labs.tooltipai.bridge` | `tooltip-bridge://` | Servidor local LAN para companion Android |

---

## ⚡ Compilación
Se compila en GitHub Actions (`runs-on: macos-14`) generando el paquete unificado:
`ToolTipAI-macOS-Complete-Suite.zip`.
