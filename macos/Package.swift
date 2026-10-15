// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "ToolTipAISuite",
    platforms: [
        .macOS(.v14)
    ],
    products: [
        // Núcleo Compartido
        .library(name: "ToolTipCore", targets: ["ToolTipCore"]),
        
        // 1. Dashboard / Suite Central
        .executable(name: "ToolTipDashboard", targets: ["ToolTipDashboard"]),
        
        // 2. Módulos Independientes
        .executable(name: "ToolTipAssistant", targets: ["ToolTipAssistant"]),
        .executable(name: "ToolTipTranslate", targets: ["ToolTipTranslate"]),
        .executable(name: "ToolTipAura", targets: ["ToolTipAura"]),
        .executable(name: "ToolTipVoice", targets: ["ToolTipVoice"]),
        .executable(name: "ToolTipBridge", targets: ["ToolTipBridge"])
    ],
    dependencies: [],
    targets: [
        // Framework Core compartido
        .target(
            name: "ToolTipCore",
            dependencies: [],
            path: "Sources/ToolTipCore"
        ),
        
        // Ejecutables de la Suite
        .executableTarget(
            name: "ToolTipDashboard",
            dependencies: ["ToolTipCore"],
            path: "Sources/ToolTipDashboard"
        ),
        .executableTarget(
            name: "ToolTipAssistant",
            dependencies: ["ToolTipCore"],
            path: "Sources/ToolTipAssistant"
        ),
        .executableTarget(
            name: "ToolTipTranslate",
            dependencies: ["ToolTipCore"],
            path: "Sources/ToolTipTranslate"
        ),
        .executableTarget(
            name: "ToolTipAura",
            dependencies: ["ToolTipCore"],
            path: "Sources/ToolTipAura"
        ),
        .executableTarget(
            name: "ToolTipVoice",
            dependencies: ["ToolTipCore"],
            path: "Sources/ToolTipVoice"
        ),
        .executableTarget(
            name: "ToolTipBridge",
            dependencies: ["ToolTipCore"],
            path: "Sources/ToolTipBridge"
        )
    ]
)
