---
titulo: EC OS
version: 2.0
tipo: sistema-operativo-web
tags:
  - proyecto
  - ec-os
  - web-app
  - github-pages
creado: 2026-09-01
repo: "[[Repositorio]]"
docs: "[[Documentación EC OS]]"
aplicaciones:
  - "[[EC Music Pro]]"
  - "[[EC Video Pro]]"
  - "[[TV en Vivo]]"
  - "[[EC Office Pro]]"
  - "[[EC Studio Pro]]"
  - "[[ECCode]]"
---

# EC OS

Sistema operativo completo basado en navegador, inspirado en **iPadOS/macOS**. Incluye un escritorio con ventanas arrastrables y redimensionables, modo oscuro, sonidos UI y una suite de aplicaciones.

- 🔗 **URL en vivo:** https://Estalingradocorp.github.io/ECOS/
- 📦 **Repo:** https://github.com/Estalingradocorp/ECOS
- 📄 **Docs completas:** `DOCUMENTATION.md`

## Mapa de aplicaciones
- 🎵 [[EC Music Pro]] — Reproductor de música
- 🎬 [[EC Video Pro]] — Reproductor de video
- 📺 [[TV en Vivo]] — IPTV
- 📝 [[EC Office Pro]] — Documentos
- 🖼️ [[EC Studio Pro]] — Editor de imágenes
- 💻 [[ECCode]] — Editor de código

## Persistencia (clave)
Los archivos de los reproductores **se guardan localmente** y sobreviven a recargar/reabrir la página:

| Qué | Dónde | Persiste al refrescar |
|-----|-------|----------------------|
| Archivos de audio/video | **IndexedDB** (`MediaStore`) | ✅ Sí |
| Posición, shuffle, repetir, volumen | **`localStorage`** | ✅ Sí |
| Canales TV añadidos | **`localStorage`** (`ec_tv_channels`) | ✅ Sí |

> 📌 Para más detalle técnico y de reanudación, ver [[Persistencia de Medios]] y [[EC Music Pro]] / [[EC Video Pro]].