// js/tracks.js - работа с API треков (фронтенд)
// const API_URL = 'http://localhost:3000/api';

const TracksService = {
    async getTracks(filters = {}) {
		try {
			const params = new URLSearchParams();
			if (filters.genre && filters.genre !== 'all') params.append('genre', filters.genre);
			if (filters.search) params.append('search', filters.search);
			if (filters.limit) params.append('limit', filters.limit);
			
			const url = `${API_URL}/tracks${params.toString() ? '?' + params.toString() : ''}`;
			console.log('Fetching tracks with filters:', filters);
			console.log('URL:', url);
			
			const response = await fetch(url);
			if (!response.ok) {
				console.error('Server error:', response.status);
				return [];
			}
			const tracks = await response.json();
			console.log('Received tracks:', tracks.length);
			
			if (!Array.isArray(tracks)) {
				console.error('Tracks is not array:', tracks);
				return [];
			}
			
			return tracks.map(track => ({
				...track,
				cover: `${API_URL}/tracks/${track.id}/cover`,
				audioUrl: `${API_URL}/tracks/${track.id}/audio`
			}));
		} catch (error) {
			console.error('Ошибка загрузки треков:', error);
			return [];
		}
	},

    async getTrackById(id) {
        try {
            const response = await fetch(`${API_URL}/tracks/${id}`);
            const track = await response.json();
            return {
                ...track,
                cover: `${API_URL}/tracks/${track.id}/cover`,
                audioUrl: `${API_URL}/tracks/${track.id}/audio`
            };
        } catch (error) {
            console.error('Ошибка загрузки трека:', error);
            return null;
        }
    },

    async getPopularTracks(limit = 10) {
        try {
            const response = await fetch(`${API_URL}/tracks/popular?limit=${limit}`);
            const tracks = await response.json();
            return tracks.map(track => ({
                ...track,
                cover: `${API_URL}/tracks/${track.id}/cover`,
                audioUrl: `${API_URL}/tracks/${track.id}/audio`
            }));
        } catch (error) {
            console.error('Ошибка загрузки популярных треков:', error);
            return [];
        }
    },

    async createTrack(formData) {
        const token = AuthService.getToken();
        const response = await fetch(`${API_URL}/tracks`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        return response.json();
    },

    async getMyTracks() {
        const token = AuthService.getToken();
        const response = await fetch(`${API_URL}/tracks/my`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const tracks = await response.json();
        return tracks.map(track => ({
            ...track,
            cover: `${API_URL}/tracks/${track.id}/cover`,
            audioUrl: `${API_URL}/tracks/${track.id}/audio`
        }));
    },

    async deleteTrack(trackId) {
        const token = AuthService.getToken();
        const response = await fetch(`${API_URL}/tracks/${trackId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.json();
    },

    async incrementPlays(trackId) {
        try {
            await fetch(`${API_URL}/tracks/${trackId}/play`, { method: 'PUT' });
        } catch (error) {
            console.error('Ошибка увеличения счётчика:', error);
        }
    }
};