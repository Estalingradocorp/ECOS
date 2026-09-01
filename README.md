# EC OS — Sistema Operativo Web

Un sistema operativo completo basado en navegador, inspirado en iPadOS/macOS con diseño moderno, modo oscuro, y una suite completa de aplicaciones de productividad y entretenimiento. El código se organiza en archivos separados (HTML + CSS + JS por módulos) sin build, compatible con apertura local y GitHub Pages.

![EC OS](https://64.media.tumblr.com/37c52c25279f877bd0bc2d538626c938/2f8407cc51b2210e-be/s540x810/c379bb3cd18325d6b075e62fd26ffe91f5093ee3.jpg)

## Características principales

- **Interfaz de escritorio** con grid de apps, dock animado, y fondo de pantalla personalizable
- **Ventanas arrastrables y redimensionables** (bordes/esquinas) con controles estilo macOS (cerrar, minimizar)
- **Minimizar con efecto genie**: la ventana se encoge hacia el dock, el icono rebota y muestra un badge rojo; clic en el dock para restaurar
- **Modo oscuro global** que afecta todas las ventanas y componentes
- **Pantalla de carga animada** con barra de progreso y mensajes de estado
- **Sistema de sonido UI** moderno con diferentes tonos para abrir/cerrar ventanas
- **29 fondos de pantalla** (fotos de Unsplash + **Saturno 4K de NASA** + gradientes sólidos)
- **Responsive** — funciona en desktop, tablet y móvil
- **Persistencia** — preferencias en localStorage y archivos de audio/video en IndexedDB (se mantienen entre sesiones), con reanudación de reproducción

## Aplicaciones incluidas

| App | Descripción | Funciones destacadas |
|-----|-------------|---------------------|
| **EC Office Pro** | Procesador de texto estilo LibreOffice | Sistema de páginas A4, tablas, buscar/reemplazar, emojis, subtítulos, exportar a HTML/PDF/DOC/Markdown/TXT, auto-guardado |
| **EC Studio Pro** | Editor de imágenes profesional | Recortar (con proporciones 1:1/4:3/16:9/3:2), dibujar, formas, relleno de color, texto inline, eyedropper, opacidad, deshacer/rehacer, zoom, rotación, 8 filtros, 9 ajustes, exportar PNG/JPEG/WebP con calidad y escala |
| **EC Music Pro** | Reproductor de música moderno | Carátula circular con luz neon dinámica, carátula incrustada o por defecto, playlist, shuffle, repetir, ecualizador animado, drag & drop, persistencia y reanudación |
| **EC Video Pro** | Reproductor de video completo | Soporte MP4/WebM/MOV, subtítulos, velocidad, screenshot, PiP, persistencia y reanudación, atajos estilo VLC |
| **TV en Vivo** | 31 canales IPTV gratuitos | Noticias, deportes, entretenimiento, música, infantil. Añadir streams propios |
| **ECCode** | Editor de código con resaltado | JavaScript, Python, HTML, CSS, SQL, números de línea sincronizados |
| **Calculadora** | Calculadora completa | Operaciones básicas, raíz cuadrada, inverso, al cuadrado |
| **QR Creator** | Generador de códigos QR | Generar y descargar QR desde cualquier texto o URL |
| **PassGen** | Generador de contraseñas | Contraseñas seguras con opciones de longitud y caracteres |
| **Tareas** | Lista de tareas | Crear, marcar como completadas, eliminar |
| **EC Tienda** | Tienda de apps (próximamente) | Catálogo de futuras apps y widgets |

## Atajos de teclado

### EC Office Pro
| Atajo | Acción |
|-------|--------|
| `Ctrl+S` | Guardar |
| `Ctrl+P` | Imprimir |
| `Ctrl+F` | Buscar |
| `Ctrl+H` | Buscar y reemplazar |
| `Ctrl+K` | Insertar enlace |
| `Ctrl+N` | Nuevo documento |
| `Ctrl+B/I/U` | Negrita / Cursiva / Subrayado |

### EC Video Pro
| Atajo | Acción |
|-------|--------|
| `Espacio` | Play / Pausa |
| `← →` | Retroceder / Avanzar 5s |
| `↑ ↓` | Subir / Bajar volumen |
| `F` | Pantalla completa |
| `M` | Silenciar |
| `C` | Subtítulos |
| `S` | Captura de pantalla |
| `P` | Picture-in-Picture |
| `[ ]` | Bajar / Subir velocidad |
| `0-9` | Saltar al 0%-90% |
| `Ctrl+O` | Abrir archivo |

### EC Music Pro
| Atajo | Acción |
|-------|--------|
| `Espacio` | Play / Pausa |
| `Shift+→` | Siguiente pista |
| `Shift+←` | Pista anterior |
| `S` | Aleatorio (shuffle) |
| `R` | Modo repetir |

### EC Studio Pro
| Atajo | Acción |
|-------|--------|
| `Ctrl+Z` | Deshacer |
| `Ctrl+Y` | Rehacer |
| `Escape` | Cancelar recorte |
| `Enter` | Aplicar recorte |
| `Ctrl++` / `Ctrl+-` | Zoom in / out |
| `B` | Pincel |
| `E` | Borrador |
| `T` | Texto |
| `S` | Formas |
| `C` | Recortar |
| `I` | Cuentagotas |
| `F` | Relleno |
| `V` | Seleccionar |
| `0` | Ajustar a la vista |

## Tecnologías utilizadas

| Tecnología | Uso |
|------------|-----|
| **HTML5** | Estructura, video, audio |
| **CSS3** | Animaciones, gradientes, glassmorphism |
| **JavaScript** (vanilla) | Toda la lógica de la aplicación |
| **Tailwind CSS** | Sistema de utilidades para estilos |
| **FontAwesome 6.4** | Iconografía |
| **PrismJS 1.29** | Resaltado de sintaxis en ECCode |
| **QRCode.js 1.0** | Generación de códigos QR |
| **html2pdf.js 0.10** | Exportación a PDF |
| **jsmediatags 3.9** | Extracción de carátula incrustada (ID3/APIC) en música |
| **IndexedDB** | Persistencia local de canciones y videos (`MediaStore`) |

## Instalación

1. Clona o descarga el repositorio
2. Abre `index.html` en cualquier navegador moderno
3. No se requiere servidor — funciona directamente como archivo local

```bash
git clone https://github.com/Estalingradocorp/ECOS.git
cd ECOS
open index.html
```

> **Versión en línea (GitHub Pages):** https://Estalingradocorp.github.io/ECOS/

## Requisitos del navegador

- Chrome 90+
- Firefox 90+
- Safari 14+
- Edge 90+

> **Nota:** Algunas funciones como PiP y Fullscreen requieren HTTPS o localhost.

## Estructura del proyecto

```
EC-OS/
├── index.html            # HTML: escritorio, dock, ventanas, modales, scripts
├── assets/
│   ├── css/styles.css    # Todo el CSS
│   └── js/
│       ├── core.js           # Escritorio, ventanas, sonido, ajustes
│       ├── office.js         # EC Office Pro
│       ├── eccode-calc-qr.js # ECCode, Calculadora, QR
│       ├── studio.js         # EC Studio Pro
│       ├── tasks-passgen.js  # Tareas, PassGen
│       ├── storage.js        # Persistencia de medios (IndexedDB)
│       ├── music.js          # EC Music Pro
│       └── video-tv.js       # EC Video Pro + TV en Vivo
├── obsidian/             # Notas para bóveda Obsidian
├── .github/workflows/deploy.yml  # GitHub Pages
├── README.md             # Este archivo
└── DOCUMENTATION.md      # Documentación técnica y de usuario
```

## Próximamente

- [ ] EC Tienda — tienda de aplicaciones con apps descargables
- [ ] Calculadora científica avanzada
- [ ] Cronómetro / Temporizador
- [ ] EC Games — juegos integrados
- [ ] Aplicación de Clima en vivo
- [ ] Bloc de Notas mejorado
- [ ] Widget system para el escritorio
- [ ] Soporte de plugins/extensiones

## Licencia

Este proyecto fue creado por **Estalingrado Corp** con fines educativos y de demostración.

---

> *"Un sistema operativo entero en un solo archivo HTML."*
