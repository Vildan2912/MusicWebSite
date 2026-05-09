// js/playlists.js

const PLAYLISTS_KEY = 'myzon_playlists';

class PlaylistsService {
    // Получить все плейлисты текущего пользователя
    static getPlaylists() {
        const user = AuthService.getUser();
        if (!user) return [];
        
        const allPlaylists = JSON.parse(localStorage.getItem(PLAYLISTS_KEY) || '{}');
        return allPlaylists[user.id] || [];
    }
    
    // Сохранить все плейлисты
    static savePlaylists(playlists) {
        const user = AuthService.getUser();
        if (!user) return false;
        
        const allPlaylists = JSON.parse(localStorage.getItem(PLAYLISTS_KEY) || '{}');
        allPlaylists[user.id] = playlists;
        localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(allPlaylists));
        return true;
    }
    
    // Получить плейлист по ID
    static getPlaylistById(playlistId) {
        const playlists = this.getPlaylists();
        return playlists.find(p => p.id === parseInt(playlistId));
    }
    
    // Создать новый плейлист
    static createPlaylist(name, description = '') {
        const playlists = this.getPlaylists();
        
        const newPlaylist = {
            id: Date.now(),
            name: name.trim(),
            description: description.trim(),
            cover: '../assets/covers/cover.jpg',
            tracks: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        playlists.unshift(newPlaylist);
        this.savePlaylists(playlists);
        return newPlaylist;
    }
    
    // Обновить плейлист
    static updatePlaylist(playlistId, updates) {
        const playlists = this.getPlaylists();
        const index = playlists.findIndex(p => p.id === parseInt(playlistId));
        
        if (index === -1) return null;
        
        playlists[index] = {
            ...playlists[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        
        this.savePlaylists(playlists);
        return playlists[index];
    }
    
    // Удалить плейлист
    static deletePlaylist(playlistId) {
        let playlists = this.getPlaylists();
        playlists = playlists.filter(p => p.id !== parseInt(playlistId));
        this.savePlaylists(playlists);
        return true;
    }
    
    // Добавить трек в плейлист
    static addTrackToPlaylist(playlistId, track) {
        const playlists = this.getPlaylists();
        const playlistIndex = playlists.findIndex(p => p.id === parseInt(playlistId));
        
        if (playlistIndex === -1) return false;
        
        // Проверяем, нет ли уже такого трека
        const trackExists = playlists[playlistIndex].tracks.some(t => t.id === track.id);
        if (trackExists) return false;
        
        playlists[playlistIndex].tracks.push(track);
        playlists[playlistIndex].updatedAt = new Date().toISOString();
        
        this.savePlaylists(playlists);
        return true;
    }
    
    // Удалить трек из плейлиста
    static removeTrackFromPlaylist(playlistId, trackId) {
        const playlists = this.getPlaylists();
        const playlistIndex = playlists.findIndex(p => p.id === parseInt(playlistId));
        
        if (playlistIndex === -1) return false;
        
        playlists[playlistIndex].tracks = playlists[playlistIndex].tracks.filter(t => t.id !== parseInt(trackId));
        playlists[playlistIndex].updatedAt = new Date().toISOString();
        
        this.savePlaylists(playlists);
        return true;
    }
    
    // Переместить трек в плейлисте
    static reorderTracks(playlistId, fromIndex, toIndex) {
        const playlists = this.getPlaylists();
        const playlistIndex = playlists.findIndex(p => p.id === parseInt(playlistId));
        
        if (playlistIndex === -1) return false;
        
        const tracks = [...playlists[playlistIndex].tracks];
        const [movedTrack] = tracks.splice(fromIndex, 1);
        tracks.splice(toIndex, 0, movedTrack);
        
        playlists[playlistIndex].tracks = tracks;
        playlists[playlistIndex].updatedAt = new Date().toISOString();
        
        this.savePlaylists(playlists);
        return true;
    }
}