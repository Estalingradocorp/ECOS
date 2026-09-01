---
titulo: Persistencia de Medios
tags:
  - persistencia
  - indexeddb
  - localStorage
  - reproductores
aplicacion: "[[EC OS]]"
relacionados:
  - "[[EC Music Pro]]"
  - "[[EC Video Pro]]"
---

# Persistencia de Medios

Cómo EC OS conserva los archivos y la configuración de los reproductores entre sesiones.

## Almacenamiento

### IndexedDB — archivos (`storage.js`, `MediaStore`)
Guarda los **blobs** completos de canciones y videos. A diferencia de `localStorage` (límite ~5 MB), IndexedDB permite archivos grandes sin límite práctico.

| Método | Descripción |
|--------|-------------|
| `MediaStore.save({name, blob, type})` | Guarda y devuelve el `id` |
| `MediaStore.all()` | Devuelve todos los archivos guardados |
| `MediaStore.remove(id)` | Borra por id |
| `MediaStore.clear()` | Borra todo |

### localStorage — configuración
| Clave | Qué guarda |
|-------|-----------|
| `ec_music_state` | Pista, posición, shuffle, repetir, volumen |
| `ec_video_state` | Pista y posición |
| `ec_tv_channels` | Canales IPTV añadidos por el usuario |

## Reanudación
- Al **reabrir la app** se restaura la pista y la posición donde se quedó.
- El estado se guarda **cada 3 s**, al **pausar**, al **cambiar de pista** y al **recargar/cerrar** la página (evento `pagehide`), por lo que no se pierden segundos.
- Al **cerrar la ventana** del reproductor, la reproducción solo se **pausa** (ya no se reinicia a 0:00).

## Indicadores visuales
- 💾 junto al nombre de cada elemento guardado en el dispositivo.
- Contador «X pistas · Y guardadas» (música) / «N (M guardados)» (video).

> Ver también: [[EC Music Pro]], [[EC Video Pro]]