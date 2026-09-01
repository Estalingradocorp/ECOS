        // --- 12. EC Music Pro ---
        const audioPlayer = document.getElementById('audio-player');
        const audioInput = document.getElementById('audio-upload-input');
        const musicTitle = document.getElementById('music-title');
        const musicArtist = document.getElementById('music-artist');
        const musicCover = document.getElementById('music-cover');
        const musicCoverIcon = document.getElementById('music-cover-icon');
        const musicCoverImg = document.getElementById('music-cover-img');
        const musicGlow = document.getElementById('music-glow');
        const musicEq = document.getElementById('music-eq');
        const playlistItems = document.getElementById('playlist-items');
        const playlistCount = document.getElementById('playlist-count');
        const musicProgress = document.getElementById('music-progress');
        const musicCurrent = document.getElementById('music-current');
        const musicTotal = document.getElementById('music-total');
        const musicVolume = document.getElementById('music-volume');
        const musicPlayIcon = document.getElementById('music-play-icon');
        const musicBody = document.getElementById('music-body');
        const musicDropzone = document.getElementById('music-dropzone');
        const btnShuffle = document.getElementById('btn-shuffle');
        const btnRepeat = document.getElementById('btn-repeat');

        const DEFAULT_COVER = 'https://64.media.tumblr.com/76e1731cb57e42c75e23a5a49ac6b7ad/0405ac2cbd79fe6a-5c/s1280x1920/097c923e9b004fba2423a988cd1550ccd1253b69.pnj';
        let currentNeon = null;

        function arrayBufferToBase64(buf) {
            const bytes = new Uint8Array(buf);
            let binary = '';
            for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
            return btoa(binary);
        }

        function extractCover(blob) {
            return new Promise(resolve => {
                if (!window.jsmediatags || !blob) return resolve(null);
                try {
                    jsmediatags.read(blob, {
                        onSuccess: tag => {
                            const pic = tag.tags && tag.tags.picture;
                            if (pic && pic.data) {
                                try { resolve(`data:${pic.format};base64,${arrayBufferToBase64(pic.data)}`); }
                                catch (e) { resolve(null); }
                            } else resolve(null);
                        },
                        onError: () => resolve(null)
                    });
                } catch (e) { resolve(null); }
            });
        }

        function extractDominantColor(imgSrc, cb) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    const size = 40;
                    canvas.width = size; canvas.height = size;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, size, size);
                    const data = ctx.getImageData(0, 0, size, size).data;
                    let r = 0, g = 0, b = 0, n = 0;
                    for (let i = 0; i < data.length; i += 4) { r += data[i]; g += data[i + 1]; b += data[i + 2]; n++; }
                    cb(`rgb(${Math.round(r / n)}, ${Math.round(g / n)}, ${Math.round(b / n)})`);
                } catch (e) { cb(null); }
            };
            img.onerror = () => cb(null);
            img.src = imgSrc;
        }

        function neonColorForIndex(index) {
            return `hsl(${Math.abs(index) * 47 % 360}, 90%, 62%)`;
        }

        function applyNeon(color) {
            currentNeon = color;
            const playing = !audioPlayer.paused;
            musicGlow.style.background = color;
            musicGlow.style.opacity = playing ? '0.55' : '0.25';
            musicCover.style.boxShadow = `0 0 30px ${color}, 0 0 70px ${color}55, 0 0 110px ${color}33`;
            const ring = document.getElementById('music-cover-ring');
            if (ring) ring.style.borderColor = color;
        }

        function updateCoverForTrack(track, index) {
            if (track.cover === undefined && track.blob) {
                extractCover(track.blob).then(c => {
                    track.cover = c || null;
                    if (currentTrackIndex >= 0 && playlist[currentTrackIndex] === track) renderCover(track, index);
                });
            } else {
                renderCover(track, index);
            }
        }

        function renderCover(track, index) {
            const src = track.cover || DEFAULT_COVER;
            if (src) {
                musicCoverImg.src = src;
                musicCoverImg.classList.remove('hidden');
                musicCoverIcon.classList.add('hidden');
            } else {
                musicCoverImg.classList.add('hidden');
                musicCoverIcon.classList.remove('hidden');
            }
            const fallback = neonColorForIndex(index);
            applyNeon(fallback);
            extractDominantColor(src, c => { if (c) applyNeon(c); });
        }

        let playlist = [];
        let library = [];
        let playlists = []; // { id, name, keys: [] }
        let currentListId = 'library';
        let playlistUid = 0;
        let currentTrackIndex = -1;
        let shuffleMode = false;
        let repeatMode = 0; // 0=off, 1=all, 2=one
        let shuffleOrder = [];
        let pendingResumeTime = null;
        let lastStateSave = 0;
        const musicStateKey = 'ec_music_state';
        const playlistsKey = 'ec_playlists';

        function trackKey(track) {
            if (!track) return null;
            if (track.storeId != null) return 'id:' + track.storeId;
            if (!track.uid) track.uid = ++playlistUid;
            return 'uid:' + track.uid;
        }

        function loadPlaylists() {
            try {
                const raw = localStorage.getItem(playlistsKey);
                if (raw) playlists = (JSON.parse(raw).lists) || [];
            } catch (e) { playlists = []; }
        }

        function savePlaylists() {
            try { localStorage.setItem(playlistsKey, JSON.stringify({ lists: playlists })); } catch (e) {}
        }

        function getCurrentPlaylist() {
            if (currentListId === 'library') return null;
            return playlists.find(p => p.id === currentListId) || null;
        }

        function renderPlaylistSelector() {
            const sel = document.getElementById('music-playlist-select');
            if (!sel) return;
            const pl = getCurrentPlaylist();
            const title = document.getElementById('playlist-title');
            if (title) title.textContent = pl ? pl.name : 'Biblioteca';
            sel.innerHTML = '';
            const oLib = document.createElement('option');
            oLib.value = 'library';
            oLib.textContent = 'Biblioteca (todas)';
            sel.appendChild(oLib);
            playlists.forEach(p => {
                const o = document.createElement('option');
                o.value = p.id;
                o.textContent = p.name;
                sel.appendChild(o);
            });
            sel.value = currentListId;
        }

        function rebuildPlaylistView() {
            const pl = getCurrentPlaylist();
            playlist = pl ? library.filter(t => pl.keys.includes(trackKey(t))) : library.slice();
            if (currentTrackIndex >= playlist.length) currentTrackIndex = playlist.length - 1;
            renderPlaylistSelector();
            updatePlaylistUI();
        }

        function onPlaylistChange() {
            const sel = document.getElementById('music-playlist-select');
            if (!sel) return;
            currentListId = sel.value;
            currentTrackIndex = -1;
            shuffleOrder = [];
            rebuildPlaylistView();
            if (playlist.length) { currentTrackIndex = 0; playTrack(0); }
            else { audioPlayer.pause(); audioPlayer.src = ''; resetPlayerUI(); }
            saveMusicState();
        }

        function createPlaylist() {
            const name = prompt('Nombre de la nueva lista:', '');
            if (!name || !name.trim()) return;
            playlists.push({ id: 'pl' + Date.now(), name: name.trim(), keys: [] });
            savePlaylists();
            currentListId = playlists[playlists.length - 1].id;
            currentTrackIndex = -1;
            rebuildPlaylistView();
            audioPlayer.pause(); audioPlayer.src = ''; resetPlayerUI();
        }

        function deleteCurrentPlaylist() {
            const pl = getCurrentPlaylist();
            if (!pl) return;
            if (!confirm(`¿Eliminar la lista "${pl.name}"? (las canciones no se borran)`)) return;
            playlists = playlists.filter(p => p.id !== pl.id);
            savePlaylists();
            currentListId = 'library';
            currentTrackIndex = -1;
            rebuildPlaylistView();
            if (playlist.length) { currentTrackIndex = 0; playTrack(0); }
            else { audioPlayer.pause(); audioPlayer.src = ''; resetPlayerUI(); }
            saveMusicState();
        }

        function toggleMusicDrawer() {
            const d = document.getElementById('music-drawer');
            if (!d) return;
            if (d.style.transform === 'translateX(0px)' || d.classList.contains('open')) closeMusicDrawer();
            else openMusicDrawer();
        }

        function openMusicDrawer() {
            const d = document.getElementById('music-drawer');
            const b = document.getElementById('music-drawer-backdrop');
            if (!d) return;
            d.classList.add('open');
            d.style.transform = 'translateX(0)';
            if (b) b.classList.remove('hidden');
        }

        function closeMusicDrawer() {
            const d = document.getElementById('music-drawer');
            const b = document.getElementById('music-drawer-backdrop');
            if (d) { d.classList.remove('open'); d.style.transform = 'translateX(-105%)'; }
            if (b) b.classList.add('hidden');
            hideAddMenu();
        }

        function openAddMenu(ev, index) {
            ev.stopPropagation();
            const track = playlist[index];
            if (!track) return;
            const key = trackKey(track);
            const menu = document.getElementById('music-pl-menu');
            if (!menu) return;
            menu.innerHTML = '';
            playlists.forEach(p => {
                const added = p.keys.includes(key);
                const item = document.createElement('button');
                item.className = 'block w-full text-left px-3 py-1.5 hover:bg-white/10 text-white/85 transition';
                item.innerHTML = (added ? '✓ ' : '+ ') + escapeHtml(p.name);
                item.onclick = (e) => {
                    e.stopPropagation();
                    if (added) p.keys = p.keys.filter(k => k !== key);
                    else p.keys.push(key);
                    savePlaylists();
                    hideAddMenu();
                    rebuildPlaylistView();
                };
                menu.appendChild(item);
            });
            const newItem = document.createElement('button');
            newItem.className = 'block w-full text-left px-3 py-1.5 hover:bg-white/10 text-blue-300 transition';
            newItem.innerHTML = '+ Nueva lista...';
            newItem.onclick = (e) => {
                e.stopPropagation();
                hideAddMenu();
                const name = prompt('Nombre de la nueva lista:', '');
                if (name && name.trim()) {
                    playlists.push({ id: 'pl' + Date.now(), name: name.trim(), keys: [key] });
                    savePlaylists();
                    rebuildPlaylistView();
                }
            };
            menu.appendChild(newItem);
            menu.classList.remove('hidden');
            menu.style.left = Math.min(ev.clientX, window.innerWidth - 190) + 'px';
            menu.style.top = Math.min(ev.clientY, window.innerHeight - 170) + 'px';
        }

        function hideAddMenu() {
            const menu = document.getElementById('music-pl-menu');
            if (menu) menu.classList.add('hidden');
        }
        document.addEventListener('click', e => {
            if (!e.target.closest('#music-pl-menu')) hideAddMenu();
        });

        function removeTrackFromCurrentPlaylist(index) {
            const pl = getCurrentPlaylist();
            const track = playlist[index];
            if (!pl || !track) return;
            const key = trackKey(track);
            pl.keys = pl.keys.filter(k => k !== key);
            savePlaylists();
            const wasCurrent = index === currentTrackIndex;
            rebuildPlaylistView();
            if (wasCurrent) {
                if (playlist.length) { currentTrackIndex = Math.min(index, playlist.length - 1); playTrack(currentTrackIndex); }
                else { audioPlayer.pause(); audioPlayer.src = ''; currentTrackIndex = -1; resetPlayerUI(); }
            }
        }

        function saveMusicState() {
            try {
                localStorage.setItem(musicStateKey, JSON.stringify({
                    index: currentTrackIndex,
                    time: audioPlayer.currentTime || 0,
                    shuffle: shuffleMode,
                    repeat: repeatMode,
                    volume: audioPlayer.volume,
                    listId: currentListId
                }));
            } catch (e) {}
        }

        function restoreMusicState() {
            try {
                const raw = localStorage.getItem(musicStateKey);
                if (!raw) return null;
                const st = JSON.parse(raw);
                if (typeof st.volume === 'number') {
                    audioPlayer.volume = Math.max(0, Math.min(1, st.volume));
                    musicVolume.value = audioPlayer.volume * 100;
                }
                if (st.shuffle) { shuffleMode = true; buildShuffleOrder(); }
                repeatMode = st.repeat || 0;
                syncShuffleUI();
                syncRepeatUI();
                return st;
            } catch (e) { return null; }
        }

        function syncShuffleUI() {
            btnShuffle.classList.toggle('text-white/90', shuffleMode);
            btnShuffle.classList.toggle('text-white/40', !shuffleMode);
        }

        function syncRepeatUI() {
            btnRepeat.classList.toggle('text-white/90', repeatMode > 0);
            btnRepeat.classList.toggle('text-white/40', repeatMode === 0);
            btnRepeat.style.position = repeatMode === 2 ? 'relative' : '';
            btnRepeat.innerHTML = repeatMode === 2
                ? '<i class="fa-solid fa-repeat text-[10px]"></i><span class="absolute -bottom-0.5 -right-0.5 text-[7px] font-bold text-white/90">1</span>'
                : '<i class="fa-solid fa-repeat"></i>';
        }

        // Gradient palettes for cover art
        const coverGradients = [
            ['#e94560','#ff6b6b'],['#6c5ce7','#a29bfe'],['#00b894','#55efc4'],
            ['#fdcb6e','#e17055'],['#0984e3','#74b9ff'],['#e84393','#fd79a8'],
            ['#00cec9','#81ecec'],['#6c5ce7','#fd79a8'],['#d63031','#ff7675'],
            ['#2d3436','#636e72'],['#0652DD','#1289A7'],['#A3CB38','#009432']
        ];
        let currentGradient = 0;

        // --- File input ---
        audioInput.addEventListener('change', function(e) {
            const files = Array.from(e.target.files);
            if (!files.length) return;
            persistFiles(files).then(saved => addFilesToPlaylist(files, saved));
            audioInput.value = '';
        });

        function addFilesToPlaylist(files, savedEntries) {
            const audioFiles = Array.from(files).filter(f => f.type.startsWith('audio/'));
            if (!audioFiles.length) return;
            audioFiles.forEach((file, i) => {
                const saved = savedEntries && savedEntries[i];
                library.push({
                    name: file.name ? file.name.replace(/\.[^/.]+$/, '') : (saved ? saved.name : 'Pista'),
                    url: URL.createObjectURL(file),
                    blob: file,
                    duration: '--:--',
                    storeId: saved ? saved.id : null,
                    cover: undefined
                });
            });
            rebuildPlaylistView();
            if (currentTrackIndex === -1 && playlist.length) playTrack(0);
        }

        async function persistFiles(files) {
            const saved = [];
            for (const file of Array.from(files)) {
                if (!file.type.startsWith('audio/')) continue;
                const name = file.name.replace(/\.[^/.]+$/, '');
                try {
                    const id = await MediaStore.save({ name, blob: file, type: 'audio' });
                    saved.push({ id, name });
                } catch (e) { console.warn('No se pudo guardar audio:', e); }
            }
            return saved;
        }

        function loadSavedPlaylist() {
            loadPlaylists();
            const st = restoreMusicState();
            MediaStore.all().then(saved => {
                const audios = saved.filter(e => e.type === 'audio');
                if (!audios.length) return;
                audios.forEach(e => {
                    library.push({
                        name: e.name,
                        url: URL.createObjectURL(e.blob),
                        blob: e.blob,
                        duration: '--:--',
                        storeId: e.id,
                        cover: undefined
                    });
                });
                if (st && st.listId && st.listId !== 'library' && playlists.some(p => p.id === st.listId)) {
                    currentListId = st.listId;
                }
                rebuildPlaylistView();
                if (st && typeof st.index === 'number' && st.index >= 0 && st.index < playlist.length) {
                    pendingResumeTime = typeof st.time === 'number' ? st.time : 0;
                    playTrack(st.index);
                } else if (currentTrackIndex === -1) {
                    playTrack(0);
                }
            }).catch(e => console.warn('No se pudo cargar música:', e));
        }

        // --- Drag & Drop ---
        musicBody.addEventListener('dragover', e => { e.preventDefault(); musicDropzone.classList.remove('hidden'); });
        musicBody.addEventListener('dragleave', e => { if (!musicBody.contains(e.relatedTarget)) musicDropzone.classList.add('hidden'); });
        musicBody.addEventListener('drop', e => {
            e.preventDefault();
            musicDropzone.classList.add('hidden');
            const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('audio/'));
            if (files.length) persistFiles(files).then(saved => addFilesToPlaylist(files, saved));
        });
        const musicDrawer = document.getElementById('music-drawer');
        if (musicDrawer) {
            musicDrawer.addEventListener('dragover', e => { e.preventDefault(); musicDropzone.classList.remove('hidden'); });
            musicDrawer.addEventListener('dragleave', e => {
                if (!musicDrawer.contains(e.relatedTarget)) { e.preventDefault(); musicDropzone.classList.add('hidden'); }
            });
            musicDrawer.addEventListener('drop', e => {
                e.preventDefault();
                musicDropzone.classList.add('hidden');
                const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('audio/'));
                if (files.length) persistFiles(files).then(saved => addFilesToPlaylist(files, saved));
            });
        }

        // --- Playlist UI ---
        function updatePlaylistUI() {
            const pl = getCurrentPlaylist();
            const savedCount = playlist.filter(t => t.storeId != null).length;
            playlistCount.textContent = `${playlist.length} pista${playlist.length !== 1 ? 's' : ''}${savedCount ? ' · ' + savedCount + ' guardada' + (savedCount !== 1 ? 's' : '') : ''}`;
            if (playlist.length === 0) {
                playlistItems.innerHTML = pl
                    ? '<li class="p-6 text-center text-white/30 text-xs italic">Lista vacía. Ve a Biblioteca y pulsa el icono de lista en una canción para añadirla aquí.</li>'
                    : '<li class="p-6 text-center text-white/30 text-xs italic">Arrastra archivos de audio o haz clic en <i class="fa-solid fa-plus mx-1"></i> para añadir</li>';
                return;
            }
            playlistItems.innerHTML = '';
            playlist.forEach((track, index) => {
                const li = document.createElement('li');
                const isPlaying = index === currentTrackIndex;
                li.className = isPlaying ? 'track-active' : '';
                const addBtn = pl
                    ? `<span class="track-add" onclick="event.stopPropagation(); removeTrackFromCurrentPlaylist(${index})" title="Quitar de esta lista"><i class="fa-solid fa-circle-minus"></i></span>`
                    : `<span class="track-add" onclick="openAddMenu(event, ${index})" title="Añadir a una lista"><i class="fa-solid fa-list-ul"></i></span>`;
                li.innerHTML = `
                    <span class="track-num">${isPlaying ? '<i class="fa-solid fa-volume-high animate-pulse"></i>' : (index + 1)}</span>
                    <span class="track-name">${escapeHtml(track.name)}${track.storeId != null ? '<i class="fa-solid fa-floppy-disk ml-1 text-[7px] text-white/25" title="Guardado en el dispositivo"></i>' : ''}</span>
                    <span class="track-dur">${track.duration || '--:--'}</span>
                    ${addBtn}
                    <span class="track-remove" onclick="event.stopPropagation(); removeTrack(${index})" title="Eliminar"><i class="fa-solid fa-xmark"></i></span>
                `;
                li.onclick = () => { playTrack(index); closeMusicDrawer(); };
                playlistItems.appendChild(li);
            });
        }

        function deleteStoredTrack(track) {
            if (track && track.storeId != null) {
                MediaStore.remove(track.storeId).catch(e => console.warn('No se pudo borrar audio:', e));
            }
        }

        function removeTrack(index) {
            const track = playlist[index];
            if (!track) return;
            const wasCurrent = currentTrackIndex >= 0 && playlist[currentTrackIndex] === track;
            const libIdx = library.indexOf(track);
            if (libIdx >= 0) library.splice(libIdx, 1);
            const key = trackKey(track);
            playlists.forEach(p => { p.keys = p.keys.filter(k => k !== key); });
            savePlaylists();
            deleteStoredTrack(track);
            if (wasCurrent) { audioPlayer.pause(); audioPlayer.src = ''; }
            rebuildPlaylistView();
            if (library.length === 0) { currentTrackIndex = -1; resetPlayerUI(); return; }
            if (currentTrackIndex >= playlist.length) currentTrackIndex = playlist.length - 1;
            if (playlist.length) playTrack(Math.max(0, currentTrackIndex));
            else { currentTrackIndex = -1; resetPlayerUI(); }
        }

        function resetPlayerUI() {
            musicTitle.textContent = 'Ninguna pista';
            musicArtist.textContent = 'AÃ±ade mÃºsica para comenzar';
            musicCurrent.textContent = '0:00';
            musicTotal.textContent = '0:00';
            musicProgress.value = 0;
            musicPlayIcon.classList.replace('fa-pause', 'fa-play');
            musicPlayIcon.classList.add('ml-0.5');
            musicEq.classList.remove('playing');
            musicEq.style.opacity = '0';
            musicCover.style.background = coverGradients[0].map((c,i) => i===0?c:c).join(',');
            musicCoverImg.classList.add('hidden');
            musicCoverIcon.classList.remove('hidden');
            musicGlow.style.opacity = '0';
            musicCover.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3)';
            currentNeon = null;
        }

        // --- Playback ---
        function playTrack(index) {
            if (index < 0 || index >= playlist.length) return;
            currentTrackIndex = index;
            const track = playlist[index];
            audioPlayer.src = track.url;
            musicTitle.textContent = track.name;
            musicArtist.textContent = `Pista ${index + 1} de ${playlist.length}`;
            currentGradient = index % coverGradients.length;
            const g = coverGradients[currentGradient];
            musicCover.style.background = `linear-gradient(135deg, ${g[0]}, ${g[1]})`;
            updateCoverForTrack(track, index);
            audioPlayer.play().catch(() => {});
            updatePlaylistUI();
            saveMusicState();
        }

        function togglePlayPause() {
            if (playlist.length === 0) return;
            if (audioPlayer.paused) audioPlayer.play();
            else audioPlayer.pause();
        }

        function nextTrack() {
            if (playlist.length === 0) return;
            let next;
            if (shuffleMode) {
                if (shuffleOrder.length === 0) buildShuffleOrder();
                const pos = shuffleOrder.indexOf(currentTrackIndex);
                next = shuffleOrder[(pos + 1) % shuffleOrder.length];
            } else {
                next = (currentTrackIndex + 1) % playlist.length;
            }
            playTrack(next);
        }

        function prevTrack() {
            if (playlist.length === 0) return;
            if (audioPlayer.currentTime > 3) { audioPlayer.currentTime = 0; return; }
            let prev;
            if (shuffleMode) {
                if (shuffleOrder.length === 0) buildShuffleOrder();
                const pos = shuffleOrder.indexOf(currentTrackIndex);
                prev = shuffleOrder[(pos - 1 + shuffleOrder.length) % shuffleOrder.length];
            } else {
                prev = (currentTrackIndex - 1 + playlist.length) % playlist.length;
            }
            playTrack(prev);
        }

        function buildShuffleOrder() {
            shuffleOrder = Array.from({length: playlist.length}, (_, i) => i);
            for (let i = shuffleOrder.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffleOrder[i], shuffleOrder[j]] = [shuffleOrder[j], shuffleOrder[i]];
            }
        }

        // --- Shuffle / Repeat ---
        function toggleShuffle() {
            shuffleMode = !shuffleMode;
            syncShuffleUI();
            if (shuffleMode) buildShuffleOrder();
            saveMusicState();
        }

        function toggleRepeat() {
            repeatMode = (repeatMode + 1) % 3;
            syncRepeatUI();
            saveMusicState();
        }

        // --- Controls ---
        function formatTime(sec) {
            if (isNaN(sec) || !isFinite(sec)) return '0:00';
            const m = Math.floor(sec / 60);
            const s = Math.floor(sec % 60);
            return `${m}:${s.toString().padStart(2, '0')}`;
        }

        function seekTrack(val) {
            if (audioPlayer.duration) audioPlayer.currentTime = (val / 100) * audioPlayer.duration;
        }

        function updateVolume(val) {
            audioPlayer.volume = val / 100;
            saveMusicState();
        }

        // --- Audio Events ---
        audioPlayer.addEventListener('timeupdate', () => {
            if (!audioPlayer.duration) return;
            const pct = (audioPlayer.currentTime / audioPlayer.duration) * 100;
            musicProgress.value = pct;
            musicCurrent.textContent = formatTime(audioPlayer.currentTime);
            const now = Date.now();
            if (now - lastStateSave > 3000) { lastStateSave = now; saveMusicState(); }
        });

        audioPlayer.addEventListener('loadedmetadata', () => {
            musicTotal.textContent = formatTime(audioPlayer.duration);
            if (currentTrackIndex >= 0 && playlist[currentTrackIndex]) {
                playlist[currentTrackIndex].duration = formatTime(audioPlayer.duration);
                updatePlaylistUI();
            }
            if (pendingResumeTime != null) {
                audioPlayer.currentTime = pendingResumeTime;
                pendingResumeTime = null;
            }
        });

        audioPlayer.addEventListener('play', () => {
            musicPlayIcon.classList.replace('fa-play', 'fa-pause');
            musicPlayIcon.classList.remove('ml-0.5');
            musicEq.classList.add('playing');
            musicEq.style.opacity = '1';
            musicCover.style.transform = 'scale(1.03)';
            if (currentNeon) applyNeon(currentNeon);
            else musicCover.style.boxShadow = '0 20px 60px rgba(0,0,0,0.5)';
        });

        audioPlayer.addEventListener('pause', () => {
            musicPlayIcon.classList.replace('fa-pause', 'fa-play');
            musicPlayIcon.classList.add('ml-0.5');
            musicEq.classList.remove('playing');
            musicCover.style.transform = 'scale(1)';
            if (currentNeon) applyNeon(currentNeon);
            else musicCover.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3)';
            saveMusicState();
        });

        audioPlayer.addEventListener('ended', () => {
            if (repeatMode === 2) { audioPlayer.currentTime = 0; audioPlayer.play(); return; }
            if (repeatMode === 1 || currentTrackIndex < playlist.length - 1 || shuffleMode) nextTrack();
            else { audioPlayer.pause(); audioPlayer.currentTime = 0; }
        });

        // --- Keyboard Shortcuts ---
        document.addEventListener('keydown', e => {
            const win = document.getElementById('window-music');
            if (win.style.display === 'none' || !win.style.display) return;
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (e.code === 'Space') { e.preventDefault(); togglePlayPause(); }
            if (e.code === 'ArrowRight' && e.shiftKey) nextTrack();
            if (e.code === 'ArrowLeft' && e.shiftKey) prevTrack();
            if (e.code === 'KeyS' && !e.ctrlKey) toggleShuffle();
            if (e.code === 'KeyR' && !e.ctrlKey) toggleRepeat();
        });

        // Guardar estado exacto al recargar/cerrar la página
        window.addEventListener('pagehide', () => saveMusicState());

        // Restaurar canciones guardadas al abrir
        loadSavedPlaylist();

