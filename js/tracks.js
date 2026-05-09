// js/tracks.js - универсальная версия для всех страниц

const TRACKS_KEY = 'myzon_tracks';

const TracksService = {
    // Базовые треки для демонстрации
    defaultTracks: [
        {
            id: 1,
            title: "Carefree",
            artist: "Kevin MacLeod",
            artistId: null,
            genre: "pop",
            duration: "3:25",
            cover: "assets/covers/cover.jpg",
            audioUrl: "assets/music/track1.mp3",
            plays: 1250,
            createdAt: "2024-01-01T00:00:00.000Z"
        },
        {
            id: 2,
            title: "Colorful Flowers",
            artist: "Tokyo Music Walker",
            artistId: null,
            genre: "rock",
            duration: "4:03",
            cover: "assets/covers/cover.jpg",
            audioUrl: "assets/music/track2.mp3",
            plays: 890,
            createdAt: "2024-01-01T00:00:00.000Z"
        },
        {
            id: 3,
            title: "Evening Improvisation",
            artist: "Spheria",
            artistId: null,
            genre: "jazz",
            duration: "2:49",
            cover: "assets/covers/cover.jpg",
            audioUrl: "assets/music/track3.mp3",
            plays: 2340,
            createdAt: "2024-01-01T00:00:00.000Z"
        },
        {
            id: 4,
            title: "Expedition",
            artist: "Alex-Productions",
            artistId: null,
            genre: "pop",
            duration: "2:28",
            cover: "assets/covers/cover.jpg",
            audioUrl: "assets/music/track4.mp3",
            plays: 567,
            createdAt: "2024-01-01T00:00:00.000Z"
        },
        {
            id: 5,
            title: "Film",
            artist: "Alex-Productions",
            artistId: null,
            genre: "electronic",
            duration: "4:13",
            cover: "assets/covers/cover.jpg",
            audioUrl: "assets/music/track5.mp3",
            plays: 432,
            createdAt: "2024-01-01T00:00:00.000Z"
        }
    ],

    // Получить все треки (с правильными путями)
    getAllTracks() {
        const userTracks = JSON.parse(localStorage.getItem(TRACKS_KEY) || '[]');
        const allTracks = [...this.defaultTracks, ...userTracks];
        return allTracks;
    },

    // Сохранить пользовательские треки
    saveUserTracks(tracks) {
        localStorage.setItem(TRACKS_KEY, JSON.stringify(tracks));
    },

    // Получить треки артиста по его ID
    getTracksByArtist(artistId) {
        const allTracks = this.getAllTracks();
        return allTracks.filter(track => track.artistId === artistId);
    },

    // Универсальный метод для получения правильного пути
    getFullPath(relativePath) {
        const path = window.location.pathname;
        if (path.includes('/pages/')) {
            return '../' + relativePath;
        }
        return relativePath;
    },

    async getTracks(filters = {}) {
        let tracks = [...this.getAllTracks()];
        
        tracks = tracks.map(track => ({
            ...track,
            cover: this.getFullPath(track.cover),
            audioUrl: this.getFullPath(track.audioUrl)
        }));
        
        if (filters.genre && filters.genre !== 'all') {
            tracks = tracks.filter(track => track.genre === filters.genre);
        }
        
        if (filters.search && filters.search.trim()) {
            const searchLower = filters.search.toLowerCase().trim();
            tracks = tracks.filter(track => 
                track.title.toLowerCase().includes(searchLower) ||
                track.artist.toLowerCase().includes(searchLower)
            );
        }
        
        return tracks;
    },

    async getTrackById(id) {
        const tracks = await this.getTracks();
        return tracks.find(track => track.id === parseInt(id));
    },

    async getPopularTracks(limit = 5) {
        const tracks = await this.getTracks();
        return tracks.sort((a, b) => (b.plays || 0) - (a.plays || 0)).slice(0, limit);
    },

    // Создать новый трек (для артиста)
    createTrack(trackData) {
		const pendingTracks = JSON.parse(localStorage.getItem('myzon_pending_tracks') || '[]');
		
		const newTrack = {
			id: Date.now(),
			...trackData,
			status: 'pending',  // на модерации
			plays: 0,
			createdAt: new Date().toISOString()
		};
		
		pendingTracks.push(newTrack);
		localStorage.setItem('myzon_pending_tracks', JSON.stringify(pendingTracks));
		
		alert('Трек отправлен на модерацию! После проверки он появится в каталоге.');
		return newTrack;
	},

    // Удалить трек
    deleteTrack(trackId, artistId) {
        let userTracks = JSON.parse(localStorage.getItem(TRACKS_KEY) || '[]');
        const track = userTracks.find(t => t.id === trackId);
        
        if (track && track.artistId === artistId) {
            userTracks = userTracks.filter(t => t.id !== trackId);
            this.saveUserTracks(userTracks);
            return true;
        }
        return false;
    },

    // Обновить количество прослушиваний
    incrementPlays(trackId) {
        const allTracks = this.getAllTracks();
        const track = allTracks.find(t => t.id === trackId);
        if (track) {
            track.plays = (track.plays || 0) + 1;
            // Сохраняем обновление для пользовательских треков
            if (track.artistId) {
                const userTracks = JSON.parse(localStorage.getItem(TRACKS_KEY) || '[]');
                const userTrackIndex = userTracks.findIndex(t => t.id === trackId);
                if (userTrackIndex !== -1) {
                    userTracks[userTrackIndex].plays = track.plays;
                    this.saveUserTracks(userTracks);
                }
            }
        }
    }
};