---
titulo: EC Music Pro
tags:
  - app
  - musica
  - reproductor
aplicacion: "[[EC OS]]"
persistencia: "[[Persistencia de Medios]]"
---

# EC Music Pro

Reproductor de música moderno con playlist, ecualizador visual animado y persistencia.

- 📄 **Módulo:** 12 (`assets/js/music.js`)
- 🧠 **Estado guardado:** `ec_music_state`

## Funciones
| Función | Descripción |
|---------|-------------|
| `addFilesToPlaylist(files, saved)` | Añade archivos de audio |
| `persistFiles(files)` | Guarda en IndexedDB y devuelve los `id` |
| `loadSavedPlaylist()` | Restaura canciones y posición |
| `removeTrack(index)` | Elimina pista (también del almacenamiento) |
| `playTrack(index)` | Reproduce una pista |
| `togglePlayPause()` / `nextTrack()` / `prevTrack()` | Controles |
| `toggleShuffle()` / `toggleRepeat()` | Aleatorio / repetición |
| `updateVolume(val)` / `seekTrack(val)` | Volumen / avance |

## Atajos de teclado
| Atajo | Acción |
|-------|--------|
| `Espacio` | Play / Pausa |
| `Shift+→` / `Shift+←` | Siguiente / anterior |
| `S` | Aleatorio |
| `R` | Repetir |

## Persistencia
- Los archivos se guardan en **IndexedDB** y se **mantienen entre sesiones**.
- Se recuerda la **pista, posición, aleatorio, repetición y volumen**.
- Icono 💾 y contador «X pistas · Y guardadas».

> Ver también: [[Persistencia de Medios]], [[EC OS]]