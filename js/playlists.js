// js/playlists.js - работа с API плейлистов
// const API_URL = 'http://localhost:3000/api';

class PlaylistsService {
    static getAuthHeaders() {
        const token = AuthService.getToken();
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    }

    static async getPlaylists() {
		try {
			const response = await fetch(`${API_URL}/playlists`, {
				headers: this.getAuthHeaders()
			});
			const data = await response.json();
			
			if (Array.isArray(data)) {
				// Добавляем audioUrl и cover для каждого трека в каждом плейлисте
				return data.map(playlist => ({
					...playlist,
					tracks: (playlist.tracks || []).map(track => ({
						...track,
						audioUrl: `${API_URL}/tracks/${track.id}/audio`,
						cover: `${API_URL}/tracks/${track.id}/cover`
					}))
				}));
			}
			if (data && Array.isArray(data.data)) {
				return data.data;
			}
			return [];
		} catch (error) {
			console.error('Ошибка загрузки плейлистов:', error);
			return [];
		}
	}

    static async getPlaylistById(playlistId) {
        try {
            const playlists = await this.getPlaylists();
            return playlists.find(p => p.id === parseInt(playlistId));
        } catch (error) {
            console.error('Ошибка загрузки плейлиста:', error);
            return null;
        }
    }

    static async createPlaylist(name, description = '') {
        try {
            const response = await fetch(`${API_URL}/playlists`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({ name, description })
            });
            return await response.json();
        } catch (error) {
            console.error('Ошибка создания плейлиста:', error);
            return null;
        }
    }

    static async updatePlaylist(playlistId, updates) {
        try {
            const response = await fetch(`${API_URL}/playlists/${playlistId}`, {
                method: 'PUT',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(updates)
            });
            return await response.json();
        } catch (error) {
            console.error('Ошибка обновления плейлиста:', error);
            return null;
        }
    }

    static async deletePlaylist(playlistId) {
        try {
            const response = await fetch(`${API_URL}/playlists/${playlistId}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });
            return response.ok;
        } catch (error) {
            console.error('Ошибка удаления плейлиста:', error);
            return false;
        }
    }

    static async addTrackToPlaylist(playlistId, track) {
		try {
			if (!playlistId) {
				console.error('No playlistId provided');
				return false;
			}
			// Отправляем только ID трека, а не весь объект
			const response = await fetch(`${API_URL}/playlists/${playlistId}/tracks`, {
				method: 'POST',
				headers: this.getAuthHeaders(),
				body: JSON.stringify({ trackId: track.id })
			});
			if (!response.ok) {
				const error = await response.json();
				console.error('Server error:', error);
				return false;
			}
			return true;
		} catch (error) {
			console.error('Ошибка добавления трека:', error);
			return false;
		}
	}

    static async removeTrackFromPlaylist(playlistId, trackId) {
        try {
            const response = await fetch(`${API_URL}/playlists/${playlistId}/tracks/${trackId}`, {
                method: 'DELETE',
                headers: this.getAuthHeaders()
            });
            return response.ok;
        } catch (error) {
            console.error('Ошибка удаления трека из плейлиста:', error);
            return false;
        }
    }

    static async reorderTracks(playlistId, fromIndex, toIndex) {
        try {
            const response = await fetch(`${API_URL}/playlists/${playlistId}/reorder`, {
                method: 'PUT',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({ fromIndex, toIndex })
            });
            return response.ok;
        } catch (error) {
            console.error('Ошибка перемещения трека:', error);
            return false;
        }
    }
}