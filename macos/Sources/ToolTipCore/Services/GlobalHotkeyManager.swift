import Foundation
import Carbon
import AppKit

public final class GlobalHotkeyManager: @unchecked Sendable {
    public static let shared = GlobalHotkeyManager()

    private var hotKeyRef: EventHotKeyRef?
    private var handler: (@Sendable () -> Void)?

    private init() {}

    public func register(
        keyCode: UInt32 = UInt32(kVK_ANSI_A), // Tecla 'A'
        modifiers: UInt32 = UInt32(cmdKey | shiftKey), // Cmd + Shift + A
        onTrigger: @escaping @Sendable () -> Void
    ) {
        self.handler = onTrigger

        var hotKeyID = EventHotKeyID()
        hotKeyID.signature = OSType(0x54544149) // 'TTAI'
        hotKeyID.id = 1

        var eventType = EventTypeSpec()
        eventType.eventClass = OSType(kEventClassKeyboard)
        eventType.eventKind = OSType(kEventHotKeyPressed)

        InstallEventHandler(
            GetApplicationEventTarget(),
            { (_, event, _) -> OSStatus in
                GlobalHotkeyManager.shared.trigger()
                return noErr
            },
            1,
            &eventType,
            nil,
            nil
        )

        let status = RegisterEventHotKey(
            keyCode,
            modifiers,
            hotKeyID,
            GetApplicationEventTarget(),
            0,
            &hotKeyRef
        )

        if status != noErr {
            print("[GlobalHotkeyManager] Error al registrar atajo global: \(status)")
        } else {
            print("[GlobalHotkeyManager] Atajo global registrado exitosamente (Cmd + Shift + A).")
        }
    }

    private func trigger() {
        DispatchQueue.main.async { [weak self] in
            self?.handler?()
        }
    }
}
