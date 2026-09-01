# EC OS — Documentación Técnica y de Usuario

Sistema operativo completo basado en navegador, inspirado en iPadOS/macOS. Incluye un escritorio con ventanas arrastrables y redimensionables, modo oscuro, sistema de sonido UI y una suite de 12 aplicaciones de productividad y entretenimiento.

El código se organiza en **archivos separados** (HTML, CSS y JavaScript por módulos) para facilitar el mantenimiento, sin herramientas de build y compatible con apertura local (`file://`) y GitHub Pages.

Esta documentación detalla **todas las funciones, características, componentes y atajos** del sistema.

---

## 1. Arquitectura General

### 1.1 Estructura del proyecto

```
EC-OS/
├── index.html                # Body HTML: escritorio, dock, barra de estado, ventanas, modales
├── assets/
│   ├── css/
│   │   └── styles.css        # Todo el CSS: dark mode, animaciones, glassmorphism, responsive
│   └── js/
│       ├── core.js           # Módulos 0–4: sonido, ajustes, carga, reloj, ventanas, resize, navegación
│       ├── office.js         # Módulo 5: EC Office Pro
│       ├── eccode-calc-qr.js # Módulos 6–8: ECCode, Calculadora, QR
│       ├── studio.js         # Módulo 9: EC Studio Pro
│       ├── tasks-passgen.js  # Módulos 10–11: Tareas, PassGen
│       ├── music.js          # Módulo 12: EC Music Pro
│       └── video-tv.js       # Módulos 13–14: EC Video Pro, TV en Vivo
├── .github/workflows/deploy.yml  # GitHub Pages (Actions)
├── .gitignore                # Excluye _backup/
├── README.md                 # Resumen del proyecto
└── DOCUMENTATION.md          # Este documento
```

> **Nota:** el `<head>` de `index.html` enlaza el CSS y los 7 scripts JS externos. Las librerías (Tailwind, FontAwesome, PrismJS, QRCode, html2pdf) se cargan por CDN.

### 1.2 Módulos JavaScript (organización en archivos)

| Archivo | Módulos | Contenido |
|---------|---------|-----------|
| `core.js` | 0–4 | Sonido UI, modo oscuro, ajustes, carga, reloj, fullscreen, fondo, **sistema de ventanas + resize**, navegación |
| `office.js` | 5 | EC Office Pro (páginas, tablas, exportación, autoguardado) |
| `eccode-calc-qr.js` | 6–8 | Editor de código, calculadora, generador QR |
| `studio.js` | 9 | Editor de imágenes (canvas, filtros, recorte, exportación) |
| `tasks-passgen.js` | 10–11 | Tareas, generador de contraseñas |
| `music.js` | 12 | Reproductor de música (playlist, ecualizador) |
| `video-tv.js` | 13–14 | Reproductor de video + TV en vivo IPTV |

### 1.3 Tecnologías y librerías

| Tecnología | Uso |
|------------|-----|
| **HTML5** | Estructura, `<video>`, `<audio>`, `<canvas>` |
| **CSS3** | Animaciones, gradientes, glassmorphism, `backdrop-filter` |
| **JavaScript (vanilla)** | Toda la lógica de la aplicación |
| **Web Audio API** | Síntesis de sonidos UI en tiempo real |
| **Canvas API** | Render del editor de imágenes |
| **Tailwind CSS** | Utilidades de estilos |
| **FontAwesome 6.4** | Iconografía |
| **PrismJS 1.29** | Resaltado de sintaxis (ECCode) |
| **QRCode.js 1.0** | Generación de códigos QR |
| **html2pdf.js 0.10** | Exportación a PDF (html2canvas + jsPDF) |

---

## 2. Sistema Base / Escritorio

### 2.1 Sistema de sonido UI (módulo 0)

Sintetiza efectos de sonido en tiempo real con la **Web Audio API** (sin archivos externos). Cuatro tonos generados con osciladores (sine/triangle), filtros lowpass y envolventes de ganancia:

| Función | Uso | Descripción del tono |
|---------|-----|----------------------|
| `playClick()` | Al pulsar botones | Tap suave moderno (sine + triangle, descendente) |
| `playOpen()` | Al abrir ventana | Whoosh ascendente de "apertura" |
| `playClose()` | Al cerrar ventana | Tono descendente suave |
| `playNotif()` | Notificaciones | Carillón de dos tonos (880 → 1100 Hz) |

- **Desactivar/activar**: `toggleSound(enabled)` — se guarda en `localStorage`.

### 2.2 Modo oscuro global

`toggleDarkMode(enabled)` añade la clase `dark` al `<html>`. Afecta a **todas** las ventanas y componentes mediante variables CSS. Preferencia persistida.

### 2.3 Preferencias y persistencia

- `saveSettings()` — serializa sonido, tema, fondo y otros ajustes a `localStorage`.
- `loadSettings()` — restaura los ajustes al iniciar.
- **Claves de `localStorage` usadas**:
  - `ec_settings` — sonido, modo oscuro, fondo.
  - `ec_tv_channels` — canales IPTV personalizados del usuario.
  - `ec_office_autosave` — auto-guardado de EC Office Pro.

### 2.4 Pantalla de carga y modal BETA

- `showBetaModal()` / `closeBetaModal()` — ventana de aviso "versión beta" al arrancar.
- Barra de progreso animada con mensajes de estado rotativos.

### 2.5 Reloj de la barra de estado

`updateClock()` actualiza la hora/minutos (formato iOS). Se ejecuta en intervalo.

### 2.6 Pantalla completa

`toggleFullScreen()` — activa/desactiva el modo pantalla completa del navegador (requiere HTTPS o localhost).

### 2.7 Fondos de pantalla

`changeWallpaper(url)` — aplica un fondo seleccionado. Incluye **24 opciones**: fotos de Unsplash + gradientes sólidos. Se persiste en `localStorage`.

### 2.8 Sistema de ventanas (módulo 3, en `core.js`)

Gestión de ventanas estilo macOS con **soporte táctil y mouse**:

| Función | Descripción |
|---------|-------------|
| `openWindow(id)` | Abre una ventana por ID; si estaba minimizada, la restaura. Reproduce `playOpen()` |
| `minimizeWindow(id)` | Minimiza con **efecto genie** (la ventana se encoge hacia su icono en el dock) y muestra el **badge rojo** en el dock. Reproduce `playClose()` |
| `restoreWindow(id)` | Restaura la ventana desde el dock (animación inversa) y quita el badge |
| `toggleFromDock(id)` | Alterna desde el dock: restaura si estaba minimizada, trae al frente si está abierta, o la abre |
| `closeWindow(id)` | Cierra con fade-out y detiene la reproducción de audio/video si aplica |
| `bringToFront(element)` | Trae al frente (incrementa `zIndexCounter`) |
| `setDockBadge(id, show)` | Muestra/oculta el badge rojo de minimizado en el icono del dock |
| Resize (bordes/esquinas) | 8 handles (`n/s/e/w/ne/nw/se/sw`) redimensionan la ventana como en macOS |

**Controles de ventana** (esquina superior, solo en las apps con icono en el dock):
- **Cerrar** (rojo)
- **Minimizar** (amarillo)

**Comportamiento:**
- Al **minimizar**, la ventana se encoge hacia el icono del dock con animación `cubic-bezier`, el icono rebota y aparece un badge rojo pulsante.
- Al hacer **clic en el icono del dock**, la ventana se restaura y el badge desaparece.
- Al **cerrar** la ventana de Música o Video, la reproducción se **pausa y reinicia** (`stopWindowMedia`).
- Las ventanas se pueden **redimensionar** arrastrando cualquier borde o esquina (mín. 300×200, limitado al viewport).
- En móvil (≤768px) las ventanas son a pantalla completa y el resize queda desactivado.

> **Nota sobre minimizar:** las apps sin icono en el dock (Tareas, PassGen, QR) no tienen botón de minimizar para no quedar inaccesibles.

### 2.9 Navegación de enlaces externos (módulo 4)

Modal de confirmación al pulsar enlaces externos:
- `confirmNavigation(url)` — muestra el modal con la URL.
- `cancelNavigation()` — cierra el modal.
- `proceedNavigation()` — abre la URL en nueva pestaña.

---

## 3. Aplicaciones

### 3.1 EC Office Pro — Procesador de textos (módulo 5)

Suite completa estilo LibreOffice sobre un editor `contenteditable`, con **sistema de páginas A4 reales**.

#### Gestión de páginas
| Función | Descripción |
|---------|-------------|
| `officeCreatePage(html, insertAfter)` | Crea una página A4 (añadir/duplicar) |
| `officeRemovePage(pageEl)` | Elimina una página |
| `officeUpdatePageNumbers()` | Renumera las páginas automáticamente |
| `officeCheckPages()` | Detecta desbordamiento y sugiere nuevas páginas |
| `officeSetupPageEditor(editor)` | Configura la edición de cada página |
| `officeGetAllContent()` / `officeSetAllContent(html)` | Obtiene/aplica el contenido de todas las páginas |

#### Formato de texto
- `formatDoc(cmd, value)` — ejecuta `document.execCommand` (negrita, cursiva, subrayado, listas, alineación, etc.).
- `officeApplyHeading(tag)` — aplica encabezados H1–H4.
- `officeFormatPainter()` — pincel de formato (copia formato).
- `officeInsertHR()` — línea horizontal.
- `officeInsertDate()` — inserta la fecha actual en formato español.
- `officeInsertEmoji()` — panel de emojis.

#### Tablas
| Función | Descripción |
|---------|-------------|
| `officeInsertTable()` / `officeConfirmInsertTable()` | Inserta tabla con filas/columnas configurables |
| `officeTableAction(action)` | Insertar/eliminar fila o columna, borrar tabla |
| `officeGetTable()` / `officeGetRow()` / `officeGetCell()` | Detectan el elemento bajo el cursor |
| `officeCheckTableToolbar()` | Habilita/deshabilita la barra de herramientas de tabla |

#### Enlaces
- `officeInsertLink()` / `officeConfirmInsertLink()` — inserta enlace con texto y URL.

#### Buscar y reemplazar
| Función | Descripción |
|---------|-------------|
| `officeFindReplace()` / `officeCloseFindModal()` | Abre/cierra el modal |
| `officeFindNext()` | Busca y resalta la siguiente coincidencia |
| `officeClearFindHighlights()` | Limpia los resaltados |
| `officeReplaceOne()` | Reemplaza una coincidencia |
| `officeReplaceAll()` | Reemplaza todas |

#### Corrección ortográfica
`officeSpellCheck()` — resalta posibles errores en el documento.

#### Guardar / Exportar
`saveOfficeDoc()` → `executeSaveOfficeDoc()` — modal con **nombre y formato**:

| Formato | Extensión | Implementación |
|---------|-----------|----------------|
| **PDF** | `.pdf` | `html2pdf.js` (html2canvas + jsPDF), A4 vertical, 98% calidad |
| **HTML** | `.html` | Documento completo autocontenido con estilos |
| **DOC** | `.doc` | HTML con namespace de Word (`application/msword`) |
| **Markdown** | `.md` | Conversión HTML→MD con `officeHtmlToMarkdown()` |
| **TXT** | `.txt` | Texto plano sin etiquetas |

- `openOfficeDoc()` — abre documentos `.html`/`.md` guardados (input de archivo).

#### Otras funciones
| Función | Descripción |
|---------|-------------|
| `printOfficeDoc()` | Diálogo de impresión del navegador |
| `insertImagePrompt()` | Inserta imagen por URL |
| `toggleOfficeFullscreen()` | Pantalla completa del editor |
| `officeZoomIn()` / `officeZoomOut()` / `officeZoomReset()` | Zoom 50%–200% |
| `officeApplyZoom()` | Aplica el nivel de zoom |
| `officeUpdateStatusBar()` | Muestra palabras/caracteres |
| `officeAutoSave()` / `officeAutoLoad()` | Auto-guardado (2s tras detenerse la escritura) y auto-restauración |
| `officeScheduleAutoSave()` | Programa el auto-guardado con `setTimeout` |

**Atajos de teclado** en editor de página:
| Atajo | Acción |
|-------|--------|
| `Ctrl+S` | Guardar |
| `Ctrl+P` | Imprimir |
| `Ctrl+F` | Buscar |
| `Ctrl+H` | Buscar y reemplazar |
| `Ctrl+K` | Insertar enlace |
| `Ctrl+N` | Nuevo documento |
| `Ctrl+B` / `Ctrl+I` / `Ctrl+U` | Negrita / Cursiva / Subrayado |

---

### 3.2 EC Studio Pro — Editor de imágenes (módulo 9)

Editor profesional sobre Canvas. Herramientas organizadas en **paneles**.

#### Herramientas de dibujo (`setImgTool`)
| Herramienta | Descripción |
|-------------|-------------|
| **Freehand** | Pincel a mano alzada (`startDraw` / `moveDraw` / `endDraw`) |
| **Shape** | Formas geométricas |
| **Text** | Añadir texto a la imagen (campo inline, sin prompt nativo) |
| **Fill** | Relleno de color por región contigua (flood-fill) |
| **Crop** | Recorte interactivo |
| **Eyedropper** | Selector de color (copia el hex al portapapeles) |
| **Eraser** | Borrador (alpha a `destination-out`) |

**Opacidad**: slider global `imgOpacity` (0–100%) aplicado a pincel, borrador, formas, texto y relleno.

#### Formas (`drawShape`)
| Tipo | Descripción |
|------|-------------|
| `rect` | Rectángulo |
| `circle` | Elipse |
| `line` | Línea |
| `arrow` | Flecha (punta calculada por ángulo) |
| `star` | Estrella de 5 puntas |

#### Ajustes de imagen (`updateImgFilter`)
9 filtros con sliders (valores 0–100):
Brillo, Contraste, Saturación, Escala de grises, Sepia, Hue/Rotación de tono, Temperatura, Exposición, Desenfoque, Nitidez, Viñeta.

#### Presets de filtro (`applyPreset`)
8 presets que aplican combinaciones de ajustes:

| Preset | Efecto principal |
|--------|------------------|
| `vintage` | Sepia + calidez, bajo contraste |
| `cold` | Tonos azulados, baja temperatura |
| `warm` | Tonos cálidos, más saturación |
| `dramatic` | Alto contraste + viñeta + nitidez |
| `faded` | Desvanecido, baja saturación, desenfoque |
| `noir` | Blanco y negro + alto contraste + viñeta |
| `sunset` | Atardecer: cálido + saturado |
| `cyberpunk` | Tono magenta/270°, alta saturación |

#### Transformaciones (`transformImg`)
- **Rotar** (incrementos de grados)
- **Voltear horizontal** (`flipH`)
- **Voltear vertical** (`flipV`)

#### Redimensionado (`applyResize` / `applyResizePct`)
- Redimensionado por ancho/alto en píxeles.
- Redimensionado por porcentaje (25/50/75/100%).
- **Bloqueo de proporción** (aspect ratio) al cambiar ancho.

#### Render principal (`renderImgFinal`)
Renderiza la imagen con todos los ajustes (filtros CSS + transformaciones + redimensionado) en el canvas de vista previa.

#### Deshacer / Rehacer
| Función | Descripción |
|---------|-------------|
| `saveHistory()` | Guarda un estado (imagen + filtros + texto + capa de dibujo) |
| `imgUndo()` | Deshacer (`Ctrl+Z`) |
| `imgRedo()` | Rehacer (`Ctrl+Y`) |
| `restoreHistory(idx)` | Restaura un estado concreto |

El historial persiste también la **capa de dibujo** (`drawLayer`), por lo que deshacer cubre bocetos, formas y borrado.

#### Herramienta de recorte
| Función | Descripción |
|---------|-------------|
| `startCrop()` / `cancelCrop()` | Inicia/cancela el recorte |
| `drawCropOverlay()` | Dibuja el rectángulo de recorte (regla de tercios + mangos) |
| `getCropHandle(mx, my)` | Detecta el mango (esquina) |
| `onCropMouseDown/Move/Up` | Interacción de recorte |
| `applyCrop()` | Aplica el recorte final |
| `setCropAspect(val)` | Fija proporción de recorte |

**Proporciones de recorte** (`cropAspect`): Libre / 1:1 / 4:3 / 16:9 / 3:2. Al seleccionar una proporción, el rectángulo se ajusta manteniendo el ancla según el mango arrastrado.

#### Zoom
| Función | Descripción |
|---------|-------------|
| `imgZoomIn()` / `imgZoomOut()` | Zoom del lienzo |
| `imgFitToView()` | Ajusta a la vista |

También: **zoom con rueda del ratón** sobre el canvas.

#### Otras
- `resetImgEditor()` — restablece todos los ajustes.
- `openExportModal()` — abre el modal de exportación con formato, escala y calidad.
- `downloadExport()` / `renderExportCanvas(scale)` — exporta la imagen final.
- `imgRemoveText()` — elimina la última anotación de texto añadida.
- `imgCompareDown()` / `imgCompareUp()` — comparar antes/después (mantener pulsado el botón de ojo).
- `scheduleRender()` — render diferido con `requestAnimationFrame` (evita bloqueos con imágenes grandes).

**Rendimiento**: los sliders de ajustes/filtros y la rotación libre usan `scheduleRender()` (debounce por rAF), de modo que el render pesado (ruido/nitidez por píxel) solo ocurre una vez por frame.

#### Exportación (modal `img-export-modal`)
- **Formato**: PNG (sin pérdida) / JPEG / WebP.
- **Calidad**: 10–100% (solo JPEG/WebP; oculto en PNG).
- **Escala**: 1x (resolución original) / 2x (doble).
- Reutiliza el pipeline completo: filtros, temperatura, viñeta, ruido, nitidez, capa de dibujo y texto.

**Atajos de teclado**:
| Atajo | Acción |
|-------|--------|
| `Ctrl+Z` | Deshacer |
| `Ctrl+Y` | Rehacer |
| `Escape` | Cancelar recorte |
| `Enter` | Aplicar recorte |
| `Ctrl++` / `Ctrl+-` | Zoom in / out |
| `B` / `E` / `T` / `S` / `C` / `I` / `F` / `V` | Pincel / Borrador / Texto / Formas / Recorte / Cuentagotas / Relleno / Seleccionar |
| `0` | Ajustar a la vista |

---

### 3.3 EC Music Pro — Reproductor de música (módulo 12)

Reproductor moderno con playlist y ecualizador visual animado.

#### Gestión de playlist
| Función | Descripción |
|---------|-------------|
| `addFilesToPlaylist(files)` | Añade archivos de audio |
| `updatePlaylistUI()` | Renderiza la lista |
| `removeTrack(index)` | Elimina una pista |
| `resetPlayerUI()` | Reinicia el reproductor |

**Carga de archivos**: input de archivo + **drag & drop** sobre la zona de soltar.

#### Reproducción
| Función | Descripción |
|---------|-------------|
| `playTrack(index)` | Reproduce una pista |
| `togglePlayPause()` | Play/Pausa |
| `nextTrack()` / `prevTrack()` | Siguiente / anterior |
| `seekTrack(val)` | Avance por barra de progreso |
| `updateVolume(val)` | Control de volumen |
| `formatTime(sec)` | Formatea mm:ss |

#### Aleatorio y repetición
| Función | Descripción |
|---------|-------------|
| `buildShuffleOrder()` | Construye el orden aleatorio |
| `toggleShuffle()` | Activa/desactiva shuffle |
| `toggleRepeat()` | Cicla modos de repetición |

#### Eventos de audio
- Actualización de tiempo, barra de progreso, ecualizador animado, final de pista (auto-avance).

**Atajos de teclado** (con la ventana de música activa):
| Atajo | Acción |
|-------|--------|
| `Espacio` | Play / Pausa |
| `Shift+→` | Siguiente pista |
| `Shift+←` | Pista anterior |
| `S` | Aleatorio |
| `R` | Repetir |

---

### 3.4 EC Video Pro — Reproductor de video (módulo 13)

Reproductor completo estilo VLC con controles avanzados y overlay de mensajes.

#### Gestión de archivos y playlist
| Función | Descripción |
|---------|-------------|
| `vidAddFiles(files)` | Añade archivos de video (MP4/WebM/MOV) |
| `vidUpdatePlaylistUI()` | Renderiza la lista |
| `vidRemoveTrack(idx)` | Elimina un elemento |
| `vidResetUI()` | Reinicia el reproductor |
| `vidPlay(idx)` | Reproduce un elemento |

#### Reproducción y controles
| Función | Descripción |
|---------|-------------|
| `vidTogglePlay()` | Play/Pausa |
| `vidNext()` / `vidPrev()` | Siguiente / anterior |
| `vidSetVolume(val)` / `vidToggleMute()` | Volumen y silencio |
| `vidUpdateVolumeIcon()` | Actualiza el icono de volumen |
| `showVidMsg(msg)` / `hideVidMsg()` | Overlay de mensajes (ej. "-5s") |
| `vidSetSpeed(speed)` | Velocidad de reproducción (0.25×–4×) |
| `vidToggleSpeedMenu()` | Menú de velocidad |
| `vidTogglePlaylist()` | Panel de playlist |

#### Subtítulos
`vidToggleSubtitles()` — carga y alterna pistas de subtítulos (`<track>`), con entrada de archivo `.vtt`.

#### Captura y PIP
| Función | Descripción |
|---------|-------------|
| `vidScreenshot()` | Captura el fotograma actual (descarga PNG) |
| `vidToggleFullscreen()` | Pantalla completa |
| `vidTogglePiP()` | Picture-in-Picture (requiere HTTPS) |

#### UI avanzada
- Barra de **progreso con buffer** (porción cargada).
- Controles **auto-ocultables** al inactividad.
- Overlay de **buffering**.
- Clic en video = play/pausa; **doble clic** = pantalla completa.
- `vidFormatTime(s)` — formateo de tiempo.

#### Atajos de teclado (VLC-style)
| Atajo | Acción |
|-------|--------|
| `Espacio` | Play / Pausa |
| `←` / `→` | Retroceder / Avanzar 5s |
| `↑` / `↓` | Subir / Bajar volumen |
| `F` | Pantalla completa |
| `M` | Silenciar |
| `C` | Subtítulos |
| `S` | Captura de pantalla |
| `P` | Picture-in-Picture |
| `[` / `]` | Bajar / Subir velocidad |
| `Home` | Ir al inicio |
| `End` | Ir al final |
| `0`–`9` | Saltar al 0%–90% |
| `Ctrl+O` | Abrir archivo (global cuando el video está abierto) |

---

### 3.5 TV en Vivo — Canales IPTV (módulo 14)

Reproductor integrado con **31 canales gratuitos** y posibilidad de añadir streams propios.

#### Canales incluidos
| Categoría | Canales |
|-----------|---------|
| **Noticias** | BBC News, CNN, Al Jazeera, France 24, DW News, Euronews, NHK World, CNA, Bloomberg TV, CBS News, NBC News NOW, Sky News, Fox Weather, ABC News (AU), WION, CGTN, RT |
| **Deportes** | Stadium, FIFA+, Tastemade |
| **Entretenimiento** | Red Bull TV, PBS, Classic Arts, TV5 Monde |
| **Música** | Stingray CMusic, MTV Hits, Club MTV |
| **Infantil** | Cartoon Network, Nickelodeon |

#### Funciones
| Función | Descripción |
|---------|-------------|
| `tvRenderChannels()` | Renderiza la lista filtrada |
| `tvPlayChannel(ch)` | Reproduce un canal en el reproductor de video |
| `tvFilterCategory(cat)` | Filtra por categoría (todos, mis canales, o categoría) |
| `tvAddStream()` | Añade un stream personalizado por URL (persistido en `ec_tv_channels`) |
| `tvToggleTVPanel()` | Muestra/oculta el panel de TV |

- **Añadir canal**: escribe la URL del stream y pulsa Enter, luego introduce el nombre. Los canales del usuario se guardan en `localStorage` y se marcan como "(tu)".
- **Indicador "EN VIVO"** y badge de canal reproduciéndose.
- Funciona sobre el mismo motor de EC Video Pro.

---

### 3.6 ECCode — Editor de código (módulo 6)

Editor de código con **resaltado de sintaxis** en tiempo real y números de línea sincronizados.

#### Funciones
| Función | Descripción |
|---------|-------------|
| `updateCode()` | Actualiza el resaltado (`Prism.highlightElement`) |
| `changeCodeLanguage()` | Cambia el lenguaje (etiqueta + resaltado) |
| `updateLineNumbers()` | Sincroniza los números de línea |
| `syncScroll()` | Alinea scroll entre editor, números y capa resaltada |
| `updateCursorPos()` | Muestra "Línea: X, Col: Y" en la barra de estado |
| `saveCodeDoc()` | Guarda el código como archivo |
| `openCodeDoc()` | Abre un archivo de código |

#### Lenguajes soportados
JavaScript, Python, HTML, CSS, SQL (PrismJS).

**Atajos**: `Tab` = inserta indentación; `Ctrl+O` = abrir.

---

### 3.7 Calculadora (módulo 7)

Calculadora básica con historial de operaciones en pantalla.

| Función | Descripción |
|---------|-------------|
| `upDisp()` | Actualiza pantalla e historial (con símbolos + − × ÷) |
| `calcInput(v)` | Añade dígito o punto decimal |
| `calcClear()` | Limpia todo |
| `calcAction(op)` | Ejecuta una operación (suma, resta, multiplicación, división) |
| `calcCalculate()` | Calcula el resultado |

**Funciones adicionales**: raíz cuadrada, inverso (1/x), al cuadrado (x²).

---

### 3.8 QR Creator (módulo 8)

Generador de códigos QR a partir de texto o URL.

| Función | Descripción |
|---------|-------------|
| `generateQR()` | Genera el QR (librería QRCode.js) |
| `downloadQR()` | Descarga el QR como imagen PNG |

---

### 3.9 PassGen — Generador de contraseñas (módulo 11)

Generador de contraseñas seguras con opciones configurables.

| Función | Descripción |
|---------|-------------|
| `generatePassword()` | Genera una contraseña según longitud y tipos de caracteres (mayúsculas, minúsculas, números, símbolos) |
| `copyPassword()` | Copia al portapapeles |

---

### 3.10 Tareas (módulo 10)

Lista de tareas simple.

| Función | Descripción |
|---------|-------------|
| `addTask()` | Añade una tarea (input → lista) |
| – | Marcar como completada (checkbox, tachado) |
| – | Eliminar (botón de papelera al pasar el ratón) |

---

## 4. Aplicación próxima

**EC Tienda** — tienda de aplicaciones (pendiente). Las siguientes funcionalidades están previstas en la hoja de ruta:
- EC Tienda con apps descargables
- Calculadora científica avanzada
- Cronómetro / Temporizador
- EC Games (juegos integrados)
- Aplicación de Clima en vivo
- Bloc de Notas mejorado
- Sistema de widgets en el escritorio
- Soporte de plugins/extensiones

---

## 5. Referencia Rápida de Atajos de Teclado

### Nivel global
| Atajo | Acción |
|-------|--------|
| `Ctrl+O` | Abrir archivo de video (si el reproductor está abierto) |

### EC Office Pro
| Atajo | Acción |
|-------|--------|
| `Ctrl+S` | Guardar |
| `Ctrl+P` | Imprimir |
| `Ctrl+F` | Buscar |
| `Ctrl+H` | Buscar y reemplazar |
| `Ctrl+K` | Insertar enlace |
| `Ctrl+N` | Nuevo documento |
| `Ctrl+B` / `Ctrl+I` / `Ctrl+U` | Negrita / Cursiva / Subrayado |

### EC Video Pro
| Atajo | Acción |
|-------|--------|
| `Espacio` | Play / Pausa |
| `←` / `→` | −5s / +5s |
| `↑` / `↓` | Volumen |
| `F` | Pantalla completa |
| `M` | Silenciar |
| `C` | Subtítulos |
| `S` | Captura de pantalla |
| `P` | Picture-in-Picture |
| `[` / `]` | Velocidad |
| `Home` / `End` | Inicio / Fin |
| `0`–`9` | Saltar al % |
| `Ctrl+O` | Abrir archivo |

### EC Music Pro
| Atajo | Acción |
|-------|--------|
| `Espacio` | Play / Pausa |
| `Shift+→` | Siguiente |
| `Shift+←` | Anterior |
| `S` | Aleatorio |
| `R` | Repetir |

### EC Studio Pro
| Atajo | Acción |
|-------|--------|
| `Ctrl+Z` | Deshacer |
| `Ctrl+Y` | Rehacer |
| `Escape` | Cancelar recorte |
| `Enter` | Aplicar recorte |
| `Ctrl++` / `Ctrl+-` | Zoom in / out |
| `Rueda` | Zoom sobre el canvas |

---

## 6. Requisitos y Notas Técnicas

### Navegadores soportados
- Chrome 90+, Firefox 90+, Safari 14+, Edge 90+.

### Limitaciones
- **Picture-in-Picture (PIP)** y **Pantalla completa** requieren **HTTPS o localhost**.
- Las URLs de streaming IPTV dependen de la disponibilidad externa de las fuentes.
- `document.execCommand` (usado por EC Office) es una API heredada, pero totalmente compatible con navegadores modernos.

### Ejecución
No requiere servidor ni build — abre `index.html` directamente en el navegador (los CSS/JS externos se cargan por rutas relativas `assets/`). También se despliega en **GitHub Pages** mediante el workflow `.github/workflows/deploy.yml` (copia `index.html`, `.nojekyll` y `assets/` a `public/`).

```bash
git clone https://github.com/nicotips27/EC-OS.git
cd EC-OS
open index.html   # (o doble clic / iniciar http-server)
```

---

## 7. Índice completo de funciones

### Sistema y escritorio
`iniciarConexion`, `getAudioCtx`, `playClick`, `playOpen`, `playClose`, `playNotif`, `toggleSound`, `toggleDarkMode`, `saveSettings`, `loadSettings`, `showBetaModal`, `closeBetaModal`, `updateClock`, `toggleFullScreen`, `changeWallpaper`, `openWindow`, `closeWindow`, `bringToFront`, `dragStart`, `dragMove`, `dragEnd`, `confirmNavigation`, `cancelNavigation`, `proceedNavigation`

### EC Office Pro
`officeCreatePage`, `officeRemovePage`, `officeUpdatePageNumbers`, `officeCheckPages`, `officeSetupPageEditor`, `officeGetAllContent`, `officeSetAllContent`, `formatDoc`, `saveOfficeDoc`, `closeSaveOfficeModal`, `executeSaveOfficeDoc`, `officeHtmlToMarkdown`, `openOfficeDoc`, `officeMenuAction`, `officeInsertTable`, `officeCloseTableModal`, `officeConfirmInsertTable`, `officeTableAction`, `officeGetTable`, `officeGetRow`, `officeGetCell`, `officeGetCellIndex`, `officeCheckTableToolbar`, `officeInsertLink`, `officeCloseLinkModal`, `officeConfirmInsertLink`, `officeInsertHR`, `officeInsertDate`, `officeInsertEmoji`, `officeCloseEmojiModal`, `officeApplyHeading`, `officeFormatPainter`, `officeFindReplace`, `officeCloseFindModal`, `officeFindNext`, `officeClearFindHighlights`, `officeReplaceOne`, `officeReplaceAll`, `officeSpellCheck`, `printOfficeDoc`, `insertImagePrompt`, `toggleOfficeFullscreen`, `officeZoomIn`, `officeZoomOut`, `officeZoomReset`, `officeApplyZoom`, `officeUpdateStatusBar`, `officeAutoSave`, `officeAutoLoad`, `officeScheduleAutoSave`

### ECCode
`escapeHtml`, `updateCode`, `changeCodeLanguage`, `updateLineNumbers`, `syncScroll`, `updateCursorPos`, `saveCodeDoc`, `openCodeDoc`

### Calculadora
`upDisp`, `calcInput`, `calcClear`, `calcAction`, `calcCalculate`

### QR Gen
`generateQR`, `downloadQR`

### EC Studio Pro
`setImgTool`, `showImgPanel`, `updateImgFilter`, `applyPreset`, `transformImg`, `imgFreeRotate`, `applyResize`, `applyResizePct`, `renderImgFinal`, `scheduleRender`, `saveHistory`, `imgUndo`, `imgRedo`, `restoreHistory`, `initDrawLayer`, `getCanvasCoords`, `startDraw`, `moveDraw`, `endDraw`, `drawShape`, `floodFill`, `hexToRgba`, `sameColor`, `startCrop`, `cancelCrop`, `drawCropOverlay`, `getCropHandle`, `onCropMouseDown`, `onCropMouseMove`, `onCropMouseUp`, `applyCrop`, `setCropAspect`, `imgZoomIn`, `imgZoomOut`, `imgFitToView`, `imgCompareDown`, `imgCompareUp`, `imgRemoveText`, `resetImgEditor`, `openExportModal`, `closeExportModal`, `updateExportQualityVis`, `renderExportCanvas`, `downloadExport`

### Tareas / PassGen
`addTask`, `generatePassword`, `copyPassword`

### EC Music Pro
`addFilesToPlaylist`, `updatePlaylistUI`, `removeTrack`, `resetPlayerUI`, `playTrack`, `togglePlayPause`, `nextTrack`, `prevTrack`, `buildShuffleOrder`, `toggleShuffle`, `toggleRepeat`, `formatTime`, `seekTrack`, `updateVolume`

### EC Video Pro y TV
`vidAddFiles`, `vidUpdatePlaylistUI`, `vidRemoveTrack`, `vidResetUI`, `vidPlay`, `vidTogglePlay`, `vidNext`, `vidPrev`, `vidSetVolume`, `vidToggleMute`, `vidUpdateVolumeIcon`, `showVidMsg`, `hideVidMsg`, `vidSetSpeed`, `vidToggleSpeedMenu`, `vidToggleSubtitles`, `vidScreenshot`, `vidToggleFullscreen`, `vidFormatTime`, `vidTogglePlaylist`, `tvRenderChannels`, `tvPlayChannel`, `tvFilterCategory`, `tvAddStream`, `tvToggleTVPanel`

---

## 8. Licencia y créditos

Proyecto creado por **Estalingrado Corp** con fines educativos y de demostración.

> *"Un sistema operativo entero en un solo archivo HTML."*