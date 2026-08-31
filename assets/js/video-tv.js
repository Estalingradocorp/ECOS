        // --- 13. EC Video Pro ---
        const vidEl = document.getElementById('video-player');
        const vidContainer = document.getElementById('video-container');
        const vidSeek = document.getElementById('video-seek');
        const vidSeekProgress = document.getElementById('video-seek-progress');
        const vidSeekBuffered = document.getElementById('video-seek-buffered');
        const vidTimeCurrent = document.getElementById('vid-time-current');
        const vidTimeTotal = document.getElementById('vid-time-total');
        const vidPlayIcon = document.getElementById('vid-play-icon');
        const vidVolumeIcon = document.getElementById('vid-volume-icon');
        const vidBigPlay = document.getElementById('video-big-play');
        const vidOverlayMsg = document.getElementById('video-overlay-msg');
        const vidControls = document.getElementById('video-controls');
        const vidSpeedMenu = document.getElementById('video-speed-menu');
        const vidScreenshotFlash = document.getElementById('video-screenshot-flash');
        const vidPlaylistItems = document.getElementById('video-playlist-items');
        const vidPlaylistCount = document.getElementById('video-playlist-count');
        const vidFileInput = document.getElementById('video-file-input');
        const vidSubInput = document.getElementById('video-sub-input');
        const vidDropzone = document.getElementById('video-dropzone');
        const vidBody = document.getElementById('video-body');
        const vidWinTitle = document.getElementById('video-win-title');

        let vidPlaylist = [];
        let vidCurrentIdx = -1;
        let vidSpeed = 1;
        let vidControlsTimeout = null;
        let vidSeekDragging = false;

        // --- File Input ---
        vidFileInput.addEventListener('change', e => {
            const files = Array.from(e.target.files).filter(f => f.type.startsWith('video/'));
            if (files.length) vidAddFiles(files);
            vidFileInput.value = '';
        });

        // --- Subtitle Input ---
        vidSubInput.addEventListener('change', e => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = ev => {
                const track = vidEl.querySelector('track');
                if (track) track.remove();
                const blob = new Blob([ev.target.result], {type: 'text/vtt'});
                const url = URL.createObjectURL(blob);
                const t = document.createElement('track');
                t.kind = 'subtitles';
                t.label = file.name.replace(/\.[^/.]+$/, '');
                t.src = url;
                t.default = true;
                vidEl.appendChild(t);
                vidEl.textTracks[0].mode = 'showing';
                showVidMsg('SubtÃ­tulos cargados');
            };
            reader.readAsText(file);
            vidSubInput.value = '';
        });

        // --- Drag & Drop ---
        vidBody.addEventListener('dragover', e => { e.preventDefault(); vidDropzone.classList.add('show'); });
        vidBody.addEventListener('dragleave', e => { if (!vidBody.contains(e.relatedTarget)) vidDropzone.classList.remove('show'); });
        vidBody.addEventListener('drop', e => {
            e.preventDefault();
            vidDropzone.classList.remove('show');
            const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('video/'));
            if (files.length) vidAddFiles(files);
        });

        function vidAddFiles(files) {
            const start = vidPlaylist.length;
            files.forEach(f => {
                if (!f.type.startsWith('video/') && !f.name.match(/\.(mp4|webm|ogg|mov|avi|mkv)$/i)) return;
                vidPlaylist.push({ name: f.name.replace(/\.[^/.]+$/, ''), url: URL.createObjectURL(f), duration: '--:--' });
            });
            if (vidPlaylist.length === start) return;
            vidUpdatePlaylistUI();
            if (vidCurrentIdx === -1) vidPlay(start);
            if (vidEmptyState) vidEmptyState.style.display = 'none';
            vidContainer.classList.add('has-video');
        }

        // --- Playlist UI ---
        function vidUpdatePlaylistUI() {
            vidPlaylistCount.textContent = vidPlaylist.length;
            if (!vidPlaylist.length) {
                vidPlaylistItems.innerHTML = '<div class="p-6 text-center text-white/20 text-xs">Arrastra archivos de video o haz clic en <i class="fa-solid fa-plus mx-1"></i></div>';
                return;
            }
            vidPlaylistItems.innerHTML = '';
            vidPlaylist.forEach((item, i) => {
                const div = document.createElement('div');
                div.className = 'video-playlist-item' + (i === vidCurrentIdx ? ' active' : '');
                div.innerHTML = `
                    <span class="vp-num">${i === vidCurrentIdx ? '<i class="fa-solid fa-play text-[9px]"></i>' : (i+1)}</span>
                    <span class="vp-name">${escapeHtml(item.name)}</span>
                    <span class="vp-dur">${item.duration}</span>
                    <span class="vp-remove" onclick="event.stopPropagation(); vidRemoveTrack(${i})" title="Eliminar"><i class="fa-solid fa-xmark"></i></span>
                `;
                div.onclick = () => vidPlay(i);
                vidPlaylistItems.appendChild(div);
            });
        }

        function vidRemoveTrack(idx) {
            if (idx === vidCurrentIdx) {
                vidEl.pause();
                vidEl.src = '';
                if (vidPlaylist.length > 1) {
                    vidPlaylist.splice(idx, 1);
                    if (vidCurrentIdx >= vidPlaylist.length) vidCurrentIdx = 0;
                    vidPlay(vidCurrentIdx);
                } else {
                    vidPlaylist.splice(idx, 1);
                    vidCurrentIdx = -1;
                    vidResetUI();
                    vidUpdatePlaylistUI();
                }
            } else {
                const was = vidCurrentIdx;
                vidPlaylist.splice(idx, 1);
                vidCurrentIdx = was > idx ? was - 1 : was;
                vidUpdatePlaylistUI();
            }
        }

        function vidResetUI() {
            vidTimeCurrent.textContent = '0:00';
            vidTimeTotal.textContent = '0:00';
            vidSeek.value = 0;
            vidSeekProgress.style.width = '0%';
            vidPlayIcon.classList.replace('fa-pause', 'fa-play');
            vidContainer.classList.add('paused');
            vidWinTitle.textContent = 'EC Video Pro';
        }

        // --- Playback ---
        function vidPlay(idx) {
            if (idx < 0 || idx >= vidPlaylist.length) return;
            vidCurrentIdx = idx;
            vidEl.src = vidPlaylist[idx].url;
            vidEl.load();
            vidWinTitle.textContent = vidPlaylist[idx].name;
            vidContainer.classList.add('has-video');
            if (vidEmptyState) vidEmptyState.style.display = 'none';
            vidUpdatePlaylistUI();
            vidEl.play().catch(() => {});
        }

        function vidTogglePlay() {
            if (!vidPlaylist.length) return;
            if (vidEl.paused) vidEl.play();
            else vidEl.pause();
        }

        function vidNext() {
            if (!vidPlaylist.length) return;
            vidPlay((vidCurrentIdx + 1) % vidPlaylist.length);
        }

        function vidPrev() {
            if (!vidPlaylist.length) return;
            if (vidEl.currentTime > 3) { vidEl.currentTime = 0; return; }
            vidPlay((vidCurrentIdx - 1 + vidPlaylist.length) % vidPlaylist.length);
        }

        // --- Click on video to play/pause ---
        vidContainer.addEventListener('click', e => {
            if (e.target.closest('.video-controls') || e.target.closest('.video-speed-menu')) return;
            vidTogglePlay();
        });

        // --- Double click to fullscreen ---
        vidContainer.addEventListener('dblclick', e => {
            if (e.target.closest('.video-controls')) return;
            vidToggleFullscreen();
        });

        // --- Seek ---
        vidSeek.addEventListener('input', e => {
            vidSeekDragging = true;
            const pct = e.target.value / 1000;
            vidSeekProgress.style.width = (pct * 100) + '%';
            if (vidEl.duration) vidTimeCurrent.textContent = vidFormatTime(pct * vidEl.duration);
        });
        vidSeek.addEventListener('change', e => {
            vidSeekDragging = false;
            if (vidEl.duration) vidEl.currentTime = (e.target.value / 1000) * vidEl.duration;
        });

        // --- Volume ---
        function vidSetVolume(val) {
            vidEl.volume = val / 100;
            vidEl.muted = false;
            vidUpdateVolumeIcon();
        }

        function vidToggleMute() {
            vidEl.muted = !vidEl.muted;
            vidUpdateVolumeIcon();
        }

        function vidUpdateVolumeIcon() {
            const v = vidEl.muted ? 0 : vidEl.volume;
            vidVolumeIcon.className = 'fa-solid ' + (v === 0 ? 'fa-volume-xmark' : v < 0.5 ? 'fa-volume-low' : 'fa-volume-high');
        }

        // --- Time update ---
        vidEl.addEventListener('timeupdate', () => {
            if (!vidEl.duration || vidSeekDragging) return;
            const pct = vidEl.currentTime / vidEl.duration;
            vidSeek.value = pct * 1000;
            vidSeekProgress.style.width = (pct * 100) + '%';
            vidTimeCurrent.textContent = vidFormatTime(vidEl.currentTime);
        });

        vidEl.addEventListener('loadedmetadata', () => {
            vidTimeTotal.textContent = vidFormatTime(vidEl.duration);
            if (vidCurrentIdx >= 0 && vidPlaylist[vidCurrentIdx]) {
                vidPlaylist[vidCurrentIdx].duration = vidFormatTime(vidEl.duration);
                vidUpdatePlaylistUI();
            }
        });

        // --- Buffered progress ---
        vidEl.addEventListener('progress', () => {
            if (!vidEl.duration || !vidEl.buffered.length) return;
            const buff = vidEl.buffered.end(vidEl.buffered.length - 1) / vidEl.duration;
            vidSeekBuffered.style.width = (buff * 100) + '%';
        });

        // --- Play/Pause events ---
        vidEl.addEventListener('play', () => {
            vidPlayIcon.classList.replace('fa-play', 'fa-pause');
            vidContainer.classList.remove('paused');
        });

        vidEl.addEventListener('pause', () => {
            vidPlayIcon.classList.replace('fa-pause', 'fa-play');
            vidContainer.classList.add('paused');
        });

        vidEl.addEventListener('ended', () => {
            if (vidCurrentIdx < vidPlaylist.length - 1) vidNext();
            else { vidEl.currentTime = 0; vidEl.pause(); }
        });

        // --- Buffering overlay ---
        vidEl.addEventListener('waiting', () => showVidMsg('Cargando...'));
        vidEl.addEventListener('canplay', () => hideVidMsg());

        function showVidMsg(msg) { vidOverlayMsg.textContent = msg; vidOverlayMsg.classList.add('show'); }
        function hideVidMsg() { vidOverlayMsg.classList.remove('show'); }

        // --- Controls auto-hide ---
        vidContainer.addEventListener('mousemove', () => {
            vidControls.classList.add('force-show');
            clearTimeout(vidControlsTimeout);
            vidControlsTimeout = setTimeout(() => {
                if (!vidEl.paused) vidControls.classList.remove('force-show');
            }, 3000);
        });
        vidContainer.addEventListener('mouseleave', () => {
            if (!vidEl.paused) {
                clearTimeout(vidControlsTimeout);
                vidControlsTimeout = setTimeout(() => vidControls.classList.remove('force-show'), 800);
            }
        });

        // --- Speed ---
        function vidSetSpeed(speed) {
            vidSpeed = speed;
            vidEl.playbackRate = speed;
            vidSpeedMenu.querySelectorAll('.video-speed-option').forEach(o => {
                o.classList.toggle('active', parseFloat(o.textContent) === speed || (speed === 1 && o.textContent === 'Normal'));
            });
            vidSpeedMenu.classList.remove('show');
            showVidMsg(speed === 1 ? 'Velocidad normal' : `Velocidad: ${speed}x`);
        }

        function vidToggleSpeedMenu() { vidSpeedMenu.classList.toggle('show'); }
        document.addEventListener('click', e => {
            if (!e.target.closest('#video-speed-menu') && !e.target.closest('#vid-speed-btn'))
                vidSpeedMenu.classList.remove('show');
        });

        // --- Subtitles ---
        function vidToggleSubtitles() {
            const tracks = vidEl.textTracks;
            if (!tracks.length) return;
            const showing = tracks[0].mode === 'showing';
            tracks[0].mode = showing ? 'hidden' : 'showing';
            document.getElementById('vid-sub-btn').classList.toggle('active', !showing);
            showVidMsg(showing ? 'SubtÃ­tulos OFF' : 'SubtÃ­tulos ON');
        }

        // --- Screenshot ---
        function vidScreenshot() {
            const canvas = document.createElement('canvas');
            canvas.width = vidEl.videoWidth;
            canvas.height = vidEl.videoHeight;
            canvas.getContext('2d').drawImage(vidEl, 0, 0);
            vidScreenshotFlash.classList.add('flash');
            setTimeout(() => vidScreenshotFlash.classList.remove('flash'), 150);
            canvas.toBlob(blob => {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = `captura_${Date.now()}.png`;
                a.click();
                URL.revokeObjectURL(a.href);
                showVidMsg('Captura guardada');
            }, 'image/png');
        }

        // --- Picture-in-Picture ---
        async function vidTogglePiP() {
            try {
                if (document.pictureInPictureElement) await document.exitPictureInPicture();
                else if (vidEl.readyState >= 2) await vidEl.requestPictureInPicture();
            } catch(e) { showVidMsg('PiP no disponible'); }
        }

        // --- Fullscreen ---
        function vidToggleFullscreen() {
            if (document.fullscreenElement) document.exitFullscreen();
            else vidContainer.requestFullscreen().catch(() => {});
        }

        document.addEventListener('fullscreenchange', () => {
            const icon = document.getElementById('vid-fullscreen-icon');
            icon.className = document.fullscreenElement ? 'fa-solid fa-compress' : 'fa-solid fa-expand';
        });

        // --- Helpers ---
        function vidFormatTime(s) {
            if (isNaN(s) || !isFinite(s)) return '0:00';
            const h = Math.floor(s / 3600);
            const m = Math.floor((s % 3600) / 60);
            const sec = Math.floor(s % 60);
            return h > 0 ? `${h}:${m.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}` : `${m}:${sec.toString().padStart(2,'0')}`;
        }

        // --- Keyboard Shortcuts (Video) ---
        document.addEventListener('keydown', e => {
            const win = document.getElementById('window-video');
            if (!win || win.style.display === 'none' || !win.style.display) return;
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            if (e.code === 'Space') { e.preventDefault(); vidTogglePlay(); }
            if (e.code === 'ArrowRight') { e.preventDefault(); vidEl.currentTime = Math.min(vidEl.duration || 0, vidEl.currentTime + 5); showVidMsg('+5s'); }
            if (e.code === 'ArrowLeft') { e.preventDefault(); vidEl.currentTime = Math.max(0, vidEl.currentTime - 5); showVidMsg('-5s'); }
            if (e.code === 'ArrowUp') { e.preventDefault(); vidEl.volume = Math.min(1, vidEl.volume + 0.1); document.getElementById('video-volume').value = vidEl.volume * 100; vidUpdateVolumeIcon(); }
            if (e.code === 'ArrowDown') { e.preventDefault(); vidEl.volume = Math.max(0, vidEl.volume - 0.1); document.getElementById('video-volume').value = vidEl.volume * 100; vidUpdateVolumeIcon(); }
            if (e.code === 'KeyF') { e.preventDefault(); vidToggleFullscreen(); }
            if (e.code === 'KeyM') { e.preventDefault(); vidToggleMute(); }
            if (e.code === 'KeyC') { e.preventDefault(); vidToggleSubtitles(); }
            if (e.code === 'KeyS' && !e.ctrlKey) { e.preventDefault(); vidScreenshot(); }
            if (e.code === 'KeyP') { e.preventDefault(); vidTogglePiP(); }
            if (e.code === 'BracketRight') { vidSetSpeed(Math.min(4, vidSpeed + 0.25)); }
            if (e.code === 'BracketLeft') { vidSetSpeed(Math.max(0.25, vidSpeed - 0.25)); }
            if (e.code === 'Home') { e.preventDefault(); vidEl.currentTime = 0; }
            if (e.code === 'End') { e.preventDefault(); vidEl.currentTime = vidEl.duration || 0; }
            if (e.code === 'Digit0') { vidEl.currentTime = 0; }
            if (e.code === 'Digit1') { vidEl.currentTime = (vidEl.duration || 0) * 0.1; }
            if (e.code === 'Digit2') { vidEl.currentTime = (vidEl.duration || 0) * 0.2; }
            if (e.code === 'Digit3') { vidEl.currentTime = (vidEl.duration || 0) * 0.3; }
            if (e.code === 'Digit4') { vidEl.currentTime = (vidEl.duration || 0) * 0.4; }
            if (e.code === 'Digit5') { vidEl.currentTime = (vidEl.duration || 0) * 0.5; }
            if (e.code === 'Digit6') { vidEl.currentTime = (vidEl.duration || 0) * 0.6; }
            if (e.code === 'Digit7') { vidEl.currentTime = (vidEl.duration || 0) * 0.7; }
            if (e.code === 'Digit8') { vidEl.currentTime = (vidEl.duration || 0) * 0.8; }
            if (e.code === 'Digit9') { vidEl.currentTime = (vidEl.duration || 0) * 0.9; }
            if (e.ctrlKey && e.code === 'KeyO') { e.preventDefault(); document.getElementById('video-file-input').click(); }
        });

        // --- Ctrl+O global ---
        document.addEventListener('keydown', e => {
            if (e.ctrlKey && e.code === 'KeyO') {
                const win = document.getElementById('window-video');
                if (win && win.style.display !== 'none' && win.style.display) {
                    e.preventDefault();
                    document.getElementById('video-file-input').click();
                }
            }
        });

        // --- 14. TV en Vivo ---
        const tvChannelsList = document.getElementById('tv-channels-list');
        const tvPanel = document.getElementById('video-tv-panel');
        const tvUrlInput = document.getElementById('tv-url-input');
        const vidEmptyState = document.getElementById('video-empty-state');

        let tvChannels = [
            // Noticias
            { name: 'BBC News', url: 'https://stream.bbc.com/bbcnews/bbcnews.isml/playlist.m3u8', cat: 'news', logo: 'ðŸ“º' },
            { name: 'CNN', url: 'https://live-hls-web-aje.getaj.net/CNN/index.m3u8', cat: 'news', logo: 'ðŸ“º' },
            { name: 'Al Jazeera', url: 'https://live-hls-web-aje.getaj.net/AJAE/index.m3u8', cat: 'news', logo: 'ðŸ“º' },
            { name: 'France 24', url: 'https://stream2.france24.com/live/france24_en_hi/playlist.m3u8', cat: 'news', logo: 'ðŸ“º' },
            { name: 'DW News', url: 'https://dwamdstream102.akamaized.net/hls/live/2015525/dwstream102/index.m3u8', cat: 'news', logo: 'ðŸ“º' },
            { name: 'Euronews', url: 'https://euronews-euronews-english-2-us.plex.wurl.tv/playlist.m3u8', cat: 'news', logo: 'ðŸ“º' },
            { name: 'NHK World', url: 'https://nhkwlive-ojp.akamaized.net/hls/live/2003459/nhkwlive-ojp-en/index.m3u8', cat: 'news', logo: 'ðŸ“º' },
            { name: 'CNA', url: 'https://cna-rm/liveChannel1.m3u8', cat: 'news', logo: 'ðŸ“º' },
            { name: 'Bloomberg TV', url: 'https://bloomberg-cmdl-live.akamaized.net/bloombergtv_latam/live/playlist.m3u8', cat: 'news', logo: 'ðŸ“º' },
            { name: 'CBS News', url: 'https://cbsnews-tbdlive2-akamaized.streamguys1.com/live/tbd_live_from_cbsnews.m3u8', cat: 'news', logo: 'ðŸ“º' },
            { name: 'NBC News NOW', url: 'https://tvs-nbcnews-tvunetworks2-xå¥‡ima.akamaized.net/nbcnewsnow/playlist.m3u8', cat: 'news', logo: 'ðŸ“º' },
            { name: 'Sky News', url: 'https://edge.hls-streaming.com/ip-tv/UK/Sky-News-UK/skynewsuk/index.m3u8', cat: 'news', logo: 'ðŸ“º' },
            { name: 'Fox Weather', url: 'https://fox-weather-live-fox952241.plex.wurl.tv/playlist.m3u8', cat: 'news', logo: 'ðŸ“º' },
            { name: 'ABC News (AU)', url: 'https://live.fast.meda.net.au/abcnews/audio.m3u8', cat: 'news', logo: 'ðŸ“º' },
            { name: 'WION', url: 'https://live-hls-web-aje.getaj.net/WION/index.m3u8', cat: 'news', logo: 'ðŸ“º' },
            // Deportes
            { name: 'Stadium', url: 'https://live-hls-web-aje.getaj.net/Stadium/index.m3u8', cat: 'sports', logo: 'âš½' },
            { name: 'FIFA+', url: 'https://d2zihajmogu5jn.cloudfront.net/bipbop-advanced/bipbop_16x9_variant.m3u8', cat: 'sports', logo: 'âš½' },
            { name: 'Tastemade', url: 'https://tastemade-vod-plus.akamaized.net/live/programs/featured/fallback.m3u8', cat: 'sports', logo: 'âš½' },
            // Entretenimiento
            { name: 'Red Bull TV', url: 'https://rbmn-live.akamaized.net/hls/live/590964/BossssTV/master.m3u8', cat: 'entertainment', logo: 'ðŸŽ­' },
            { name: 'PBS', url: 'https://americanarchive.org/live/liveStream/GBS/bb71c8e8e12a17a0f1cbf3cfba8a8b75/playlist.m3u8', cat: 'entertainment', logo: 'ðŸŽ­' },
            { name: 'Classic Arts', url: 'https://cais-live.reflector.cc/CAIS.m3u8', cat: 'entertainment', logo: 'ðŸŽ­' },
            // MÃºsica
            { name: 'Stingray CMusic', url: 'https://stingray-afr-canada-aka.glstream.com/cmusic/cmusic.isml/cmusic-aes.isml/cmusic-aus-1280.m3u8', cat: 'music', logo: 'ðŸŽµ' },
            { name: 'MTV Hits', url: 'https://mtv-com.mdn.live/wp-content/uploads/2023/10/mtv-hits/playlist.m3u8', cat: 'music', logo: 'ðŸŽµ' },
            { name: 'Club MTV', url: 'https://mtv-com.mdn.live/wp-content/uploads/2023/10/club-mtv/playlist.m3u8', cat: 'music', logo: 'ðŸŽµ' },
            // Infantil
            { name: 'Cartoon Network', url: 'https://live-hls-web-aje.getaj.net/CN/index.m3u8', cat: 'kids', logo: 'ðŸ§¸' },
            { name: 'Nickelodeon', url: 'https://nick-rh.streamguys1.com/live/nickelodeon_720p/playlist.m3u8', cat: 'kids', logo: 'ðŸ§¸' },
            // Canales varios / internacionales
            { name: 'TV5 Monde', url: 'https://sv5-live.cdn3.firstmedia.cc/live/stream-hls-tv5/playlist.m3u8', cat: 'entertainment', logo: 'ðŸŒ' },
            { name: 'CGTN', url: 'https://english.cctv.com/live/cctv_English/index.m3u8', cat: 'news', logo: 'ðŸŒ' },
            { name: 'RT', url: 'https://rt-glb.rttv.com/live/rtnews/playlist.m3u8', cat: 'news', logo: 'ðŸŒ' },
        ];

        let tvCurrentFilter = 'all';
        let tvPlayingIdx = -1;
        let tvUserChannels = [];

        // Load user channels from localStorage
        try {
            const saved = localStorage.getItem('ec_tv_channels');
            if (saved) tvUserChannels = JSON.parse(saved);
        } catch(e) {}

        function tvRenderChannels() {
            const allChannels = [...tvUserChannels.map(c => ({...c, isUser: true})), ...tvChannels];
            const filtered = tvCurrentFilter === 'all' ? allChannels :
                tvCurrentFilter === 'user' ? tvUserChannels.map(c => ({...c, isUser: true})) :
                allChannels.filter(c => c.cat === tvCurrentFilter);
            
            tvChannelsList.innerHTML = '';
            if (!filtered.length) {
                tvChannelsList.innerHTML = '<div class="p-6 text-center text-white/20 text-xs">No hay canales en esta categorÃ­a</div>';
                return;
            }
            filtered.forEach((ch, i) => {
                const div = document.createElement('div');
                const origIdx = tvChannels.indexOf(ch);
                const isPlaying = ch.url === vidEl.src;
                div.className = 'tv-channel' + (isPlaying ? ' playing' : '');
                div.innerHTML = `
                    <div class="tv-ch-logo">${ch.logo || 'ðŸ“º'}</div>
                    <div class="tv-ch-info">
                        <div class="tv-ch-name">${escapeHtml(ch.name)}</div>
                        <div class="tv-ch-cat">${ch.cat || 'varios'}${ch.isUser ? ' (tu)' : ''}</div>
                    </div>
                    <div class="tv-ch-live"></div>
                `;
                div.onclick = () => tvPlayChannel(ch);
                tvChannelsList.appendChild(div);
            });
        }

        function tvPlayChannel(ch) {
            vidEl.src = ch.url;
            vidEl.load();
            vidEl.play().catch(() => {});
            vidWinTitle.textContent = ch.name + ' â€” EN VIVO';
            vidContainer.classList.add('has-video');
            if (vidEmptyState) vidEmptyState.style.display = 'none';
            tvRenderChannels();
            showVidMsg('ðŸ“º ' + ch.name);
        }

        function tvFilterCategory(cat) {
            tvCurrentFilter = cat;
            document.querySelectorAll('.tv-cat-btn').forEach(btn => {
                btn.classList.toggle('active', btn.textContent.toLowerCase().includes(cat) || (cat === 'all' && btn.textContent === 'Todos') || (cat === 'user' && btn.textContent === 'Mis canales'));
            });
            tvRenderChannels();
        }

        function tvAddStream() {
            const url = tvUrlInput.value.trim();
            if (!url) return;
            const name = prompt('Nombre del canal:', 'Mi Canal');
            if (!name) return;
            tvUserChannels.push({ name, url, cat: 'user', logo: 'ðŸ“¡' });
            try { localStorage.setItem('ec_tv_channels', JSON.stringify(tvUserChannels)); } catch(e) {}
            tvUrlInput.value = '';
            tvRenderChannels();
            showVidMsg('Canal aÃ±adido: ' + name);
        }
        tvUrlInput.addEventListener('keydown', e => { if (e.key === 'Enter') tvAddStream(); });

        function tvToggleTVPanel() {
            const show = tvPanel.classList.contains('hidden');
            tvPanel.classList.toggle('hidden');
            document.getElementById('vid-tv-toggle').classList.toggle('active', show);
            if (show) tvRenderChannels();
        }

        function vidTogglePlaylist() {
            const panel = document.getElementById('video-playlist-panel');
            panel.classList.toggle('hidden');
            document.getElementById('vid-playlist-toggle').classList.toggle('active', !panel.classList.contains('hidden'));
        }

        // Initialize TV panel hidden
        if (tvPanel) tvPanel.classList.add('hidden');

