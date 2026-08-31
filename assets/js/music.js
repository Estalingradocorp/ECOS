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

        let playlist = [];
        let currentTrackIndex = -1;
        let shuffleMode = false;
        let repeatMode = 0; // 0=off, 1=all, 2=one
        let shuffleOrder = [];

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
            addFilesToPlaylist(files);
            audioInput.value = '';
        });

        function addFilesToPlaylist(files) {
            const startIdx = playlist.length;
            files.forEach(file => {
                if (!file.type.startsWith('audio/')) return;
                playlist.push({
                    name: file.name.replace(/\.[^/.]+$/, ''),
                    url: URL.createObjectURL(file),
                    duration: '--:--'
                });
            });
            if (playlist.length === startIdx) return;
            updatePlaylistUI();
            if (currentTrackIndex === -1) playTrack(startIdx);
        }

        // --- Drag & Drop ---
        musicBody.addEventListener('dragover', e => { e.preventDefault(); musicDropzone.classList.remove('hidden'); });
        musicBody.addEventListener('dragleave', e => { if (!musicBody.contains(e.relatedTarget)) musicDropzone.classList.add('hidden'); });
        musicBody.addEventListener('drop', e => {
            e.preventDefault();
            musicDropzone.classList.add('hidden');
            const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('audio/'));
            if (files.length) addFilesToPlaylist(files);
        });

        // --- Playlist UI ---
        function updatePlaylistUI() {
            playlistCount.textContent = `${playlist.length} pista${playlist.length !== 1 ? 's' : ''}`;
            if (playlist.length === 0) {
                playlistItems.innerHTML = '<li class="p-6 text-center text-white/30 text-xs italic">Arrastra archivos de audio o haz clic en <i class="fa-solid fa-plus mx-1"></i> para aÃ±adir</li>';
                return;
            }
            playlistItems.innerHTML = '';
            playlist.forEach((track, index) => {
                const li = document.createElement('li');
                const isPlaying = index === currentTrackIndex;
                li.className = isPlaying ? 'track-active' : '';
                li.innerHTML = `
                    <span class="track-num">${isPlaying ? '<i class="fa-solid fa-volume-high animate-pulse"></i>' : (index + 1)}</span>
                    <span class="track-name">${escapeHtml(track.name)}</span>
                    <span class="track-dur">${track.duration || '--:--'}</span>
                    <span class="track-remove" onclick="event.stopPropagation(); removeTrack(${index})" title="Eliminar"><i class="fa-solid fa-xmark"></i></span>
                `;
                li.onclick = () => playTrack(index);
                playlistItems.appendChild(li);
            });
        }

        function removeTrack(index) {
            if (index === currentTrackIndex) {
                audioPlayer.pause();
                audioPlayer.src = '';
                if (playlist.length > 1) {
                    playlist.splice(index, 1);
                    if (currentTrackIndex >= playlist.length) currentTrackIndex = 0;
                    playTrack(currentTrackIndex);
                } else {
                    playlist.splice(index, 1);
                    currentTrackIndex = -1;
                    resetPlayerUI();
                    updatePlaylistUI();
                }
            } else {
                const wasPlaying = currentTrackIndex;
                playlist.splice(index, 1);
                currentTrackIndex = wasPlaying > index ? wasPlaying - 1 : wasPlaying;
                updatePlaylistUI();
            }
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
            musicCoverIcon.classList.remove('hidden');
            musicCoverImg.classList.add('hidden');
        }

        // --- Playback ---
        function playTrack(index) {
            if (index < 0 || index >= playlist.length) return;
            currentTrackIndex = index;
            audioPlayer.src = playlist[index].url;
            musicTitle.textContent = playlist[index].name;
            musicArtist.textContent = `Pista ${index + 1} de ${playlist.length}`;
            currentGradient = index % coverGradients.length;
            const g = coverGradients[currentGradient];
            musicCover.style.background = `linear-gradient(135deg, ${g[0]}, ${g[1]})`;
            musicGlow.style.background = `${g[0]}33`;
            audioPlayer.play().catch(() => {});
            updatePlaylistUI();
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
            btnShuffle.classList.toggle('text-white/90', shuffleMode);
            btnShuffle.classList.toggle('text-white/40', !shuffleMode);
            if (shuffleMode) buildShuffleOrder();
        }

        function toggleRepeat() {
            repeatMode = (repeatMode + 1) % 3;
            btnRepeat.classList.toggle('text-white/90', repeatMode > 0);
            btnRepeat.classList.toggle('text-white/40', repeatMode === 0);
            const icon = btnRepeat.querySelector('i');
            if (repeatMode === 2) {
                icon.classList.remove('fa-repeat');
                icon.classList.add('fa-repeat', 'text-[10px]');
                btnRepeat.innerHTML = '<i class="fa-solid fa-repeat text-[10px]"></i><span class="absolute -bottom-0.5 -right-0.5 text-[7px] font-bold text-white/90">1</span>';
                btnRepeat.style.position = 'relative';
            } else {
                btnRepeat.innerHTML = '<i class="fa-solid fa-repeat"></i>';
                btnRepeat.style.position = '';
            }
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
        }

        // --- Audio Events ---
        audioPlayer.addEventListener('timeupdate', () => {
            if (!audioPlayer.duration) return;
            const pct = (audioPlayer.currentTime / audioPlayer.duration) * 100;
            musicProgress.value = pct;
            musicCurrent.textContent = formatTime(audioPlayer.currentTime);
        });

        audioPlayer.addEventListener('loadedmetadata', () => {
            musicTotal.textContent = formatTime(audioPlayer.duration);
            if (currentTrackIndex >= 0 && playlist[currentTrackIndex]) {
                playlist[currentTrackIndex].duration = formatTime(audioPlayer.duration);
                updatePlaylistUI();
            }
        });

        audioPlayer.addEventListener('play', () => {
            musicPlayIcon.classList.replace('fa-play', 'fa-pause');
            musicPlayIcon.classList.remove('ml-0.5');
            musicEq.classList.add('playing');
            musicEq.style.opacity = '1';
            musicCover.style.transform = 'scale(1.03)';
            musicCover.style.boxShadow = '0 20px 60px rgba(0,0,0,0.5)';
        });

        audioPlayer.addEventListener('pause', () => {
            musicPlayIcon.classList.replace('fa-pause', 'fa-play');
            musicPlayIcon.classList.add('ml-0.5');
            musicEq.classList.remove('playing');
            musicCover.style.transform = 'scale(1)';
            musicCover.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3)';
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

