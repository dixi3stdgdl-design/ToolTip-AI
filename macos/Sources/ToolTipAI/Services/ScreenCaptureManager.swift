import Foundation
import ScreenCaptureKit
import AppKit

public final class ScreenCaptureManager: NSObject, Sendable {
    public static let shared = ScreenCaptureManager()

    public func captureMainDisplay() async -> (base64Image: String, image: NSImage)? {
        do {
            let content = try await SCShareableContent.excludingDesktopWindows(false, onScreenWindowsOnly: true)
            guard let display = content.displays.first else { return nil }

            let filter = SCContentFilter(display: display, excludingApplications: [], exceptingWindows: [])
            let config = SCStreamConfiguration()
            config.width = display.width
            config.height = display.height
            config.showsCursor = false

            let cgImage = try await SCScreenshotManager.captureImage(contentFilter: filter, configuration: config)
            let nsImage = NSImage(cgImage: cgImage, size: NSSize(width: display.width, height: display.height))

            guard let tiffData = nsImage.tiffRepresentation,
                  let bitmap = NSBitmapImageRep(data: tiffData),
                  let pngData = bitmap.representation(using: .png, properties: [:]) else {
                return nil
            }

            return (pngData.base64EncodedString(), nsImage)
        } catch {
            print("[ScreenCaptureManager] Error al capturar pantalla: \(error)")
            return nil
        }
    }
}
