        // --- 0. Sistema de Sonido PRO y Modo Oscuro Global ---
        let soundEnabled = true;
        let audioCtx = null;
        
        function getAudioCtx() {
            if (!audioCtx) {
                const AC = window.AudioContext || window.webkitAudioContext;
                audioCtx = new AC();
            }
            if (audioCtx.state === 'suspended') audioCtx.resume();
            return audioCtx;
        }

        function playClick() {
            if(!soundEnabled) return;
            try {
                const ctx = getAudioCtx();
                const t = ctx.currentTime;
                // Soft, modern UI tap â€” layered sine + noise for depth
                const osc = ctx.createOscillator();
                const osc2 = ctx.createOscillator();
                const gain = ctx.createGain();
                const filter = ctx.createBiquadFilter();
                
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(2500, t);
                filter.frequency.exponentialRampToValueAtTime(800, t + 0.06);
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(1200, t);
                osc.frequency.exponentialRampToValueAtTime(600, t + 0.07);
                
                osc2.type = 'triangle';
                osc2.frequency.setValueAtTime(900, t);
                osc2.frequency.exponentialRampToValueAtTime(400, t + 0.06);
                
                gain.gain.setValueAtTime(0.12, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
                
                osc.connect(filter);
                osc2.connect(filter);
                filter.connect(gain);
                gain.connect(ctx.destination);
                
                osc.start(t);
                osc2.start(t);
                osc.stop(t + 0.08);
                osc2.stop(t + 0.08);
            } catch(e) {}
        }

        function playOpen() {
            if(!soundEnabled) return;
            try {
                const ctx = getAudioCtx();
                const t = ctx.currentTime;
                // Smooth ascending whoosh for window open
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const filter = ctx.createBiquadFilter();
                
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(1500, t);
                filter.frequency.exponentialRampToValueAtTime(4000, t + 0.12);
                filter.frequency.exponentialRampToValueAtTime(1000, t + 0.2);
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(300, t);
                osc.frequency.exponentialRampToValueAtTime(800, t + 0.12);
                osc.frequency.exponentialRampToValueAtTime(500, t + 0.2);
                
                gain.gain.setValueAtTime(0.08, t);
                gain.gain.linearRampToValueAtTime(0.14, t + 0.08);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
                
                osc.connect(filter);
                filter.connect(gain);
                gain.connect(ctx.destination);
                
                osc.start(t);
                osc.stop(t + 0.22);
            } catch(e) {}
        }

        function playClose() {
            if(!soundEnabled) return;
            try {
                const ctx = getAudioCtx();
                const t = ctx.currentTime;
                // Soft descending tone for window close
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(600, t);
                osc.frequency.exponentialRampToValueAtTime(200, t + 0.12);
                
                gain.gain.setValueAtTime(0.1, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
                
                osc.connect(gain);
                gain.connect(ctx.destination);
                
                osc.start(t);
                osc.stop(t + 0.12);
            } catch(e) {}
        }

        function playNotif() {
            if(!soundEnabled) return;
            try {
                const ctx = getAudioCtx();
                const t = ctx.currentTime;
                // Gentle two-tone chime for notifications
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, t);
                osc.frequency.setValueAtTime(1100, t + 0.1);
                
                gain.gain.setValueAtTime(0.1, t);
                gain.gain.linearRampToValueAtTime(0.12, t + 0.08);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
                
                osc.connect(gain);
                gain.connect(ctx.destination);
                
                osc.start(t);
                osc.stop(t + 0.35);
            } catch(e) {}
        }

        function toggleSound(enabled) {
            soundEnabled = enabled;
            if(soundEnabled) playClick();
            saveSettings();
        }

        function toggleDarkMode(enabled) {
            playClick();
            if (enabled) {
                document.body.classList.add('dark-theme');
            } else {
                document.body.classList.remove('dark-theme');
            }
            saveSettings();
        }

        // --- Almacenamiento Local (Settings) ---
        function saveSettings() {
            try {
                localStorage.setItem('ec_sound', soundEnabled);
                localStorage.setItem('ec_dark', document.body.classList.contains('dark-theme'));
                const bg = document.getElementById('desktop-bg');
                const bgVal = bg.style.background || bg.style.backgroundImage || 'none';
                localStorage.setItem('ec_wall', bgVal);
            } catch(e) { console.warn('LocalStorage bloqueado'); }
        }

        function loadSettings() {
            try {
                // Sonido
                const savedSound = localStorage.getItem('ec_sound');
                if (savedSound !== null) {
                    soundEnabled = savedSound === 'true';
                    document.getElementById('setting-sound').checked = soundEnabled;
                }
                
                // Dark mode
                const savedDark = localStorage.getItem('ec_dark');
                if (savedDark === 'true') {
                    document.body.classList.add('dark-theme');
                    document.getElementById('setting-dark-mode').checked = true;
                }
                
                // Fondo
                const savedWall = localStorage.getItem('ec_wall');
                if (savedWall && savedWall !== 'none') {
                    const bg = document.getElementById('desktop-bg');
                    if (savedWall.includes('linear-gradient')) {
                        bg.style.background = savedWall;
                    } else if (savedWall.includes('url(')) {
                        bg.style.background = savedWall;
                        bg.style.backgroundSize = 'cover';
                    }
                } else if (savedWall === 'none') {
                    document.getElementById('desktop-bg').style.background = 'transparent';
                }
            } catch(e) { console.warn('LocalStorage bloqueado'); }
        }

        // --- 1. LÃ³gica de Pantalla de Carga y BETA ---
        window.addEventListener('load', () => {
            loadSettings();
            const loader = document.getElementById('loading-screen');
            const bar = document.getElementById('loading-bar');
            const status = document.getElementById('load-status');
            const msgs = [
                [10, 'Preparando sistema...'],
                [25, 'Cargando nÃºcleo EC...'],
                [40, 'Inicializando subsistemas...'],
                [55, 'Cargando interfaz...'],
                [70, 'Configurando aplicaciones...'],
                [85, 'Aplicando preferencias...'],
                [95, 'Casi listo...'],
            ];
            let progress = 0;
            let msgIdx = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 2.5 + 0.5;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(interval);
                    status.textContent = 'Sistema listo';
                    bar.style.width = '100%';
                    setTimeout(() => {
                        loader.style.opacity = '0';
                        loader.style.transform = 'scale(1.05)';
                        setTimeout(() => {
                            loader.style.display = 'none';
                            showBetaModal();
                        }, 1000);
                    }, 500);
                } else {
                    bar.style.width = `${progress}%`;
                    if (msgIdx < msgs.length && progress >= msgs[msgIdx][0]) {
                        status.textContent = msgs[msgIdx][1];
                        msgIdx++;
                    }
                }
            }, 25);
        });

        function showBetaModal() {
            const toast = document.getElementById('beta-toast');
            toast.classList.remove('hidden');
            playNotif();
            setTimeout(() => { toast.classList.add('show'); }, 30);
            // Auto-dismiss after 6 seconds
            setTimeout(() => { closeBetaModal(); }, 6000);
        }

        function closeBetaModal() {
            const toast = document.getElementById('beta-toast');
            toast.classList.remove('show');
            setTimeout(() => { toast.classList.add('hidden'); }, 500);
        }

        // --- 2. LÃ³gica del Reloj iOS ---
        function updateClock() {
            const now = new Date();
            let h = now.getHours();
            let m = now.getMinutes().toString().padStart(2, '0');
            let ampm = h >= 12 ? 'PM' : 'AM';
            h = h % 12; h = h ? h : 12; // 0 debe ser 12
            document.getElementById('clock-ios').textContent = `${h}:${m} ${ampm}`;
        }
        setInterval(updateClock, 1000);
        updateClock();

        // --- Pantalla Completa ---
        function toggleFullScreen() {
            playClick();
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(err => { console.log(`Error: ${err.message}`); });
                document.getElementById('fs-icon').classList.replace('fa-expand', 'fa-compress');
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                    document.getElementById('fs-icon').classList.replace('fa-compress', 'fa-expand');
                }
            }
        }

        // --- Ajustes: Cambiar Fondo ---
        function changeWallpaper(url) {
            playClick();
            const bg = document.getElementById('desktop-bg');
            if(url === 'none') {
                bg.style.background = 'transparent'; 
            } else if(url.startsWith('linear-gradient')) {
                bg.style.background = url;
            } else {
                bg.style.background = `url('${url}') no-repeat center center`;
                bg.style.backgroundSize = 'cover';
            }
            saveSettings();
        }

        // --- 3. Sistema de Ventanas (Touch/Mouse) ---
        let zIndexCounter = 100;
        const minimizedWindows = {};
        const animatingWindows = {};
        function getDockIcon(id) {
            const badge = document.querySelector(`[data-badge="${id}"]`);
            return badge ? badge.closest('.group')?.querySelector('.ios-icon') : null;
        }
        function bounceDockIcon(id) {
            const icon = getDockIcon(id);
            if (!icon) return;
            icon.classList.remove('dock-bounce');
            void icon.offsetWidth;
            icon.classList.add('dock-bounce');
            setTimeout(() => icon.classList.remove('dock-bounce'), 600);
        }
        function openWindow(id) { 
            if (minimizedWindows[id]) { restoreWindow(id); return; }
            playOpen();
            const win = document.getElementById(id); 
            if (!win) return;
            if (win.style.display !== 'flex') {
                win.classList.remove('window-opening');
                void win.offsetWidth;
                win.classList.add('window-opening');
            }
            win.style.display = 'flex'; 
            bringToFront(win); 
        }
        function minimizeWindow(id) { 
            const win = document.getElementById(id); 
            if (!win || win.style.display === 'none' || animatingWindows[id] || minimizedWindows[id]) return;
            animatingWindows[id] = true;
            playClose();
            const icon = getDockIcon(id);
            const winRect = win.getBoundingClientRect();
            const dockRect = icon ? icon.getBoundingClientRect() : {left: window.innerWidth/2, top: window.innerHeight - 30, width: 56, height: 56};
            const dx = (dockRect.left + dockRect.width/2) - (winRect.left + winRect.width/2);
            const dy = (dockRect.top + dockRect.height/2) - (winRect.top + winRect.height/2);
            win.classList.remove('window-opening');
            win.style.animation = 'none';
            win.classList.add('is-animating');
            win.style.transition = 'transform 0.42s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.32s ease, border-radius 0.42s ease';
            win.style.transformOrigin = 'center center';
            // force reflow before transform
            void win.offsetWidth;
            win.style.transform = `translate(${dx}px, ${dy}px) scale(0.08)`;
            win.style.opacity = '0';
            win.style.borderRadius = '18px';
            if (icon) bounceDockIcon(id);
            setTimeout(() => {
                win.style.display = 'none';
                win.style.transform = '';
                win.style.opacity = '';
                win.style.transition = '';
                win.style.borderRadius = '';
                win.style.animation = '';
                win.classList.remove('is-animating');
                minimizedWindows[id] = true;
                setDockBadge(id, true);
                animatingWindows[id] = false;
            }, 420);
        }
        function restoreWindow(id) { 
            const win = document.getElementById(id); 
            if (!win || animatingWindows[id]) return;
            if (!minimizedWindows[id]) { openWindow(id); return; }
            animatingWindows[id] = true;
            playOpen();
            const icon = getDockIcon(id);
            // prepare window at dock position then animate to normal
            win.classList.remove('window-opening');
            win.style.animation = 'none';
            win.style.display = 'flex';
            bringToFront(win);
            win.classList.add('is-animating');
            const targetRect = win.getBoundingClientRect();
            const dockRect = icon ? icon.getBoundingClientRect() : {left: window.innerWidth/2, top: window.innerHeight - 30, width: 56, height: 56};
            const dx = (dockRect.left + dockRect.width/2) - (targetRect.left + targetRect.width/2);
            const dy = (dockRect.top + dockRect.height/2) - (targetRect.top + targetRect.height/2);
            win.style.transition = 'none';
            win.style.transform = `translate(${dx}px, ${dy}px) scale(0.08)`;
            win.style.opacity = '0';
            win.style.borderRadius = '18px';
            // force reflow
            void win.offsetWidth;
            win.style.transition = 'transform 0.45s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.36s ease, border-radius 0.45s ease';
            win.style.transform = 'translate(0, 0) scale(1)';
            win.style.opacity = '1';
            if (icon) bounceDockIcon(id);
            // hide badge immediately with small delay for pop reverse
            setDockBadge(id, false);
            setTimeout(() => {
                win.style.transform = '';
                win.style.opacity = '';
                win.style.transition = '';
                win.style.borderRadius = '';
                win.style.animation = '';
                win.classList.remove('is-animating');
                delete minimizedWindows[id];
                animatingWindows[id] = false;
            }, 460);
        }
        function cleanupMinimized(id) {
            delete minimizedWindows[id];
            setDockBadge(id, false);
        }
        function toggleFromDock(id) {
            if (animatingWindows[id]) return;
            if (minimizedWindows[id]) { restoreWindow(id); return; }
            const w = document.getElementById(id);
            if (w && w.style.display === 'flex') { bringToFront(w); return; }
            openWindow(id);
        }
        function setDockBadge(id, show) {
            const badge = document.querySelector(`[data-badge="${id}"]`);
            if (!badge) return;
            if (show) {
                badge.classList.remove('hidden');
                badge.classList.remove('show');
                void badge.offsetWidth;
                badge.classList.add('show');
            } else {
                badge.classList.add('hidden');
                badge.classList.remove('show');
            }
        }
        function stopWindowMedia(id) {
            if (id === 'window-music') {
                const a = document.getElementById('audio-player');
                if (a) { a.pause(); a.currentTime = 0; }
            } else if (id === 'window-video') {
                const v = document.getElementById('video-player');
                if (v) { v.pause(); v.currentTime = 0; }
            }
        }
        function closeWindow(id) { 
            const win = document.getElementById(id);
            if (!win) return;
            if (animatingWindows[id]) return;
            playClose();
            stopWindowMedia(id);
            // if minimized, just cleanup
            if (minimizedWindows[id]) { cleanupMinimized(id); return; }
            // ensure no opening animation interferes
            win.classList.remove('window-opening');
            win.style.animation = 'none';
            // fade out quickly
            win.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
            win.style.transform = 'scale(0.92)';
            win.style.opacity = '0';
            setTimeout(() => {
                win.style.display = 'none';
                win.style.transform = '';
                win.style.opacity = '';
                win.style.transition = '';
                cleanupMinimized(id);
            }, 200);
        }
        function bringToFront(element) { zIndexCounter++; element.style.zIndex = zIndexCounter; }

        document.querySelectorAll('.window').forEach(win => {
            win.addEventListener('mousedown', () => bringToFront(win));
            win.addEventListener('touchstart', () => bringToFront(win), {passive: true});
            const titleBar = win.querySelector('.title-bar');
            let isDragging = false, startX, startY, initialLeft, initialTop;

            function dragStart(e) {
                if (e.target.tagName === 'BUTTON') return; // Ignorar botones
                isDragging = true;
                const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
                const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
                startX = clientX; startY = clientY;
                initialLeft = win.offsetLeft; initialTop = win.offsetTop;
                if (e.type.includes('mouse')) document.body.style.userSelect = 'none';
            }
            function dragMove(e) {
                if (!isDragging || window.innerWidth <= 768) return; 
                const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
                const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
                win.style.left = `${initialLeft + (clientX - startX)}px`;
                win.style.top = `${initialTop + (clientY - startY)}px`;
            }
            function dragEnd() { isDragging = false; document.body.style.userSelect = ''; }

            titleBar.addEventListener('mousedown', dragStart);
            document.addEventListener('mousemove', dragMove);
            document.addEventListener('mouseup', dragEnd);
            titleBar.addEventListener('touchstart', dragStart, {passive: true});
            document.addEventListener('touchmove', dragMove, {passive: true});
            document.addEventListener('touchend', dragEnd);
        });

        // --- 3b. Resize tipo macOS (bordes y esquinas) ---
        document.querySelectorAll('.window').forEach(win => {
            const dirs = ['n','s','e','w','ne','nw','se','sw'];
            dirs.forEach(dir => {
                const h = document.createElement('div');
                h.className = 'resize-handle resize-handle-' + dir;
                h.dataset.dir = dir;
                win.appendChild(h);
                let isResizing = false, startX, startY, startW, startH, startL, startT, curDir;
                function rsStart(e) {
                    if (window.innerWidth <= 768) return;
                    e.preventDefault(); e.stopPropagation();
                    bringToFront(win);
                    isResizing = true; curDir = dir;
                    const cx = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
                    const cy = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
                    startX = cx; startY = cy;
                    startW = win.offsetWidth; startH = win.offsetHeight;
                    startL = win.offsetLeft; startT = win.offsetTop;
                    document.body.classList.add('resizing');
                    document.body.style.cursor = getComputedStyle(h).cursor;
                }
                function rsMove(e) {
                    if (!isResizing) return;
                    const cx = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
                    const cy = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
                    const dx = cx - startX, dy = cy - startY;
                    let newW = startW, newH = startH, newL = startL, newT = startT;
                    if (curDir.includes('e')) newW = startW + dx;
                    if (curDir.includes('w')) { newW = startW - dx; newL = startL + dx; }
                    if (curDir.includes('s')) newH = startH + dy;
                    if (curDir.includes('n')) { newH = startH - dy; newT = startT + dy; }
                    const minW = 300, minH = 200;
                    if (newW < minW) { if (curDir.includes('w')) newL -= (minW - newW); newW = minW; }
                    if (newH < minH) { if (curDir.includes('n')) newT -= (minH - newH); newH = minH; }
                    if (newL < 0) { newW += newL; newL = 0; }
                    if (newT < 0) { newH += newT; newT = 0; }
                    const maxW = window.innerWidth - newL - 8;
                    const maxH = window.innerHeight - newT - 8;
                    if (newW > maxW) newW = maxW;
                    if (newH > maxH) newH = maxH;
                    win.style.width = newW + 'px';
                    win.style.height = newH + 'px';
                    win.style.left = newL + 'px';
                    win.style.top = newT + 'px';
                }
                function rsEnd() {
                    if (!isResizing) return;
                    isResizing = false;
                    document.body.classList.remove('resizing');
                    document.body.style.cursor = '';
                }
                h.addEventListener('mousedown', rsStart);
                document.addEventListener('mousemove', rsMove);
                document.addEventListener('mouseup', rsEnd);
                h.addEventListener('touchstart', rsStart, {passive: false});
                document.addEventListener('touchmove', rsMove, {passive: false});
                document.addEventListener('touchend', rsEnd);
            });
        });

        // --- 4. NavegaciÃ³n Links Externos ---
        let targetExitUrl = '';
        function confirmNavigation(url) { 
            playClick();
            targetExitUrl = url; 
            document.getElementById('exit-modal').classList.remove('hidden'); 
        }
        function cancelNavigation() { 
            playClick();
            targetExitUrl = ''; 
            document.getElementById('exit-modal').classList.add('hidden'); 
        }
        function proceedNavigation() { 
            playClick();
            if (targetExitUrl) window.location.href = targetExitUrl; 
        }

