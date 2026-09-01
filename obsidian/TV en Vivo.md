---
titulo: TV en Vivo
tags:
  - app
  - tv
  - iptv
aplicacion: "[[EC OS]]"
relacionados:
  - "[[EC Video Pro]]"
---

# TV en Vivo

Módulo de **IPTV** integrado en el reproductor de video (módulo 14, `assets/js/video-tv.js`).

- 🔴 Incluye **31 canales gratuitos** en categorías: Noticias, Deportes, Entretenimiento, Música, Infantil e Internacionales.

## Funciones
| Función | Descripción |
|---------|-------------|
| `tvRenderChannels()` | Renderiza el listado filtrado |
| `tvPlayChannel(ch)` | Reproduce un canal en el reproductor |
| `tvFilterCategory(cat)` | Filtra por categoría |
| `tvAddStream()` | Añade un stream propio (m3u8, mpd, mp4...) |

## Canales del usuario
- Se guardan en `localStorage` (`ec_tv_channels`) y **persisten entre sesiones**.
- Se añaden desde el panel con el botón **+**.

> Ver también: [[EC Video Pro]], [[EC OS]]