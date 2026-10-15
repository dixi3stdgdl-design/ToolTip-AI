// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "ToolTipAI",
    platforms: [
        .macOS(.v14)
    ],
    products: [
        .executable(name: "ToolTipAI", targets: ["ToolTipAI"])
    ],
    dependencies: [],
    targets: [
        .executableTarget(
            name: "ToolTipAI",
            dependencies: [],
            path: "Sources/ToolTipAI"
        )
    ]
)
