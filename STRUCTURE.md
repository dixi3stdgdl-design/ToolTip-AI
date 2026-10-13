# Estructura del repo — ToolTip AI

Reorganizado el 28/09/2026. Esta es la estructura **real** en disco.

## Suite (4 productos)

```text
D:\ToolTip AI\                          ← Assistant + web + docs del proyecto
D:\ToolTip AI Aura\                     ← Aura
D:\ToolTip AI Voice\                    ← Voice
D:\ToolTip AI Translate\                ← Translate (ya sin subcarpeta anidada)
```

---

## `D:\ToolTip AI\` (Assistant + sitio)

```text
ToolTip AI\
├── index.html, styles.css, CNAME     ← web pública tooltip-ai.com (GitHub Pages)
├── de\  en\  privacy\                ← landings i18n
├── privacy.html, robots.txt, sitemap.xml, favicon.ico, .nojekyll
├── README.md  LICENSE  global.json  .gitignore
├── OPERATIONS.md                     ← cómo trabajamos
├── STRUCTURE.md                      ← este archivo
├── MONETIZATION.md                   ← plan de caja
├── src\                       ← código WPF del Assistant
├── MicrosoftStore_Submission\
│   ├── Package\                      ← 1 MSIX actual + AppxManifest
│   ├── Store_Assets\                 ← logos, capturas, app.ico/icon.png
│   ├── Scripts\                      ← empaquetado/publish
│   └── *.md                          ← guías y checklists Store
├── docs\
│   ├── compose\spec\                 ← specs de producto
│   └── reports\                      ← informes y status.*
├── scripts\                          ← build.bat, run.bat (del Assistant)
├── extensions\                       ← esbozos Chrome (fase posterior)
├── _archive\                         ← histórico no destructivo (MSIX, scripts CDP)
├── _qa_dossier\                      ← evidencias QA
├── .tools\                           ← herramientas locales
└── .github\  .worktrees\
```

## Módulo (patrón idéntico en Aura / Voice / Translate)

```text
ToolTip AI <Modulo>\
├── src\                              ← .cs, .xaml, .csproj, .resx, app.ico (build)
├── MicrosoftStore_Submission\
│   ├── Package\                      ← 1 MSIX actual + AppxManifest
│   ├── Store_Assets\                 ← logos y capturas de ficha
│   └── Scripts\                      ← si aplica
├── privacy.html
├── README.md
├── .gitignore
├── .git\
└── .tools\  scripts\                 ← solo si hacen falta
```

### Translate (detalle)

```text
ToolTip AI Translate\
├── ToolTipAITranslate.csproj
├── App.xaml / App.xaml.cs / Loc.cs / Strings*.resx / app.ico
├── Config\  Engine\  Extractors\  Translation\  UI\   ← dominio, ya a la vista
├── MicrosoftStore_Submission\
└── scripts\build.bat, package_msix.ps1
```

---

## Reglas

| Regla | Detalle |
|---|---|
| **1 MSIX versionado por app** en `Package/` | El resto vive en `_archive/msix-history/` |
| **Nada de `bin/`, `obj/`, staging, logs** | Se regeneran con `dotnet publish` |
| **Assets de Store no ensucian `src/`** | Van a `MicrosoftStore_Submission/Store_Assets/` |
| **`app.ico` sí está junto al csproj** | Es input de `ApplicationIcon`, no asset de ficha |
| **Web Pages se queda en la raíz del repo Assistant** | `index.html` + `CNAME` + i18n |

## IDs Store

| App | ID | Carpeta |
|---|---|---|
| Assistant | `9N3D02KXKD3D` | `D:\ToolTip AI` |
| Aura | `9P33P1P5Z8DC` | `D:\ToolTip AI Aura` |
| Translate | `9NQN3RZ2Z655` | `D:\ToolTip AI Translate` |
| Voice | `9P417GZB0FVB` | `D:\ToolTip AI Voice` |
| Bridge | `9PN1B2M4N7DK` | `D:\ToolTip AI Bridge` |


