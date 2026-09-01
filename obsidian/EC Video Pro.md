---
titulo: EC Video Pro
tags:
  - app
  - video
  - reproductor
aplicacion: "[[EC OS]]"
persistencia: "[[Persistencia de Medios]]"
relacionados:
  - "[[TV en Vivo]]"
---

# EC Video Pro

Reproductor de video completo estilo VLC con controles avanzados, subtítulos y persistencia.

- 📄 **Módulo:** 13 (`assets/js/video-tv.js`)
- 🧠 **Estado guardado:** `ec_video_state`

## Funciones
| Función | Descripción |
|---------|-------------|
| `vidAddFiles(files, saved)` | Añade archivos de video |
| `vidPersistFiles(files)` | Guarda en IndexedDB y devuelve los `id` |
| `vidLoadSavedPlaylist()` | Restaura videos y posición |
| `vidRemoveTrack(idx)` | Elimina video (también del almacenamiento) |
| `vidTogglePlay()` / `vidNext()` / `vidPrev()` | Controles |
| `vidSetSpeed(speed)` | Velocidad 0.25×–4× |
| `vidToggleSubtitles()` | Subtítulos (`.srt`, `.vtt`) |
| `vidScreenshot()` | Captura de pantalla (PNG) |
| `vidTogglePiP()` | Picture-in-Picture |
| `vidToggleFullscreen()` | Pantalla completa |

## Atajos de teclado
| Atajo | Acción |
|-------|--------|
| `Espacio` | Play / Pausa |
| `←` / `→` | -5s / +5s |
| `↑` / `↓` | Volumen |
| `F` / `M` / `C` / `S` / `P` | Fullscreen / Silencio / Subtítulos / Captura / PiP |
| `0`–`9` | Ir al 0%–90% |
| `Ctrl+O` | Abrir archivo |

## Persistencia
- Los archivos se guardan en **IndexedDB** y se **mantienen entre sesiones**.
- Se recuerda la **pista y la posición**.
- Icono 💾 y contador «N (M guardados)».

> Ver también: [[Persistencia de Medios]], [[TV en Vivo]], [[EC OS]]