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
- 🎨 **Carátula:** muestra la imagen incrustada de la canción (ID3 vía `jsmediatags`); si no tiene, usa una **imagen por defecto** (URL de Tumblr). Carátula **circular** con **anillo y resplandor neon** que cambia de color según la canción (color dominante de la carátula, o por índice si CORS lo impide).
  - Imagen por defecto: `https://64.media.tumblr.com/76e1731cb57e42c75e23a5a49ac6b7ad/0405ac2cbd79fe6a-5c/s1280x1920/097c923e9b004fba2423a988cd1550ccd1253b69.pnj`
- 📚 **Listas de reproducción:** crea listas nombradas (`ec_playlists` en localStorage), añade/quita canciones desde la Biblioteca (menú en el icono de lista de cada canción) y reproduce solo las canciones de la lista seleccionada. La lista activa se recuerda al reabrir.
- 📜 **Menú lateral:** la lista de canciones es un **drawer que se desliza desde la izquierda dentro de la propia ventana** de EC Music Pro (no sobre todo el sistema). Se abre con el botón flotante **«Lista»** (esquina superior derecha) o el icono 📜 junto a los controles.

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