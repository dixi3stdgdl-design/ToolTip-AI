import Foundation
import AppKit

public final class AppGroupCoordinator: @unchecked Sendable {
    public static let shared = AppGroupCoordinator()
    public static let appGroupId = "group.com.dixi3labs.tooltipai"

    private let defaults: UserDefaults

    private init() {
        if let sharedDefaults = UserDefaults(suiteName: Self.appGroupId) {
            self.defaults = sharedDefaults
        } else {
            self.defaults = .standard
        }
    }

    // Guardado y lectura de la clave global de Gemini
    public func setSharedApiKey(_ key: String) {
        defaults.set(key, forKey: "shared_gemini_api_key")
        _ = KeychainVault.saveApiKey(key)
    }

    public func getSharedApiKey() -> String? {
        if let key = defaults.string(forKey: "shared_gemini_api_key"), !key.isEmpty {
            return key
        }
        return KeychainVault.loadApiKey()
    }

    // Estado de módulos (Activo / En ejecución)
    public func setModuleStatus(id: SuiteModuleId, isRunning: Bool) {
        defaults.set(isRunning, forKey: "module_status_\(id.rawValue)")
    }

    public func isModuleRunning(id: SuiteModuleId) -> Bool {
        return defaults.bool(forKey: "module_status_\(id.rawValue)")
    }

    // Invocación desacoplada vía URL Scheme de macOS
    public func launchModule(_ id: SuiteModuleId) {
        guard let url = URL(string: id.urlScheme + "open") else { return }
        NSWorkspace.shared.open(url)
    }
}
