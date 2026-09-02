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
- 📜 **Lista y TV desplegables:** la **lista de reproducción** y el panel de **TV en Vivo** ya no son columnas fijas que encogen el video; ahora son **menús (drawers) que se deslizan por encima del video** desde la derecha (`#video-playlist-panel` y `#video-tv-panel`, clase CSS `.video-drawer`). Se abren desde la barra de herramientas (iconos de lista 📜 y torre 📡) o con la tecla **`L`**. Abrir uno cierra automáticamente el otro. Ambos incluyen botón ✕ para cerrarlos.
- 📱 **Versión móvil:** en pantallas ≤ 768px los drawers ocupan **88% del ancho** para que la lista sea usable; el slider de volumen se oculta y los botones/tamaño se ajustan al toque. Como los paneles flotan, el video usa **todo el espacio disponible** en cualquier tamaño.
- 🔇 **Sin reproducción automática:** al iniciar o actualizar la página **no se reproduce nada**. La lista se restaura (pista + posición) pero el sonido solo arranca cuando el usuario **abre la app** (hook global `window.ecVideoOnOpen`, llamado desde `openWindow()` en `core.js`).

## Funciones
| Función | Descripción |
|---------|-------------|
| `vidAddFiles(files, saved)` | Añade archivos de video |
| `vidPersistFiles(files)` | Guarda en IndexedDB y devuelve los `id` |
| `vidLoadSavedPlaylist()` | Restaura lista y posición **sin reproducir** |
| `vidResumeOnOpen` (`window.ecVideoOnOpen`) | Reanuda la reproducción al abrir la app |
| `vidTogglePlaylist()` | Muestra/oculta el drawer de la lista (`L`) |
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
| `L` | Mostrar/ocultar lista de reproducción |
| `0`–`9` | Ir al 0%–90% |
| `Ctrl+O` | Abrir archivo |

## Persistencia
- Los archivos se guardan en **IndexedDB** y se **mantienen entre sesiones**.
- Se recuerda la **pista y la posición**, pero **no se reproducen al cargar** la página.
- Icono 💾 y contador «N (M guardados)».

> Ver también: [[Persistencia de Medios]], [[TV en Vivo]], [[EC OS]]