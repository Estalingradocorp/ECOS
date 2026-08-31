        // --- 9. EC Studio Pro ---
        let edImg = null;
        let imgSt = {
            brightness: 100, contrast: 100, saturation: 100, exposure: 0, temperature: 0,
            sharpen: 0, vignette: 0, noise: 0, gamma: 100,
            grayscale: 0, sepia: 0, blur: 0, hue: 0, invert: 0,
            rotate: 0, flipH: 1, flipV: 1, freeRotate: 0
        };
        const NEUTRAL_IMG_ST = JSON.parse(JSON.stringify(imgSt));
        let imgZoom = 1;
        let imgTool = 'select';
        let imgHistory = [];
        let imgHistoryIdx = -1;
        const MAX_HISTORY = 30;
        let imgOpacity = 100;
        let cropAspect = 'free';
        let renderPending = false;

        // Drawing state
        let isDrawing = false;
        let drawCtx = null;
        let drawLayer = null;
        let lastX = 0, lastY = 0;

        // Crop state
        let cropActive = false;
        let cropRect = { x: 0, y: 0, w: 0, h: 0 };
        let cropDragging = false;
        let cropDragStart = { x: 0, y: 0 };
        let cropHandle = null;
        let cropImgRect = null;

        // Text drawing state
        let textLayer = [];

        const cvs = document.getElementById('img-canvas');
        const ctx = cvs.getContext('2d');
        const ovs = document.getElementById('img-overlay');
        const oCtx = ovs.getContext('2d');

        // --- Upload ---
        document.getElementById('img-upload-input').addEventListener('change', e => {
            if (!e.target.files[0]) return;
            const r = new FileReader();
            r.onload = ev => {
                const i = new Image();
                i.onload = () => {
                    edImg = i;
                    textLayer = [];
                    resetImgEditor();
                    saveHistory();
                    // Auto-fill resize inputs
                    document.getElementById('img-resize-w').value = edImg.width;
                    document.getElementById('img-resize-h').value = edImg.height;
                };
                i.src = ev.target.result;
            };
            r.readAsDataURL(e.target.files[0]);
        });

        // Drag & drop support
        const imgPreviewContainer = document.getElementById('img-preview-container');
        imgPreviewContainer.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
        imgPreviewContainer.addEventListener('drop', e => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (!file || !file.type.startsWith('image/')) return;
            const r = new FileReader();
            r.onload = ev => {
                const i = new Image();
                i.onload = () => {
                    edImg = i;
                    textLayer = [];
                    resetImgEditor();
                    saveHistory();
                    document.getElementById('img-resize-w').value = edImg.width;
                    document.getElementById('img-resize-h').value = edImg.height;
                };
                i.src = ev.target.result;
            };
            r.readAsDataURL(file);
        });

        // --- Tool selection ---
        function setImgTool(tool) {
            playClick();
            if (cropActive && tool !== 'crop') cancelCrop();
            imgTool = tool;
            document.querySelectorAll('#window-img-editor .img-tool-btn').forEach(b => b.classList.remove('active-tool'));
            const btn = document.getElementById('tool-' + tool);
            if (btn) btn.classList.add('active-tool');
            // Show/hide shape/text options
            document.getElementById('shape-options').style.display = tool === 'shape' ? 'flex' : 'none';
            document.getElementById('text-options').style.display = tool === 'text' ? 'flex' : 'none';
            // Show/hide crop options + apply/cancel buttons
            const cropOpts = document.getElementById('crop-options');
            const cropApply = document.getElementById('btn-crop-apply');
            const cropCancel = document.getElementById('btn-crop-cancel');
            if (cropOpts) cropOpts.style.display = tool === 'crop' ? 'flex' : 'none';
            cropApply.style.display = tool === 'crop' ? 'flex' : 'none';
            cropCancel.style.display = tool === 'crop' ? 'flex' : 'none';
            // Canvas cursor
            if (tool === 'draw' || tool === 'eraser' || tool === 'fill' || tool === 'eyedropper') {
                cvs.style.cursor = 'crosshair';
                cvs.style.pointerEvents = 'auto';
            } else if (tool === 'crop') {
                startCrop();
            } else if (tool === 'text') {
                cvs.style.cursor = 'text';
                cvs.style.pointerEvents = 'auto';
                const ti = document.getElementById('img-text-input');
                if (ti) { ti.focus(); ti.select(); }
            } else {
                cvs.style.cursor = 'default';
                cvs.style.pointerEvents = 'none';
            }
            ovs.style.pointerEvents = (tool === 'crop') ? 'auto' : 'none';
        }

        // --- Panels ---
        function showImgPanel(panel) {
            ['adjustments', 'filters', 'transform'].forEach(p => {
                document.getElementById('img-panel-' + p).classList.toggle('hidden', p !== panel);
            });
            ['adj', 'fil', 'trf'].forEach(t => {
                const tab = document.getElementById('panel-tab-' + t);
                const mapping = { adj: 'adjustments', fil: 'filters', trf: 'transform' };
                if (mapping[t] === panel) {
                    tab.classList.add('text-blue-600', 'border-b-2', 'border-blue-500');
                    tab.classList.remove('text-gray-400');
                } else {
                    tab.classList.remove('text-blue-600', 'border-b-2', 'border-blue-500');
                    tab.classList.add('text-gray-400');
                }
            });
        }

        // --- Filters ---
        const filterUnits = { brightness: '%', contrast: '%', saturation: '%', grayscale: '%', sepia: '%', blur: 'px', hue: 'Â°', invert: '%', exposure: '', temperature: '', sharpen: '', vignette: '', noise: '', gamma: '' };

        // Debounced render using requestAnimationFrame (avoids blocking UI on large images)
        function scheduleRender() {
            if (renderPending) return;
            renderPending = true;
            requestAnimationFrame(() => {
                renderPending = false;
                renderImgFinal();
            });
        }

        function updateImgFilter(f, v) {
            imgSt[f] = parseFloat(v);
            const unit = filterUnits[f] || '';
            document.getElementById(`val-${f}`).textContent = `${v}${unit}`;
            scheduleRender();
        }

        // --- Filter presets ---
        function applyPreset(name) {
            playClick();
            const presets = {
                vintage:     { brightness: 110, contrast: 85, saturation: 70, sepia: 40, hue: 0, temperature: 20, exposure: 5 },
                cold:        { brightness: 100, contrast: 110, saturation: 90, hue: 200, temperature: -40, exposure: 0 },
                warm:        { brightness: 105, contrast: 105, saturation: 120, hue: 10, temperature: 35, exposure: 5 },
                dramatic:    { brightness: 90, contrast: 150, saturation: 80, sharpen: 30, vignette: 40 },
                faded:       { brightness: 115, contrast: 80, saturation: 60, sepia: 15, blur: 0.3 },
                noir:        { brightness: 95, contrast: 130, grayscale: 100, vignette: 30, sharpen: 20 },
                sunset:      { brightness: 105, contrast: 110, saturation: 130, hue: 15, temperature: 30, vignette: 20 },
                cyberpunk:   { brightness: 95, contrast: 140, saturation: 150, hue: 270, temperature: -20, vignette: 30, sharpen: 15 }
            };
            const p = presets[name];
            if (!p) return;
            Object.keys(p).forEach(k => {
                imgSt[k] = p[k];
                const sl = document.getElementById('slider-' + k);
                if (sl) sl.value = p[k];
                const vl = document.getElementById('val-' + k);
                if (vl) vl.textContent = p[k] + (filterUnits[k] || '');
            });
            scheduleRender();
        }

        // --- Transform ---
        function transformImg(t, v) {
            playClick();
            if (t === 'rotate') imgSt.rotate += v;
            if (t === 'flipH') imgSt.flipH *= -1;
            if (t === 'flipV') imgSt.flipV *= -1;
            renderImgFinal();
            saveHistory();
        }

        function imgFreeRotate(v) {
            imgSt.freeRotate = parseFloat(v);
            document.getElementById('val-freeRotate').textContent = v + 'Â°';
            scheduleRender();
        }

        // --- Resize ---
        function applyResize() {
            if (!edImg) return;
            playClick();
            let w = parseInt(document.getElementById('img-resize-w').value);
            let h = parseInt(document.getElementById('img-resize-h').value);
            if (!w || !h || w < 1 || h < 1) return;
            const tempCvs = document.createElement('canvas');
            tempCvs.width = w; tempCvs.height = h;
            const tCtx = tempCvs.getContext('2d');
            tCtx.drawImage(edImg, 0, 0, w, h);
            const newImg = new Image();
            newImg.onload = () => {
                edImg = newImg;
                renderImgFinal();
                saveHistory();
                document.getElementById('img-resize-w').value = w;
                document.getElementById('img-resize-h').value = h;
            };
            newImg.src = tempCvs.toDataURL();
        }

        function applyResizePct(pct) {
            if (!edImg) return;
            document.getElementById('img-resize-w').value = Math.round(edImg.width * pct / 100);
            document.getElementById('img-resize-h').value = Math.round(edImg.height * pct / 100);
            applyResize();
        }

        // Lock aspect ratio for resize
        document.getElementById('img-resize-w').addEventListener('input', function() {
            if (!edImg || !document.getElementById('img-resize-lock').checked) return;
            const ratio = edImg.height / edImg.width;
            document.getElementById('img-resize-h').value = Math.round(this.value * ratio);
        });
        document.getElementById('img-resize-h').addEventListener('input', function() {
            if (!edImg || !document.getElementById('img-resize-lock').checked) return;
            const ratio = edImg.width / edImg.height;
            document.getElementById('img-resize-w').value = Math.round(this.value * ratio);
        });

        // --- Main Render ---
        function renderImgFinal() {
            if (!edImg) return;
            document.getElementById('img-placeholder').classList.add('hidden');
            cvs.classList.remove('hidden');
            ovs.classList.remove('hidden');

            // Compute canvas dimensions (swap w/h for rotations)
            const freeRot = parseInt(document.getElementById('slider-freeRotate')?.value || 0);
            const totalRot = (imgSt.rotate + freeRot) % 360;
            const swapped = totalRot % 180 !== 0;
            const cw = swapped ? edImg.height : edImg.width;
            const ch = swapped ? edImg.width : edImg.height;

            // Apply zoom
            const displayW = Math.round(cw * imgZoom);
            const displayH = Math.round(ch * imgZoom);
            cvs.width = cw; cvs.height = ch;
            ovs.width = cw; ovs.height = ch;
            cvs.style.width = displayW + 'px'; cvs.style.height = displayH + 'px';
            ovs.style.width = displayW + 'px'; ovs.style.height = displayH + 'px';

            // Build filter string
            const brightness = imgSt.brightness * (1 + imgSt.exposure / 200);
            let filterStr = `brightness(${brightness}%) contrast(${imgSt.contrast}%) saturate(${imgSt.saturation}%) grayscale(${imgSt.grayscale}%) sepia(${imgSt.sepia}%) blur(${imgSt.blur}px) hue-rotate(${imgSt.hue}deg) invert(${imgSt.invert}%)`;
            ctx.filter = filterStr;

            // Apply gamma via globalAlpha trick (approximate)
            if (imgSt.gamma !== 100) {
                ctx.globalAlpha = imgSt.gamma > 100 ? 1 : imgSt.gamma / 100;
            } else {
                ctx.globalAlpha = 1;
            }

            // Clear and draw image
            ctx.clearRect(0, 0, cw, ch);

            // Temperature tint
            if (imgSt.temperature !== 0) {
                ctx.save();
                ctx.translate(cw / 2, ch / 2);
                if (totalRot) ctx.rotate(totalRot * Math.PI / 180);
                ctx.scale(imgSt.flipH, imgSt.flipV);
                ctx.drawImage(edImg, -edImg.width / 2, -edImg.height / 2);
                ctx.restore();

                // Apply temperature overlay
                ctx.globalCompositeOperation = 'overlay';
                ctx.globalAlpha = Math.abs(imgSt.temperature) / 200;
                ctx.fillStyle = imgSt.temperature > 0 ? '#ff8800' : '#0066ff';
                ctx.fillRect(0, 0, cw, ch);
                ctx.globalCompositeOperation = 'source-over';
                ctx.globalAlpha = 1;
            } else {
                ctx.save();
                ctx.translate(cw / 2, ch / 2);
                if (totalRot) ctx.rotate(totalRot * Math.PI / 180);
                ctx.scale(imgSt.flipH, imgSt.flipV);
                ctx.drawImage(edImg, -edImg.width / 2, -edImg.height / 2);
                ctx.restore();
            }

            ctx.filter = 'none';
            ctx.globalAlpha = 1;

            // Noise effect
            if (imgSt.noise > 0) {
                const imgData = ctx.getImageData(0, 0, cw, ch);
                const d = imgData.data;
                const intensity = imgSt.noise * 2.55;
                for (let i = 0; i < d.length; i += 4) {
                    const n = (Math.random() - 0.5) * intensity;
                    d[i] += n; d[i + 1] += n; d[i + 2] += n;
                }
                ctx.putImageData(imgData, 0, 0);
            }

            // Vignette
            if (imgSt.vignette > 0) {
                const grad = ctx.createRadialGradient(cw / 2, ch / 2, cw * 0.3, cw / 2, ch / 2, cw * 0.7);
                grad.addColorStop(0, 'transparent');
                grad.addColorStop(1, `rgba(0,0,0,${imgSt.vignette / 100})`);
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, cw, ch);
            }

            // Sharpen (approximate unsharp mask)
            if (imgSt.sharpen > 0) {
                try {
                    const imgData = ctx.getImageData(0, 0, cw, ch);
                    const src = new Uint8ClampedArray(imgData.data);
                    const d = imgData.data;
                    const amt = imgSt.sharpen / 50;
                    for (let y = 1; y < ch - 1; y++) {
                        for (let x = 1; x < cw - 1; x++) {
                            const idx = (y * cw + x) * 4;
                            for (let c = 0; c < 3; c++) {
                                const val = 5 * src[idx + c] -
                                    src[((y - 1) * cw + x) * 4 + c] -
                                    src[((y + 1) * cw + x) * 4 + c] -
                                    src[(y * cw + x - 1) * 4 + c] -
                                    src[(y * cw + x + 1) * 4 + c];
                                d[idx + c] = Math.min(255, Math.max(0, src[idx + c] + (val - src[idx + c]) * amt));
                            }
                        }
                    }
                    ctx.putImageData(imgData, 0, 0);
                } catch(e) {}
            }

            // Draw text layer
            textLayer.forEach(t => {
                ctx.font = `${t.bold ? 'bold ' : ''}${t.size}px ${t.font}`;
                ctx.fillStyle = t.color;
                ctx.globalAlpha = (t.alpha !== undefined ? t.alpha : 1);
                ctx.fillText(t.text, t.x, t.y);
            });

            // Draw shape layer (stored as image data on drawLayer)
            if (drawLayer) {
                ctx.drawImage(drawLayer, 0, 0);
            }

            // Update zoom label
            document.getElementById('img-zoom-label').textContent = Math.round(imgZoom * 100) + '%';

            // Update resize inputs
            document.getElementById('img-resize-w').value = edImg.width;
            document.getElementById('img-resize-h').value = edImg.height;
        }

        // --- History (Undo/Redo) ---
        function saveHistory() {
            if (!edImg) return;
            // Remove future states if we're in the middle of history
            imgHistory = imgHistory.slice(0, imgHistoryIdx + 1);
            // Save state as dataURL
            const tempCvs = document.createElement('canvas');
            tempCvs.width = edImg.width; tempCvs.height = edImg.height;
            const tCtx = tempCvs.getContext('2d');
            tCtx.drawImage(edImg, 0, 0);
            imgHistory.push({
                dataUrl: tempCvs.toDataURL(),
                filters: JSON.parse(JSON.stringify(imgSt)),
                textLayer: JSON.parse(JSON.stringify(textLayer)),
                drawLayer: drawLayer ? drawLayer.toDataURL() : null
            });
            if (imgHistory.length > MAX_HISTORY) imgHistory.shift();
            imgHistoryIdx = imgHistory.length - 1;
        }

        function imgUndo() {
            playClick();
            if (imgHistoryIdx <= 0) return;
            imgHistoryIdx--;
            restoreHistory(imgHistoryIdx);
        }

        function imgRedo() {
            playClick();
            if (imgHistoryIdx >= imgHistory.length - 1) return;
            imgHistoryIdx++;
            restoreHistory(imgHistoryIdx);
        }

        function restoreHistory(idx) {
            const state = imgHistory[idx];
            if (!state) return;
            const i = new Image();
            i.onload = () => {
                edImg = i;
                imgSt = JSON.parse(JSON.stringify(state.filters));
                textLayer = JSON.parse(JSON.stringify(state.textLayer));
                // Reset sliders
                Object.keys(imgSt).forEach(k => {
                    const sl = document.getElementById('slider-' + k);
                    if (sl) sl.value = imgSt[k];
                    const vl = document.getElementById('val-' + k);
                    if (vl) vl.textContent = imgSt[k] + (filterUnits[k] || '');
                });
                // Restore draw layer
                drawLayer = null; drawCtx = null;
                if (state.drawLayer) {
                    const dl = new Image();
                    dl.onload = () => {
                        if (!drawLayer) {
                            drawLayer = document.createElement('canvas');
                            drawLayer.width = cvs.width; drawLayer.height = cvs.height;
                            drawCtx = drawLayer.getContext('2d');
                        }
                        drawCtx.drawImage(dl, 0, 0);
                        renderImgFinal();
                    };
                    dl.src = state.drawLayer;
                } else {
                    renderImgFinal();
                }
            };
            i.src = state.dataUrl;
        }

        // --- Drawing (Freehand) ---
        function initDrawLayer() {
            if (!edImg) return;
            if (!drawLayer || drawLayer.width !== cvs.width || drawLayer.height !== cvs.height) {
                drawLayer = document.createElement('canvas');
                drawLayer.width = cvs.width; drawLayer.height = cvs.height;
                drawCtx = drawLayer.getContext('2d');
            }
        }

        function getCanvasCoords(e) {
            const rect = cvs.getBoundingClientRect();
            const scaleX = cvs.width / rect.width;
            const scaleY = cvs.height / rect.height;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return {
                x: (clientX - rect.left) * scaleX,
                y: (clientY - rect.top) * scaleY
            };
        }

        function startDraw(e) {
            if (!edImg) return;
            if (imgTool === 'draw' || imgTool === 'eraser') {
                isDrawing = true;
                initDrawLayer();
                const coords = getCanvasCoords(e);
                lastX = coords.x; lastY = coords.y;
                drawCtx.beginPath();
                drawCtx.moveTo(lastX, lastY);
                drawCtx.globalAlpha = imgOpacity / 100;
                if (imgTool === 'eraser') {
                    drawCtx.globalCompositeOperation = 'destination-out';
                    drawCtx.lineWidth = parseInt(document.getElementById('img-brush-size').value) * 2;
                } else {
                    drawCtx.globalCompositeOperation = 'source-over';
                    drawCtx.strokeStyle = document.getElementById('img-draw-color').value;
                    drawCtx.lineWidth = parseInt(document.getElementById('img-brush-size').value);
                }
                drawCtx.lineCap = 'round';
                drawCtx.lineJoin = 'round';
                e.preventDefault();
            } else if (imgTool === 'text') {
                const coords = getCanvasCoords(e);
                const textInput = document.getElementById('img-text-input');
                const text = (textInput ? textInput.value : '').trim();
                if (!text) { textInput && textInput.focus(); return; }
                const font = document.getElementById('img-text-font').value;
                const size = parseInt(document.getElementById('img-text-size').value) || 24;
                const bold = document.getElementById('img-text-bold').checked;
                const color = document.getElementById('img-draw-color').value;
                textLayer.push({ text, x: coords.x, y: coords.y, font, size, bold, color, alpha: imgOpacity / 100 });
                if (textInput) textInput.value = '';
                renderImgFinal();
                saveHistory();
            } else if (imgTool === 'shape') {
                const coords = getCanvasCoords(e);
                initDrawLayer();
                isDrawing = true;
                cropDragStart = { x: coords.x, y: coords.y };
                e.preventDefault();
            } else if (imgTool === 'fill') {
                const coords = getCanvasCoords(e);
                floodFill(Math.round(coords.x), Math.round(coords.y));
                e.preventDefault();
            } else if (imgTool === 'eyedropper') {
                const coords = getCanvasCoords(e);
                try {
                    const pixel = ctx.getImageData(Math.round(coords.x), Math.round(coords.y), 1, 1).data;
                    const hex = '#' + [pixel[0], pixel[1], pixel[2]].map(c => c.toString(16).padStart(2, '0')).join('');
                    document.getElementById('img-draw-color').value = hex;
                    navigator.clipboard.writeText(hex).catch(() => {});
                } catch(e) {}
            }
        }

        function moveDraw(e) {
            if (!isDrawing) return;
            if (imgTool === 'draw' || imgTool === 'eraser') {
                const coords = getCanvasCoords(e);
                drawCtx.lineTo(coords.x, coords.y);
                drawCtx.stroke();
                renderImgFinal();
                e.preventDefault();
            } else if (imgTool === 'shape') {
                // Live preview on overlay
                const coords = getCanvasCoords(e);
                oCtx.clearRect(0, 0, ovs.width, ovs.height);
                oCtx.globalAlpha = imgOpacity / 100;
                oCtx.strokeStyle = document.getElementById('img-draw-color').value;
                oCtx.lineWidth = parseInt(document.getElementById('img-brush-size').value);
                oCtx.lineCap = 'round';
                const shapeType = document.getElementById('img-shape-type').value;
                const fill = document.getElementById('img-shape-fill').checked;
                drawShape(oCtx, shapeType, cropDragStart.x, cropDragStart.y, coords.x, coords.y, fill);
                oCtx.globalAlpha = 1;
                e.preventDefault();
            }
        }

        function endDraw(e) {
            if (!isDrawing) return;
            isDrawing = false;
            if (imgTool === 'shape') {
                // Commit shape to draw layer
                const coords = getCanvasCoords(e) || cropDragStart;
                initDrawLayer();
                const shapeType = document.getElementById('img-shape-type').value;
                const fill = document.getElementById('img-shape-fill').checked;
                drawCtx.globalAlpha = imgOpacity / 100;
                drawCtx.strokeStyle = document.getElementById('img-draw-color').value;
                drawCtx.lineWidth = parseInt(document.getElementById('img-brush-size').value);
                drawCtx.lineCap = 'round';
                drawShape(drawCtx, shapeType, cropDragStart.x, cropDragStart.y, coords.x || cropDragStart.x, coords.y || cropDragStart.y, fill);
                drawCtx.globalAlpha = 1;
                oCtx.clearRect(0, 0, ovs.width, ovs.height);
                renderImgFinal();
                saveHistory();
            } else if (imgTool === 'draw' || imgTool === 'eraser') {
                saveHistory();
            }
        }

        function hexToRgba(hex, alpha) {
            let h = hex.replace('#', '');
            if (h.length === 3) h = h.split('').map(c => c + c).join('');
            const r = parseInt(h.substring(0, 2), 16);
            const g = parseInt(h.substring(2, 4), 16);
            const b = parseInt(h.substring(4, 6), 16);
            return [r, g, b, Math.round(alpha * 255)];
        }

        function sameColor(a, b, tol) {
            tol = tol || 6;
            return Math.abs(a[0]-b[0]) <= tol && Math.abs(a[1]-b[1]) <= tol &&
                   Math.abs(a[2]-b[2]) <= tol && Math.abs(a[3]-b[3]) <= tol;
        }

        // Bucket fill: fills a contiguous color region on the visible image
        function floodFill(sx, sy) {
            if (!edImg) return;
            initDrawLayer();
            const w = cvs.width, h = cvs.height;
            if (sx < 0 || sy < 0 || sx >= w || sy >= h) return;
            let srcData;
            try { srcData = ctx.getImageData(0, 0, w, h).data; }
            catch(e) { return; }
            const base = (sy * w + sx) * 4;
            const target = [srcData[base], srcData[base+1], srcData[base+2], srcData[base+3]];
            const fillColor = hexToRgba(document.getElementById('img-draw-color').value, imgOpacity / 100);
            if (sameColor(target, fillColor)) return;

            const drawImg = drawCtx.getImageData(0, 0, w, h);
            const d = drawImg.data;
            const tolerance = 32;
            const stack = [[sx, sy]];
            let count = 0;
            const maxPixels = w * h;
            while (stack.length && count < maxPixels) {
                const [px, py] = stack.pop();
                const idx = (py * w + px) * 4;
                if (!sameColor([srcData[idx], srcData[idx+1], srcData[idx+2], srcData[idx+3]], target, tolerance)) continue;
                d[idx] = fillColor[0]; d[idx+1] = fillColor[1]; d[idx+2] = fillColor[2]; d[idx+3] = fillColor[3];
                count++;
                if (px > 0) stack.push([px-1, py]);
                if (px < w-1) stack.push([px+1, py]);
                if (py > 0) stack.push([px, py-1]);
                if (py < h-1) stack.push([px, py+1]);
            }
            drawCtx.putImageData(drawImg, 0, 0);
            renderImgFinal();
            saveHistory();
        }

        function drawShape(context, type, x1, y1, x2, y2, fill) {
            context.beginPath();
            if (fill) context.fillStyle = context.strokeStyle;
            switch (type) {
                case 'rect':
                    context.rect(x1, y1, x2 - x1, y2 - y1);
                    break;
                case 'circle':
                    const rx = Math.abs(x2 - x1) / 2, ry = Math.abs(y2 - y1) / 2;
                    const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
                    context.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
                    break;
                case 'line':
                    context.moveTo(x1, y1); context.lineTo(x2, y2);
                    break;
                case 'arrow':
                    const angle = Math.atan2(y2 - y1, x2 - x1);
                    context.moveTo(x1, y1); context.lineTo(x2, y2);
                    const headLen = 15;
                    context.moveTo(x2, y2);
                    context.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
                    context.moveTo(x2, y2);
                    context.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
                    break;
                case 'star':
                    const spikes = 5, outerR = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) / 2;
                    const innerR = outerR * 0.4;
                    const scx = (x1 + x2) / 2, scy = (y1 + y2) / 2;
                    for (let i = 0; i < spikes * 2; i++) {
                        const r = i % 2 === 0 ? outerR : innerR;
                        const a = (i * Math.PI / spikes) - Math.PI / 2;
                        if (i === 0) context.moveTo(scx + r * Math.cos(a), scy + r * Math.sin(a));
                        else context.lineTo(scx + r * Math.cos(a), scy + r * Math.sin(a));
                    }
                    context.closePath();
                    break;
            }
            context.stroke();
            if (fill) context.fill();
        }

        // Canvas events for drawing
        cvs.addEventListener('mousedown', startDraw);
        cvs.addEventListener('mousemove', moveDraw);
        cvs.addEventListener('mouseup', endDraw);
        cvs.addEventListener('mouseleave', endDraw);
        cvs.addEventListener('touchstart', startDraw, { passive: false });
        cvs.addEventListener('touchmove', moveDraw, { passive: false });
        cvs.addEventListener('touchend', endDraw);

        // Brush size display
        document.getElementById('img-brush-size').addEventListener('input', function() {
            document.getElementById('img-brush-val').textContent = this.value;
        });

        // --- Crop Tool ---
        function startCrop() {
            if (!edImg) return;
            cropActive = true;
            ovs.style.pointerEvents = 'auto';
            // Default crop: full image
            cropRect = { x: 0, y: 0, w: cvs.width, h: cvs.height };
            drawCropOverlay();
        }

        function cancelCrop() {
            cropActive = false;
            oCtx.clearRect(0, 0, ovs.width, ovs.height);
            ovs.style.pointerEvents = 'none';
            document.getElementById('btn-crop-apply').style.display = 'none';
            document.getElementById('btn-crop-cancel').style.display = 'none';
        }

        function drawCropOverlay() {
            if (!cropActive) return;
            oCtx.clearRect(0, 0, ovs.width, ovs.height);
            const { x, y, w, h } = cropRect;
            // Dark mask
            oCtx.fillStyle = 'rgba(0,0,0,0.5)';
            oCtx.fillRect(0, 0, ovs.width, ovs.height);
            // Clear crop area
            oCtx.clearRect(x, y, w, h);
            // Crop border
            oCtx.strokeStyle = '#fff';
            oCtx.lineWidth = 2;
            oCtx.setLineDash([6, 3]);
            oCtx.strokeRect(x, y, w, h);
            oCtx.setLineDash([]);
            // Rule of thirds
            oCtx.strokeStyle = 'rgba(255,255,255,0.3)';
            oCtx.lineWidth = 1;
            for (let i = 1; i <= 2; i++) {
                oCtx.beginPath();
                oCtx.moveTo(x + w * i / 3, y);
                oCtx.lineTo(x + w * i / 3, y + h);
                oCtx.stroke();
                oCtx.beginPath();
                oCtx.moveTo(x, y + h * i / 3);
                oCtx.lineTo(x + w, y + h * i / 3);
                oCtx.stroke();
            }
            // Corner handles
            const hs = 10;
            oCtx.fillStyle = '#3b82f6';
            [[x, y], [x + w, y], [x, y + h], [x + w, y + h]].forEach(([hx, hy]) => {
                oCtx.fillRect(hx - hs / 2, hy - hs / 2, hs, hs);
            });
            // Edge handles
            oCtx.fillStyle = '#fff';
            [[x + w / 2, y], [x + w / 2, y + h], [x, y + h / 2], [x + w, y + h / 2]].forEach(([hx, hy]) => {
                oCtx.fillRect(hx - 4, hy - 4, 8, 8);
            });
            // Info text
            oCtx.fillStyle = 'rgba(0,0,0,0.7)';
            oCtx.fillRect(x, y - 24, 140, 20);
            oCtx.fillStyle = '#fff';
            oCtx.font = '11px monospace';
            oCtx.fillText(`${Math.round(w)} Ã— ${Math.round(h)} px`, x + 6, y - 8);
        }

        // Crop interaction
        function getCropHandle(mx, my) {
            const { x, y, w, h } = cropRect;
            const hs = 12;
            if (Math.abs(mx - x) < hs && Math.abs(my - y) < hs) return 'tl';
            if (Math.abs(mx - (x + w)) < hs && Math.abs(my - y) < hs) return 'tr';
            if (Math.abs(mx - x) < hs && Math.abs(my - (y + h)) < hs) return 'bl';
            if (Math.abs(mx - (x + w)) < hs && Math.abs(my - (y + h)) < hs) return 'br';
            if (mx > x && mx < x + w && my > y - 10 && my < y + 10) return 'top';
            if (mx > x && mx < x + w && my > y + h - 10 && my < y + h + 10) return 'bottom';
            if (mx > x - 10 && mx < x + 10 && my > y && my < y + h) return 'left';
            if (mx > x + w - 10 && mx < x + w + 10 && my > y && my < y + h) return 'right';
            if (mx > x && mx < x + w && my > y && my < y + h) return 'move';
            return null;
        }

        function onCropMouseDown(e) {
            if (!cropActive) return;
            const coords = getCanvasCoords(e);
            cropHandle = getCropHandle(coords.x, coords.y);
            if (cropHandle) {
                cropDragging = true;
                cropDragStart = { x: coords.x, y: coords.y };
                e.preventDefault();
            }
        }

        function onCropMouseMove(e) {
            if (!cropActive || !cropDragging) return;
            const coords = getCanvasCoords(e);
            const dx = coords.x - cropDragStart.x;
            const dy = coords.y - cropDragStart.y;
            cropDragStart = { x: coords.x, y: coords.y };
            const { x, y, w, h } = cropRect;
            switch (cropHandle) {
                case 'move':
                    cropRect.x = Math.max(0, Math.min(cvs.width - w, x + dx));
                    cropRect.y = Math.max(0, Math.min(cvs.height - h, y + dy));
                    break;
                case 'tl':
                    cropRect.x = Math.max(0, x + dx); cropRect.y = Math.max(0, y + dy);
                    cropRect.w = w - dx; cropRect.h = h - dy;
                    break;
                case 'tr':
                    cropRect.y = Math.max(0, y + dy);
                    cropRect.w = w + dx; cropRect.h = h - dy;
                    break;
                case 'bl':
                    cropRect.x = Math.max(0, x + dx);
                    cropRect.w = w - dx; cropRect.h = h + dy;
                    break;
                case 'br':
                    cropRect.w = w + dx; cropRect.h = h + dy;
                    break;
                case 'top':
                    cropRect.y = Math.max(0, y + dy); cropRect.h = h - dy;
                    break;
                case 'bottom':
                    cropRect.h = h + dy;
                    break;
                case 'left':
                    cropRect.x = Math.max(0, x + dx); cropRect.w = w - dx;
                    break;
                case 'right':
                    cropRect.w = w + dx;
                    break;
            }
            // Ensure minimum size
            if (cropRect.w < 20) cropRect.w = 20;
            if (cropRect.h < 20) cropRect.h = 20;
            // Enforce aspect ratio if set
            if (cropAspect && cropAspect !== 'free' && cropHandle && cropHandle !== 'move') {
                const ratio = cropAspect.split(':').map(Number);
                const target = ratio[0] / ratio[1];
                let nw = cropRect.w, nh = cropRect.h;
                if (nw / nh > target) nw = nh * target; else nh = nw / target;
                // Keep anchor based on handle
                const r = cropRect;
                if (cropHandle.includes('l')) r.x = r.x + (r.w - nw);
                if (cropHandle.includes('t')) r.y = r.y + (r.h - nh);
                r.w = nw; r.h = nh;
                // Clamp to canvas bounds
                if (r.x < 0) { r.w += r.x; r.x = 0; }
                if (r.y < 0) { r.h += r.y; r.y = 0; }
                if (r.x + r.w > cvs.width) r.w = cvs.width - r.x;
                if (r.y + r.h > cvs.height) r.h = cvs.height - r.y;
            }
            drawCropOverlay();
        }

        function onCropMouseUp(e) {
            if (!cropDragging) return;
            cropDragging = false;
            cropHandle = null;
        }

        ovs.addEventListener('mousedown', e => { if (cropActive) onCropMouseDown(e); });
        ovs.addEventListener('mousemove', e => { if (cropActive) onCropMouseMove(e); });
        ovs.addEventListener('mouseup', e => { if (cropActive) onCropMouseUp(e); });
        ovs.addEventListener('touchstart', e => { if (cropActive) { onCropMouseDown(e); e.preventDefault(); } }, { passive: false });
        ovs.addEventListener('touchmove', e => { if (cropActive) { onCropMouseMove(e); e.preventDefault(); } }, { passive: false });
        ovs.addEventListener('touchend', e => { if (cropActive) onCropMouseUp(e); });

        // Apply crop (double-click or button)
        function applyCrop() {
            if (!cropActive || !edImg) return;
            playClick();
            const { x, y, w, h } = cropRect;
            const tempCvs = document.createElement('canvas');
            tempCvs.width = w; tempCvs.height = h;
            const tCtx = tempCvs.getContext('2d');
            // Draw the current rendered image from main canvas
            tCtx.drawImage(cvs, x, y, w, h, 0, 0, w, h);
            const newImg = new Image();
            newImg.onload = () => {
                edImg = newImg;
                drawLayer = null;
                textLayer = [];
                cancelCrop();
                document.getElementById('slider-freeRotate').value = 0;
                document.getElementById('val-freeRotate').textContent = '0Â°';
                renderImgFinal();
                saveHistory();
                setImgTool('select');
            };
            newImg.src = tempCvs.toDataURL();
        }

        // Double-click on crop overlay to apply
        ovs.addEventListener('dblclick', () => { if (cropActive) applyCrop(); });

        // Expose applyCrop to window so we can add a button later
        window.applyCrop = applyCrop;

        // --- Zoom ---
        function imgZoomIn() {
            playClick();
            imgZoom = Math.min(5, imgZoom * 1.25);
            renderImgFinal();
        }
        function imgZoomOut() {
            playClick();
            imgZoom = Math.max(0.1, imgZoom / 1.25);
            renderImgFinal();
        }
        function imgFitToView() {
            playClick();
            if (!edImg) return;
            const container = document.getElementById('img-preview-container');
            const maxW = container.clientWidth - 40;
            const maxH = container.clientHeight - 40;
            const scale = Math.min(maxW / edImg.width, maxH / edImg.height, 1);
            imgZoom = scale;
            renderImgFinal();
        }

        // Compare before/after (hold button to see original)
        let imgCompareSaved = null;
        function imgCompareDown() {
            if (!edImg || imgCompareSaved) return;
            imgCompareSaved = JSON.parse(JSON.stringify(imgSt));
            imgSt = JSON.parse(JSON.stringify(NEUTRAL_IMG_ST));
            // Sync sliders to neutral
            Object.keys(imgSt).forEach(k => {
                const sl = document.getElementById('slider-' + k);
                if (sl) sl.value = imgSt[k];
                const vl = document.getElementById('val-' + k);
                if (vl) vl.textContent = imgSt[k] + (filterUnits[k] || '');
            });
            document.getElementById('img-compare').classList.add('active-tool');
            renderImgFinal();
        }
        function imgCompareUp() {
            if (!imgCompareSaved) return;
            imgSt = imgCompareSaved;
            imgCompareSaved = null;
            Object.keys(imgSt).forEach(k => {
                const sl = document.getElementById('slider-' + k);
                if (sl) sl.value = imgSt[k];
                const vl = document.getElementById('val-' + k);
                if (vl) vl.textContent = imgSt[k] + (filterUnits[k] || '');
            });
            document.getElementById('img-compare').classList.remove('active-tool');
            renderImgFinal();
        }

        // --- Reset ---
        function resetImgEditor() {
            playClick();
            imgSt = {
                brightness: 100, contrast: 100, saturation: 100, exposure: 0, temperature: 0,
                sharpen: 0, vignette: 0, noise: 0, gamma: 100,
                grayscale: 0, sepia: 0, blur: 0, hue: 0, invert: 0,
                rotate: 0, flipH: 1, flipV: 1, freeRotate: 0
            };
            drawLayer = null;
            textLayer = [];
            imgZoom = 1;
            if (cropActive) cancelCrop();
            Object.keys(imgSt).forEach(k => {
                const sl = document.getElementById('slider-' + k);
                if (sl) sl.value = imgSt[k];
                const vl = document.getElementById('val-' + k);
                if (vl) vl.textContent = imgSt[k] + (filterUnits[k] || '');
            });
            renderImgFinal();
        }

        // Remove the last added text annotation
        function imgRemoveText() {
            if (!textLayer.length) return;
            textLayer.pop();
            playClick();
            renderImgFinal();
            saveHistory();
        }

        function setCropAspect(val) {
            cropAspect = val;
            document.querySelectorAll('#crop-options .crop-aspect-btn').forEach(b => {
                b.classList.toggle('active-aspect', b.getAttribute('data-aspect') === val);
            });
            if (cropActive) {
                // Re-apply aspect to current crop rect
                if (val !== 'free') {
                    const ratio = val.split(':').map(Number);
                    const target = ratio[0] / ratio[1];
                    if (cropRect.w / cropRect.h > target) cropRect.h = cropRect.w / target;
                    else cropRect.w = cropRect.h * target;
                    drawCropOverlay();
                }
            }
        }

        // --- Export ---
        function openExportModal() {
            if (!edImg) return;
            playClick();
            const m = document.getElementById('img-export-modal');
            if (m) m.classList.remove('hidden');
            // Update quality slider visibility based on format
            updateExportQualityVis();
        }

        function closeExportModal() {
            const m = document.getElementById('img-export-modal');
            if (m) m.classList.add('hidden');
        }

        function updateExportQualityVis() {
            const fmt = document.getElementById('img-export-format').value;
            const qRow = document.getElementById('img-export-quality-row');
            if (qRow) qRow.style.display = (fmt === 'png') ? 'none' : 'block';
        }

        // Render the final image to a canvas at the given scale (1x / 2x)
        function renderExportCanvas(scale) {
            const exportCvs = document.createElement('canvas');
            const freeRot = parseInt(document.getElementById('slider-freeRotate')?.value || 0);
            const totalRot = (imgSt.rotate + freeRot) % 360;
            const swapped = totalRot % 180 !== 0;
            const bw = swapped ? edImg.height : edImg.width;
            const bh = swapped ? edImg.width : edImg.height;
            exportCvs.width = Math.round(bw * scale);
            exportCvs.height = Math.round(bh * scale);
            const eCtx = exportCvs.getContext('2d');

            // Apply filters
            const brightness = imgSt.brightness * (1 + imgSt.exposure / 200);
            eCtx.filter = `brightness(${brightness}%) contrast(${imgSt.contrast}%) saturate(${imgSt.saturation}%) grayscale(${imgSt.grayscale}%) sepia(${imgSt.sepia}%) blur(${imgSt.blur}px) hue-rotate(${imgSt.hue}deg) invert(${imgSt.invert}%)`;

            eCtx.save();
            eCtx.translate(exportCvs.width / 2, exportCvs.height / 2);
            if (totalRot) eCtx.rotate(totalRot * Math.PI / 180);
            eCtx.scale(imgSt.flipH, imgSt.flipV);
            eCtx.scale(scale, scale);
            eCtx.drawImage(edImg, -edImg.width / 2, -edImg.height / 2);
            eCtx.restore();
            eCtx.filter = 'none';

            // Temperature
            if (imgSt.temperature !== 0) {
                eCtx.globalCompositeOperation = 'overlay';
                eCtx.globalAlpha = Math.abs(imgSt.temperature) / 200;
                eCtx.fillStyle = imgSt.temperature > 0 ? '#ff8800' : '#0066ff';
                eCtx.fillRect(0, 0, exportCvs.width, exportCvs.height);
                eCtx.globalCompositeOperation = 'source-over';
                eCtx.globalAlpha = 1;
            }

            // Vignette
            if (imgSt.vignette > 0) {
                const grad = eCtx.createRadialGradient(exportCvs.width / 2, exportCvs.height / 2, exportCvs.width * 0.3, exportCvs.width / 2, exportCvs.height / 2, exportCvs.width * 0.7);
                grad.addColorStop(0, 'transparent');
                grad.addColorStop(1, `rgba(0,0,0,${imgSt.vignette / 100})`);
                eCtx.fillStyle = grad;
                eCtx.fillRect(0, 0, exportCvs.width, exportCvs.height);
            }

            // Noise
            if (imgSt.noise > 0) {
                const imgData = eCtx.getImageData(0, 0, exportCvs.width, exportCvs.height);
                const d = imgData.data;
                const intensity = imgSt.noise * 2.55;
                for (let i = 0; i < d.length; i += 4) {
                    const n = (Math.random() - 0.5) * intensity;
                    d[i] += n; d[i + 1] += n; d[i + 2] += n;
                }
                eCtx.putImageData(imgData, 0, 0);
            }

            // Sharpen (relative to scale)
            if (imgSt.sharpen > 0) {
                try {
                    const imgData = eCtx.getImageData(0, 0, exportCvs.width, exportCvs.height);
                    const src = new Uint8ClampedArray(imgData.data);
                    const d = imgData.data;
                    const amt = imgSt.sharpen / 50;
                    const w = exportCvs.width, h = exportCvs.height;
                    for (let y = 1; y < h - 1; y++) {
                        for (let x = 1; x < w - 1; x++) {
                            const idx = (y * w + x) * 4;
                            for (let c = 0; c < 3; c++) {
                                const val = 5 * src[idx + c] -
                                    src[((y - 1) * w + x) * 4 + c] -
                                    src[((y + 1) * w + x) * 4 + c] -
                                    src[(y * w + x - 1) * 4 + c] -
                                    src[(y * w + x + 1) * 4 + c];
                                d[idx + c] = Math.min(255, Math.max(0, src[idx + c] + (val - src[idx + c]) * amt));
                            }
                        }
                    }
                    eCtx.putImageData(imgData, 0, 0);
                } catch(e) {}
            }

            // Draw draw layer (scale it up onto the export canvas)
            if (drawLayer) {
                eCtx.save();
                eCtx.scale(scale, scale);
                eCtx.drawImage(drawLayer, 0, 0);
                eCtx.restore();
            }

            // Draw text
            textLayer.forEach(t => {
                eCtx.font = `${t.bold ? 'bold ' : ''}${t.size * scale}px ${t.font}`;
                eCtx.fillStyle = t.color;
                eCtx.globalAlpha = (t.alpha !== undefined ? t.alpha : 1);
                eCtx.fillText(t.text, t.x * scale, t.y * scale);
            });
            eCtx.globalAlpha = 1;

            return exportCvs;
        }

        function downloadExport() {
            if (!edImg) return;
            playClick();
            try {
                const fmt = document.getElementById('img-export-format').value;
                const scale = parseFloat(document.getElementById('img-export-scale').value) || 1;
                const quality = parseInt(document.getElementById('img-export-quality').value) / 100 || 1;
                const cvs = renderExportCanvas(scale);
                const mime = { png: 'image/png', jpeg: 'image/jpeg', webp: 'image/webp' }[fmt];
                const ext = fmt === 'jpeg' ? 'jpg' : fmt;
                cvs.toBlob(blob => {
                    if (!blob) { alert("No se pudo exportar. Intenta de nuevo."); return; }
                    const blobUrl = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.download = 'EC_Studio_Pro.' + ext;
                    a.href = blobUrl;
                    document.body.appendChild(a);
                    a.click();
                    setTimeout(() => {
                        window.URL.revokeObjectURL(blobUrl);
                        document.body.removeChild(a);
                    }, 100);
                }, mime, fmt === 'png' ? undefined : quality);
            } catch (e) {
                alert("No se pudo exportar. Intenta de nuevo.");
            }
        }

        // --- Keyboard shortcuts ---
        document.addEventListener('keydown', e => {
            if (document.getElementById('window-img-editor').style.display !== 'flex') return;
            const tag = (e.target && e.target.tagName) || '';
            const inField = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable;
            if (e.ctrlKey && e.key === 'z') { e.preventDefault(); imgUndo(); }
            if (e.ctrlKey && e.key === 'y') { e.preventDefault(); imgRedo(); }
            if (e.key === 'Escape' && cropActive) cancelCrop();
            if (e.key === 'Enter' && cropActive) applyCrop();
            if (e.key === '+' || e.key === '=') { if (e.ctrlKey) { e.preventDefault(); imgZoomIn(); } }
            if (e.key === '-') { if (e.ctrlKey) { e.preventDefault(); imgZoomOut(); } }
            // Tool switching (ignore when typing)
            if (inField) return;
            const k = e.key.toLowerCase();
            if (k === 'b') setImgTool('draw');
            else if (k === 'e') setImgTool('eraser');
            else if (k === 't') setImgTool('text');
            else if (k === 's') setImgTool('shape');
            else if (k === 'c') setImgTool('crop');
            else if (k === 'i') setImgTool('eyedropper');
            else if (k === 'f') setImgTool('fill');
            else if (k === 'v') setImgTool('select');
            else if (k === '0') imgFitToView();
        });

        // Mouse wheel zoom on canvas
        document.getElementById('img-preview-container').addEventListener('wheel', e => {
            if (document.getElementById('window-img-editor').style.display !== 'flex') return;
            e.preventDefault();
            if (e.deltaY < 0) imgZoomIn(); else imgZoomOut();
        }, { passive: false });

        // Initial render placeholder
        renderImgFinal();

