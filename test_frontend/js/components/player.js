// js/components/player.js

class AudioPlayer {
    constructor() {
        this.audio = new Audio();
        this.currentTrack = null;
        this.playlist = [];
        this.currentIndex = -1;
        this.isPlaying = false;
        this.isShuffled = false;
        this.isRepeating = false;
        this.volume = 0.7;
        this.isMinimized = false;
        
        this.init();
    }
    
    init() {
        this.audio.volume = this.volume;
        
        // События аудио
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
        this.audio.addEventListener('ended', () => this.next());
        this.audio.addEventListener('play', () => this.onPlay());
        this.audio.addEventListener('pause', () => this.onPause());
        this.audio.addEventListener('error', (e) => this.onError(e));
        
        // Создаем DOM элементы плеера
        this.createPlayerElement();
        this.createFloatingButton();
    }
    
    // Создаём плавающую кнопку для разворачивания плеера
    createFloatingButton() {
        // Проверяем, существует ли уже кнопка
        if (document.getElementById('playerFloatingBtn')) return;
        
        const floatingBtnHTML = `
            <div id="playerFloatingBtn" class="player-floating-btn" style="display: none;">
                🎵
                <span class="floating-now-playing" id="floatingNowPlaying">—</span>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', floatingBtnHTML);
        
        this.floatingBtn = document.getElementById('playerFloatingBtn');
        this.floatingNowPlaying = document.getElementById('floatingNowPlaying');
        
        // Обработчик клика по плавающей кнопке
        this.floatingBtn.addEventListener('click', () => this.restore());
    }
    
    // Обновляем текст на плавающей кнопке
    updateFloatingButton() {
        if (this.floatingNowPlaying && this.currentTrack) {
            this.floatingNowPlaying.textContent = `${this.currentTrack.title}`;
        }
    }
    
    createPlayerElement() {
        // Проверяем, существует ли уже плеер
        if (document.getElementById('globalPlayer')) return;
        
        const playerHTML = `
            <div id="globalPlayer" class="global-player">
                <div class="player-container">
                    <div class="player-info">
                        <img id="playerCover" class="player-cover" src="https://picsum.photos/id/104/60/60" alt="Cover">
                        <div class="player-track-info">
                            <div id="playerTitle" class="player-title">Не выбрано</div>
                            <div id="playerArtist" class="player-artist">--</div>
                        </div>
                    </div>
                    
                    <div class="player-controls">
                        <button id="playerPrev" class="player-btn" title="Предыдущий">⏮</button>
                        <button id="playerPlayPause" class="player-btn player-play-btn" title="Воспроизвести/Пауза">▶</button>
                        <button id="playerNext" class="player-btn" title="Следующий">⏭</button>
                    </div>
                    
                    <div class="player-progress-container">
                        <span id="playerCurrentTime" class="player-time">0:00</span>
                        <div class="player-progress-bar">
                            <div id="playerProgress" class="player-progress"></div>
                        </div>
                        <span id="playerDuration" class="player-time">0:00</span>
                    </div>
                    
                    <div class="player-extras">
                        <button id="playerShuffle" class="player-extras-btn" title="Перемешать">🔀</button>
                        <button id="playerRepeat" class="player-extras-btn" title="Повтор">🔁</button>
                        <div class="player-volume">
                            <button id="playerVolumeBtn" class="player-extras-btn" title="Звук">🔊</button>
                            <div class="player-volume-slider">
                                <input type="range" id="playerVolume" min="0" max="100" value="70">
                            </div>
                        </div>
                        <button id="playerClose" class="player-extras-btn" title="Свернуть">▼</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', playerHTML);
        
        // Получаем элементы
        this.elements = {
            cover: document.getElementById('playerCover'),
            title: document.getElementById('playerTitle'),
            artist: document.getElementById('playerArtist'),
            playPause: document.getElementById('playerPlayPause'),
            prev: document.getElementById('playerPrev'),
            next: document.getElementById('playerNext'),
            shuffle: document.getElementById('playerShuffle'),
            repeat: document.getElementById('playerRepeat'),
            volume: document.getElementById('playerVolume'),
            volumeBtn: document.getElementById('playerVolumeBtn'),
            progress: document.getElementById('playerProgress'),
            currentTime: document.getElementById('playerCurrentTime'),
            duration: document.getElementById('playerDuration'),
            close: document.getElementById('playerClose')
        };
        
        // Добавляем обработчики
        this.elements.playPause.addEventListener('click', () => this.togglePlay());
        this.elements.prev.addEventListener('click', () => this.prev());
        this.elements.next.addEventListener('click', () => this.next());
        this.elements.shuffle.addEventListener('click', () => this.toggleShuffle());
        this.elements.repeat.addEventListener('click', () => this.toggleRepeat());
        this.elements.volume.addEventListener('input', (e) => this.setVolume(e.target.value / 100));
        this.elements.volumeBtn.addEventListener('click', () => this.toggleMute());
        this.elements.progress.parentElement.addEventListener('click', (e) => this.seek(e));
        this.elements.close.addEventListener('click', () => this.toggleMinimize());
        
        // Инициализация
        this.updateVolumeIcon();
        this.updateShuffleIcon();
        this.updateRepeatIcon();
    }
    
    playTrack(track, playlist = null) {
        if (!track) return;
        
        this.currentTrack = track;
        
        if (playlist) {
            this.playlist = playlist;
            this.currentIndex = playlist.findIndex(t => t.id === track.id);
        }
        
        // Проверяем существование аудиофайла
        if (!track.audioUrl) {
            console.error('Аудиофайл не указан для трека:', track.title);
            alert(`Не удалось воспроизвести трек "${track.title}". Аудиофайл отсутствует.`);
            return;
        }
        
        this.audio.src = track.audioUrl;
        this.audio.play().catch(e => {
            console.log('Автовоспроизведение заблокировано или файл не найден:', e);
            alert(`Не удалось воспроизвести трек "${track.title}". Проверьте, что файл существует по пути: ${track.audioUrl}`);
        });
        
        this.updatePlayerInfo();
        this.showPlayer();
    }
    
    updatePlayerInfo() {
        if (this.currentTrack) {
            this.elements.title.textContent = this.currentTrack.title;
            this.elements.artist.textContent = this.currentTrack.artist;
            this.elements.cover.src = this.currentTrack.cover;
        }
    }
    
    updateProgress() {
        if (this.audio.duration) {
            const percent = (this.audio.currentTime / this.audio.duration) * 100;
            this.elements.progress.style.width = `${percent}%`;
            this.elements.currentTime.textContent = this.formatTime(this.audio.currentTime);
        }
    }
    
    updateDuration() {
        this.elements.duration.textContent = this.formatTime(this.audio.duration);
    }
    
    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    togglePlay() {
        if (!this.currentTrack) return;
        
        if (this.isPlaying) {
            this.audio.pause();
        } else {
            this.audio.play();
        }
    }
    
    onPlay() {
		this.isPlaying = true;
		if (this.elements.playPause) {
			this.elements.playPause.textContent = '⏸';
		}
		// Добавляем анимацию для плавающей кнопки
		if (this.floatingBtn) {
			this.floatingBtn.classList.add('playing');
		}
	}

	onPause() {
		this.isPlaying = false;
		if (this.elements.playPause) {
			this.elements.playPause.textContent = '▶';
		}
		// Убираем анимацию
		if (this.floatingBtn) {
			this.floatingBtn.classList.remove('playing');
		}
	}
    
    next() {
        if (this.playlist.length === 0) return;
        
        let nextIndex = this.currentIndex + 1;
        if (nextIndex >= this.playlist.length) {
            if (this.isRepeating) {
                nextIndex = 0;
            } else {
                this.pause();
                return;
            }
        }
        
        this.currentIndex = nextIndex;
        this.playTrack(this.playlist[this.currentIndex], this.playlist);
    }
    
    prev() {
        if (this.playlist.length === 0) return;
        
        // Если прошло больше 3 секунд, перематываем в начало
        if (this.audio.currentTime > 3) {
            this.audio.currentTime = 0;
            return;
        }
        
        let prevIndex = this.currentIndex - 1;
        if (prevIndex < 0) {
            if (this.isRepeating) {
                prevIndex = this.playlist.length - 1;
            } else {
                return;
            }
        }
        
        this.currentIndex = prevIndex;
        this.playTrack(this.playlist[this.currentIndex], this.playlist);
    }
    
    seek(e) {
        const bar = e.currentTarget;
        const rect = bar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        this.audio.currentTime = percent * this.audio.duration;
    }
    
    setVolume(value) {
        this.volume = value;
        this.audio.volume = value;
        this.updateVolumeIcon();
        
        if (this.elements.volume) {
            this.elements.volume.value = value * 100;
        }
    }
    
    toggleMute() {
        if (this.audio.volume > 0) {
            this.lastVolume = this.audio.volume;
            this.setVolume(0);
        } else {
            this.setVolume(this.lastVolume || 0.7);
        }
    }
    
    updateVolumeIcon() {
        if (this.elements.volumeBtn) {
            if (this.volume === 0) {
                this.elements.volumeBtn.textContent = '🔇';
            } else if (this.volume < 0.5) {
                this.elements.volumeBtn.textContent = '🔈';
            } else {
                this.elements.volumeBtn.textContent = '🔊';
            }
        }
    }
    
    toggleShuffle() {
        this.isShuffled = !this.isShuffled;
        this.updateShuffleIcon();
        
        if (this.isShuffled && this.playlist.length > 0) {
            this.shufflePlaylist();
        }
    }
    
    shufflePlaylist() {
        const shuffled = [...this.playlist];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        
        const currentTrackId = this.currentTrack?.id;
        this.playlist = shuffled;
        this.currentIndex = this.playlist.findIndex(t => t.id === currentTrackId);
    }
    
    updateShuffleIcon() {
        if (this.elements.shuffle) {
            this.elements.shuffle.style.opacity = this.isShuffled ? '1' : '0.5';
        }
    }
    
    toggleRepeat() {
        this.isRepeating = !this.isRepeating;
        this.updateRepeatIcon();
    }
    
    updateRepeatIcon() {
        if (this.elements.repeat) {
            this.elements.repeat.style.opacity = this.isRepeating ? '1' : '0.5';
        }
    }
    
    onError(e) {
        console.error('Ошибка воспроизведения:', e);
        if (this.currentTrack) {
            alert(`Ошибка воспроизведения трека "${this.currentTrack.title}". Проверьте путь к файлу: ${this.currentTrack.audioUrl}`);
        }
    }
    
    showPlayer() {
        const player = document.getElementById('globalPlayer');
        if (player) {
            player.classList.add('visible');
        }
    }
    
    // Сворачиваем плеер
    minimize() {
        const player = document.getElementById('globalPlayer');
        if (player) {
            player.classList.remove('visible');
            this.isMinimized = true;
            
            // Показываем плавающую кнопку
            if (this.floatingBtn) {
                this.floatingBtn.style.display = 'flex';
                this.updateFloatingButton();
            }
        }
    }
    
    // Разворачиваем плеер
    restore() {
        const player = document.getElementById('globalPlayer');
        if (player) {
            player.classList.add('visible');
            this.isMinimized = false;
            
            // Скрываем плавающую кнопку
            if (this.floatingBtn) {
                this.floatingBtn.style.display = 'none';
            }
        }
    }
    
    // Переключаем состояние (свернуть/развернуть)
    toggleMinimize() {
        if (this.isMinimized) {
            this.restore();
        } else {
            this.minimize();
        }
    }
    
    // Обновляем информацию о треке в плеере (добавляем обновление плавающей кнопки)
    updatePlayerInfo() {
        if (this.currentTrack) {
            this.elements.title.textContent = this.currentTrack.title;
            this.elements.artist.textContent = this.currentTrack.artist;
            this.elements.cover.src = this.currentTrack.cover;
            this.updateFloatingButton(); // Обновляем плавающую кнопку
        }
    }
    
    pause() {
        this.audio.pause();
    }
}

// Глобальный экземпляр плеера
window.player = new AudioPlayer();