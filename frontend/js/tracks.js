// js/tracks.js - универсальная версия для всех страниц

const TracksService = {
    tracksData: [
        {
            id: 1,
            title: "Carefree",
            artist: "Kevin MacLeod",
            genre: "pop",
            duration: "3:25",
            cover: "assets/covers/cover.jpg",
            audioUrl: "assets/music/track1.mp3"
        },
        {
            id: 2,
            title: "Colorful Flowers",
            artist: "Tokyo Music Walker",
            genre: "rock",
            duration: "4:03",
            cover: "assets/covers/cover.jpg",
            audioUrl: "assets/music/track2.mp3"
        },
        {
            id: 3,
            title: "Evening Improvisation",
            artist: "Spheria",
            genre: "jazz",
            duration: "2:49",
            cover: "assets/covers/cover.jpg",
            audioUrl: "assets/music/track3.mp3"
        },
        {
            id: 4,
            title: "Expedition",
            artist: "Alex-Productions",
            genre: "pop",
            duration: "2:28",
            cover: "assets/covers/cover.jpg",
            audioUrl: "assets/music/track4.mp3"
        },
        {
            id: 5,
            title: "Film",
            artist: "Alex-Productions",
            genre: "electronic",
            duration: "4:13",
            cover: "assets/covers/cover.jpg",
            audioUrl: "assets/music/track5.mp3"
        },
        {
            id: 6,
            title: "Happy Clappy Ukulele",
            artist: "Shane Ivers",
            genre: "rock",
            duration: "3:09",
            cover: "assets/covers/cover.jpg",
            audioUrl: "assets/music/track6.mp3"
        },
        {
            id: 7,
            title: "Journey",
            artist: "Roa",
            genre: "classical",
            duration: "3:32",
            cover: "assets/covers/cover.jpg",
            audioUrl: "assets/music/track7.mp3"
        },
        {
            id: 8,
            title: "Tropical Soul",
            artist: "Luke Bergs",
            genre: "pop",
            duration: "3:08",
            cover: "assets/covers/cover.jpg",
            audioUrl: "assets/music/track8.mp3"
        },
        {
            id: 9,
            title: "Powerful",
            artist: "MaxKoMusic",
            genre: "jazz",
            duration: "2:43",
            cover: "assets/covers/cover.jpg",
            audioUrl: "assets/music/track9.mp3"
        },
        {
            id: 10,
            title: "Summer Madness",
            artist: "Roa",
            genre: "electronic",
            duration: "3:44",
            cover: "assets/covers/cover.jpg",
            audioUrl: "assets/music/track10.mp3"
        },
        {
            id: 11,
            title: "Adrift Among Infinite Stars",
            artist: "Scott Buckley",
            genre: "rock",
            duration: "6:45",
            cover: "assets/covers/cover.jpg",
            audioUrl: "assets/music/track11.mp3"
        },
        {
            id: 12,
            title: "Moonlight",
            artist: "Scott Buckley",
            genre: "pop",
            duration: "4:14",
            cover: "assets/covers/cover.jpg",
            audioUrl: "assets/music/track12.mp3"
        },
        {
            id: 13,
            title: "Spring Flowers",
            artist: "Keys of Moon",
            genre: "classical",
            duration: "3:33",
            cover: "assets/covers/cover.jpg",
            audioUrl: "assets/music/track13.mp3"
        }
    ],

    // Универсальный метод для получения правильного пути
    getFullPath(relativePath) {
        // Определяем, на какой странице мы находимся
        const path = window.location.pathname;
        
        // Если мы в папке pages (путь содержит /pages/), нужно выйти на уровень выше
        if (path.includes('/pages/')) {
            return '../' + relativePath;
        }
        
        // Иначе мы в корне
        return relativePath;
    },

    async getTracks(filters = {}) {
        let tracks = [...this.tracksData];
        
        // Обновляем пути для текущей страницы
        tracks = tracks.map(track => ({
            ...track,
            cover: this.getFullPath(track.cover),
            audioUrl: this.getFullPath(track.audioUrl)
        }));
        
        // Фильтр по жанру
        if (filters.genre && filters.genre !== 'all') {
            tracks = tracks.filter(track => track.genre === filters.genre);
        }
        
        // Фильтр по поиску
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
        return tracks.slice(0, limit);
    }
};