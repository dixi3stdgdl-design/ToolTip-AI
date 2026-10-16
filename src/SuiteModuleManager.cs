using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices;
using System.Windows.Threading;

namespace ToolTipAI;

public enum SuiteModuleId
{
    Translate,
    Aura,
    Voice,
    Assistant,
    Bridge
}

public class SuiteModuleInfo
{
    public SuiteModuleId Id { get; set; }
    public string DisplayName { get; set; } = "";
    public string Subtitle { get; set; } = "";
    public string[] ProcessNames { get; set; } = Array.Empty<string>();
    public string[] CandidatePaths { get; set; } = Array.Empty<string>();
    public string AppUserModelId { get; set; } = "";
    public bool IsRunning { get; set; }
}

/// <summary>
/// Administrador Central de Módulos Independientes para ToolTip AI Windows Companion.
/// Cada herramienta (Translate, Aura, Voice, Assistant) es un proceso completamente desacoplado
/// que NUNCA se abre automáticamente con el Companion ni con Windows.
/// </summary>
public class SuiteModuleManager
{
    private static readonly Lazy<SuiteModuleManager> _instance = new(() => new SuiteModuleManager());
    public static SuiteModuleManager Instance => _instance.Value;

    private readonly Dictionary<SuiteModuleId, SuiteModuleInfo> _modules = new();
    private readonly DispatcherTimer _pollTimer;

    public event Action? StatusUpdated;

    [DllImport("user32.dll")]
    private static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    private static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    private SuiteModuleManager()
    {
        InitializeModuleRegistry();

        _pollTimer = new DispatcherTimer
        {
            Interval = TimeSpan.FromSeconds(1.5)
        };
        _pollTimer.Tick += (s, e) => CheckStatus();
        _pollTimer.Start();
    }

    private void InitializeModuleRegistry()
    {
        _modules[SuiteModuleId.Translate] = new SuiteModuleInfo
        {
            Id = SuiteModuleId.Translate,
            DisplayName = "ToolTip AI Translate",
            Subtitle = "Traducción flotante instantánea con OCR local y Gemini 2.5",
            ProcessNames = new[] { "ToolTipAITranslate" },
            AppUserModelId = @"Dixi3Lqbs.ToolTipAITranslate_mjcsxm4s425b0!App",
            CandidatePaths = new[]
            {
                @"C:\Program Files\WindowsApps\Dixi3Lqbs.ToolTipAITranslate_1.1.8.0_x64__mjcsxm4s425b0\ToolTipAITranslate.exe",
                @"D:\ToolTip AI Translate\.staging_publish\ToolTipAITranslate.exe",
                @"D:\ToolTip AI Translate\.package_layout\ToolTipAITranslate.exe"
            }
        };

        _modules[SuiteModuleId.Aura] = new SuiteModuleInfo
        {
            Id = SuiteModuleId.Aura,
            DisplayName = "ToolTip AI Aura",
            Subtitle = "Resaltado contextual inteligente, cursor beam y guía visual",
            ProcessNames = new[] { "ToolTipAIAura" },
            AppUserModelId = @"Dixi3Lqbs.ToolTipAIAura_mjcsxm4s425b0!App",
            CandidatePaths = new[]
            {
                @"D:\ToolTip AI Aura\.staging_publish\ToolTipAIAura.exe",
                @"D:\ToolTip AI Aura\.package_layout\ToolTipAIAura.exe"
            }
        };

        _modules[SuiteModuleId.Voice] = new SuiteModuleInfo
        {
            Id = SuiteModuleId.Voice,
            DisplayName = "ToolTip AI Voice",
            Subtitle = "Dictado neuronal ultra-rápido y lectura auditiva en tiempo real",
            ProcessNames = new[] { "ToolTipAIVoice" },
            AppUserModelId = @"Dixi3Lqbs.ToolTipAIVoice_mjcsxm4s425b0!App",
            CandidatePaths = new[]
            {
                @"D:\ToolTip AI Voice\.staging_publish\ToolTipAIVoice.exe",
                @"D:\ToolTip AI Voice\.package_layout\ToolTipAIVoice.exe"
            }
        };

        _modules[SuiteModuleId.Assistant] = new SuiteModuleInfo
        {
            Id = SuiteModuleId.Assistant,
            DisplayName = "ToolTip AI Assistant",
            Subtitle = "Copiloto multimodal y analista inteligente de pantalla con Gemini",
            ProcessNames = new[] { "ToolTipAIAssistant", "ToolTipAI" },
            AppUserModelId = @"Dixi3Lqbs.ToolTipAIAssistant_mjcsxm4s425b0!App",
            CandidatePaths = new[]
            {
                @"D:\ToolTip AI\src\bin\Release\net8.0-windows10.0.19041.0\ToolTipAI.exe",
                @"C:\Users\drbea\ToolTip-AI-repo\src\bin\Release\net8.0-windows10.0.19041.0\ToolTipAI.exe",
                @"D:\ToolTip AI\assistant\index.html"
            }
        };

        _modules[SuiteModuleId.Bridge] = new SuiteModuleInfo
        {
            Id = SuiteModuleId.Bridge,
            DisplayName = "ToolTip AI Bridge",
            Subtitle = "Enlace multiplataforma y sincronización con dispositivos Android",
            ProcessNames = new[] { "ToolTipAIBridge" },
            CandidatePaths = new[]
            {
                @"D:\ToolTip AI Bridge\publish\win-x64\ToolTipAIBridge.exe"
            }
        };
    }

    public bool IsRunning(SuiteModuleId id)
    {
        if (!_modules.TryGetValue(id, out var info)) return false;
        return info.ProcessNames.Any(name => Process.GetProcessesByName(name).Length > 0);
    }

    public SuiteModuleInfo? GetInfo(SuiteModuleId id)
    {
        _modules.TryGetValue(id, out var info);
        return info;
    }

    public void CheckStatus()
    {
        bool changed = false;
        foreach (var kvp in _modules)
        {
            bool running = kvp.Value.ProcessNames.Any(name => Process.GetProcessesByName(name).Length > 0);
            if (kvp.Value.IsRunning != running)
            {
                kvp.Value.IsRunning = running;
                changed = true;
            }
        }

        if (changed)
        {
            StatusUpdated?.Invoke();
        }
    }

    /// <summary>
    /// Lanza el módulo especificado de forma 100% independiente en la sesión de escritorio del usuario.
    /// </summary>
    public bool LaunchModule(SuiteModuleId id)
    {
        if (!_modules.TryGetValue(id, out var info)) return false;

        // Si ya está corriendo, traemos su ventana al frente
        foreach (var pName in info.ProcessNames)
        {
            var running = Process.GetProcessesByName(pName).FirstOrDefault();
            if (running != null && running.MainWindowHandle != IntPtr.Zero)
            {
                ShowWindow(running.MainWindowHandle, 9); // SW_RESTORE
                SetForegroundWindow(running.MainWindowHandle);
                info.IsRunning = true;
                StatusUpdated?.Invoke();
                return true;
            }
        }

        // Intento 1: Lanzamiento a través del AppUserModelId de Microsoft Store / MSIX si existe
        if (!string.IsNullOrWhiteSpace(info.AppUserModelId))
        {
            try
            {
                var psi = new ProcessStartInfo
                {
                    FileName = "explorer.exe",
                    Arguments = $@"shell:AppsFolder\{info.AppUserModelId}",
                    UseShellExecute = true
                };
                Process.Start(psi);
                App.SafeLog($"[SuiteManager] Lanzado {info.DisplayName} vía shell:AppsFolder ({info.AppUserModelId})\n");
                info.IsRunning = true;
                StatusUpdated?.Invoke();
                return true;
            }
            catch (Exception ex)
            {
                App.SafeLog($"[SuiteManager] Error al lanzar vía shell AppsFolder: {ex.Message}. Intentando ruta de archivo...\n");
            }
        }

        // Intento 2: Lanzamiento directo desde ejecutable en disco
        foreach (var path in info.CandidatePaths)
        {
            if (File.Exists(path))
            {
                try
                {
                    var psi = new ProcessStartInfo
                    {
                        FileName = path,
                        WorkingDirectory = Path.GetDirectoryName(path) ?? "",
                        UseShellExecute = true
                    };
                    Process.Start(psi);
                    App.SafeLog($"[SuiteManager] Lanzado {info.DisplayName} desde ejecutable: {path}\n");
                    info.IsRunning = true;
                    StatusUpdated?.Invoke();
                    return true;
                }
                catch (Exception ex)
                {
                    App.SafeLog($"[SuiteManager] Error ejecutando {path}: {ex.Message}\n");
                }
            }
        }

        return false;
    }

    /// <summary>
    /// Detiene el módulo de forma individual y limpia sin afectar al Companion ni al resto de la suite.
    /// </summary>
    public bool StopModule(SuiteModuleId id)
    {
        if (!_modules.TryGetValue(id, out var info)) return false;

        bool stoppedAny = false;
        foreach (var pName in info.ProcessNames)
        {
            var procs = Process.GetProcessesByName(pName);
            foreach (var p in procs)
            {
                try
                {
                    // Intento de cierre suave
                    p.CloseMainWindow();
                    if (!p.WaitForExit(1000))
                    {
                        p.Kill();
                    }
                    stoppedAny = true;
                    App.SafeLog($"[SuiteManager] Módulo {info.DisplayName} (PID {p.Id}) detenido correctamente.\n");
                }
                catch (Exception ex)
                {
                    App.SafeLog($"[SuiteManager] Error al detener {pName}: {ex.Message}\n");
                }
            }
        }

        info.IsRunning = false;
        StatusUpdated?.Invoke();
        return stoppedAny;
    }
}
