const express = require('express');
const pool = require('../db');
const authenticate = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/playlists — мои плейлисты
router.get('/', async (req, res) => {
    try {
        const [playlists] = await pool.execute(
            `SELECT p.id, p.title, p.description, p.created_at, p.updated_at FROM playlists p
             JOIN user_playlists up ON p.id = up.playlist_id
             WHERE up.user_id = ?`,
            [req.user.id]
        );

        for (const playlist of playlists) {
            const [tracks] = await pool.execute(
                `SELECT t.id, t.title, t.artist, t.genre, t.duration, pt.position
                 FROM playlist_tracks pt
                 JOIN tracks t ON pt.track_id = t.id
                 WHERE pt.playlist_id = ?
                 ORDER BY pt.position`,
                [playlist.id]
            );
            playlist.tracks = tracks;
            playlist.cover = null;
        }
        
        res.json(playlists);
    } catch (err) {
        console.error('Error in GET /playlists:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/playlists — создать плейлист
router.post('/', async (req, res) => {
    try {
        const { name, description } = req.body;
        console.log('Creating playlist:', name, 'for user:', req.user.id);
        
        if (!name) {
            return res.status(400).json({ error: 'Название обязательно' });
        }

        const [result] = await pool.execute(
            'INSERT INTO playlists (title, description) VALUES (?, ?)',
            [name, description || '']
        );
        const playlistId = result.insertId;

        await pool.execute(
            'INSERT INTO user_playlists (user_id, playlist_id) VALUES (?, ?)',
            [req.user.id, playlistId]
        );

        res.status(201).json({ 
            id: playlistId, 
            name: name, 
            description: description || '', 
            tracks: [] 
        });
    } catch (err) {
        console.error('Error in POST /playlists:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/playlists/:id — обновить плейлист
router.put('/:id', async (req, res) => {
    try {
        const playlistId = req.params.id;
        const { name, description } = req.body;
        
        const [check] = await pool.execute(
            'SELECT 1 FROM user_playlists WHERE user_id = ? AND playlist_id = ?',
            [req.user.id, playlistId]
        );
        if (check.length === 0) {
            return res.status(403).json({ error: 'Нет доступа' });
        }
        
        await pool.execute(
            'UPDATE playlists SET title = ?, description = ? WHERE id = ?',
            [name, description || '', playlistId]
        );
        
        res.json({ success: true });
    } catch (err) {
        console.error('Error in PUT /playlists/:id:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/playlists/:id/reorder — переместить трек
router.put('/:id/reorder', async (req, res) => {
    try {
        const playlistId = req.params.id;
        const { fromIndex, toIndex } = req.body;
        
        const [check] = await pool.execute(
            'SELECT 1 FROM user_playlists WHERE user_id = ? AND playlist_id = ?',
            [req.user.id, playlistId]
        );
        if (check.length === 0) {
            return res.status(403).json({ error: 'Нет доступа' });
        }
        
        const [tracks] = await pool.execute(
            'SELECT id FROM playlist_tracks WHERE playlist_id = ? ORDER BY position',
            [playlistId]
        );
        
        if (fromIndex < 0 || toIndex < 0 || fromIndex >= tracks.length || toIndex >= tracks.length) {
            return res.status(400).json({ error: 'Некорректные индексы' });
        }
        
        const [moved] = tracks.splice(fromIndex, 1);
        tracks.splice(toIndex, 0, moved);
        
        for (let i = 0; i < tracks.length; i++) {
            await pool.execute('UPDATE playlist_tracks SET position = ? WHERE id = ?', [i, tracks[i].id]);
        }
        
        res.json({ success: true });
    } catch (err) {
        console.error('Error in PUT /playlists/:id/reorder:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/playlists/:id — удалить плейлист
router.delete('/:id', async (req, res) => {
    try {
        const playlistId = req.params.id;
        
        const [check] = await pool.execute(
            'SELECT 1 FROM user_playlists WHERE user_id = ? AND playlist_id = ?',
            [req.user.id, playlistId]
        );
        if (check.length === 0) {
            return res.status(403).json({ error: 'Нет доступа' });
        }

        await pool.execute('DELETE FROM playlist_tracks WHERE playlist_id = ?', [playlistId]);
        await pool.execute('DELETE FROM user_playlists WHERE playlist_id = ?', [playlistId]);
        await pool.execute('DELETE FROM playlists WHERE id = ?', [playlistId]);
        
        res.json({ success: true });
    } catch (err) {
        console.error('Error in DELETE /playlists/:id:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/playlists/:id/tracks — добавить трек в плейлист
router.post('/:id/tracks', async (req, res) => {
    try {
        const playlistId = req.params.id;
        const { trackId } = req.body;

        const [check] = await pool.execute(
            'SELECT 1 FROM user_playlists WHERE user_id = ? AND playlist_id = ?',
            [req.user.id, playlistId]
        );
        if (check.length === 0) {
            return res.status(403).json({ error: 'Нет доступа' });
        }

        const [maxPos] = await pool.execute(
            'SELECT MAX(position) as maxPos FROM playlist_tracks WHERE playlist_id = ?',
            [playlistId]
        );
        const nextPos = (maxPos[0].maxPos || 0) + 1;

        await pool.execute(
            'INSERT INTO playlist_tracks (playlist_id, track_id, position) VALUES (?, ?, ?)',
            [playlistId, trackId, nextPos]
        );

        res.json({ success: true });
    } catch (err) {
        console.error('Error in POST /playlists/:id/tracks:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/playlists/:id/tracks/:trackId — удалить трек из плейлиста
router.delete('/:id/tracks/:trackId', async (req, res) => {
    try {
        const playlistId = req.params.id;
        const trackId = req.params.trackId;

        const [check] = await pool.execute(
            'SELECT 1 FROM user_playlists WHERE user_id = ? AND playlist_id = ?',
            [req.user.id, playlistId]
        );
        if (check.length === 0) {
            return res.status(403).json({ error: 'Нет доступа' });
        }

        await pool.execute(
            'DELETE FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?',
            [playlistId, trackId]
        );

        const [tracks] = await pool.execute(
            'SELECT id FROM playlist_tracks WHERE playlist_id = ? ORDER BY position',
            [playlistId]
        );
        for (let i = 0; i < tracks.length; i++) {
            await pool.execute('UPDATE playlist_tracks SET position = ? WHERE id = ?', [i, tracks[i].id]);
        }

        res.json({ success: true });
    } catch (err) {
        console.error('Error in DELETE /playlists/:id/tracks/:trackId:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;