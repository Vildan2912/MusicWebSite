const express = require('express');
const multer = require('multer');
const pool = require('../db');
const authenticate = require('../middleware/auth');

const router = express.Router();

// Настройка multer для загрузки файлов
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        if (file.fieldname === 'audio') {
            if (file.mimetype === 'audio/mpeg' || file.mimetype === 'audio/mp3') {
                cb(null, true);
            } else {
                cb(new Error('Только MP3 файлы'), false);
            }
        } else if (file.fieldname === 'cover') {
            if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/webp') {
                cb(null, true);
            } else {
                cb(new Error('Только JPEG, PNG, WEBP'), false);
            }
        } else {
            cb(null, true);
        }
    }
});

// ========== СПЕЦИФИЧНЫЕ МАРШРУТЫ (БЕЗ ПАРАМЕТРОВ) ==========

// GET /api/tracks — каталог (упрощённая версия без пагинации)
router.get('/', async (req, res) => {
    try {
        const { genre, search } = req.query;
        
        let sql = 'SELECT id, title, artist, genre, duration, plays, created_at, status FROM tracks WHERE status = "approved"';
        let params = [];
        let conditions = [];

        if (genre && genre !== 'all') {
            conditions.push('genre = ?');
            params.push(genre);
        }
        if (search && search.trim()) {
            conditions.push('(title LIKE ? OR artist LIKE ?)');
            params.push(`%${search}%`, `%${search}%`);
        }
        
        if (conditions.length > 0) {
            sql += ' AND ' + conditions.join(' AND ');
        }
        
        sql += ' ORDER BY created_at DESC';
        
        const [rows] = await pool.execute(sql, params);
        res.json(rows);
    } catch (err) {
        console.error('Error in GET /tracks:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/tracks/popular — популярные треки
router.get('/popular', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT id, title, artist, genre, duration, plays FROM tracks WHERE status = "approved" ORDER BY plays DESC LIMIT 10'
        );
        res.json(rows);
    } catch (err) {
        console.error('Error in GET /tracks/popular:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/tracks/pending — треки на модерации (только для админа)
router.get('/pending', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Доступ запрещён' });
        }
        
        const [rows] = await pool.execute(
            `SELECT t.*, u.username as artist_name 
             FROM tracks t
             LEFT JOIN users u ON t.artist_id = u.id
             WHERE t.status = 'pending' OR t.status IS NULL
             ORDER BY t.created_at DESC`
        );
        res.json(rows);
    } catch (err) {
        console.error('Error in GET /tracks/pending:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/tracks/my — мои треки (для артиста)
router.get('/my', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'artist') {
            return res.status(403).json({ success: false, message: 'Доступ только для артистов' });
        }
        const [rows] = await pool.execute(
            'SELECT id, title, artist, genre, duration, plays, created_at, status FROM tracks WHERE artist_id = ? ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json(rows);
    } catch (err) {
        console.error('Error in GET /tracks/my:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/tracks — загрузка нового трека (только для artist и admin)
router.post('/', authenticate, upload.fields([{ name: 'audio', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), async (req, res) => {
    try {
        if (req.user.role !== 'artist' && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Только артисты и админы могут загружать треки' });
        }

        const { title, artist, genre, duration } = req.body;
        if (!title || !artist || !genre || !duration) {
            return res.status(400).json({ success: false, message: 'Все поля обязательны' });
        }
        if (!req.files?.audio) {
            return res.status(400).json({ success: false, message: 'Аудиофайл обязателен' });
        }

        const audioData = req.files.audio[0].buffer;
        const coverData = req.files.cover ? req.files.cover[0].buffer : null;

        // Статус: для админа сразу approved, для артиста pending
        const status = req.user.role === 'admin' ? 'approved' : 'pending';

        const [result] = await pool.execute(
            'INSERT INTO tracks (title, artist, artist_id, genre, duration, audio_data, cover_data, plays, status) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)',
            [title, artist, req.user.id, genre, duration, audioData, coverData, status]
        );

        res.status(201).json({
            success: true,
            data: { id: result.insertId, title, artist, genre, duration, artist_id: req.user.id, status }
        });
    } catch (err) {
        console.error('Error in POST /tracks:', err);
        res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
});

// POST /api/tracks/:id/moderate — одобрить/отклонить трек (только для админа)
router.post('/:id/moderate', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Доступ запрещён' });
        }
        
        const { status, comment } = req.body;
        if (!status || !['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Неверный статус' });
        }
        
        await pool.execute(
            `UPDATE tracks 
             SET status = ?, moderation_comment = ?, moderated_at = NOW(), moderated_by = ?
             WHERE id = ?`,
            [status, comment || null, req.user.id, req.params.id]
        );
        
        res.json({ success: true, message: `Трек ${status === 'approved' ? 'одобрен' : 'отклонён'}` });
    } catch (err) {
        console.error('Error in POST /tracks/:id/moderate:', err);
        res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
});

// PUT /api/tracks/:id/play — увеличить счётчик прослушиваний
router.put('/:id/play', async (req, res) => {
    try {
        await pool.execute('UPDATE tracks SET plays = plays + 1 WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error('Error in PUT /tracks/:id/play:', err);
        res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
});

// DELETE /api/tracks/:id — удалить трек (только владелец или админ)
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const [track] = await pool.execute('SELECT artist_id, status FROM tracks WHERE id = ?', [req.params.id]);
        if (track.length === 0) {
            return res.status(404).json({ success: false, message: 'Трек не найден' });
        }
        if (track[0].artist_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Нет прав на удаление' });
        }
        await pool.execute('DELETE FROM tracks WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error('Error in DELETE /tracks/:id:', err);
        res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
});

// GET /api/tracks/:id — детали трека
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT id, title, artist, genre, duration, plays, artist_id, created_at, status FROM tracks WHERE id = ?',
            [req.params.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Трек не найден' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error('Error in GET /tracks/:id:', err);
        res.status(500).json({ success: false, message: 'Ошибка сервера' });
    }
});

// GET /api/tracks/:id/audio — стриминг аудио
router.get('/:id/audio', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT audio_data FROM tracks WHERE id = ?', [req.params.id]);
        if (rows.length === 0 || !rows[0].audio_data) {
            return res.status(404).send('Audio not found');
        }
        res.setHeader('Content-Type', 'audio/mpeg');
        res.send(rows[0].audio_data);
    } catch (err) {
        console.error('Error in GET /tracks/:id/audio:', err);
        res.status(500).send('Server error');
    }
});

// GET /api/tracks/:id/cover — обложка трека
router.get('/:id/cover', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT cover_data FROM tracks WHERE id = ?', [req.params.id]);
        if (rows.length > 0 && rows[0].cover_data) {
            res.setHeader('Content-Type', 'image/jpeg');
            return res.send(rows[0].cover_data);
        }
        
        const fs = require('fs');
        const path = require('path');
        const defaultCoverPath = path.join(__dirname, '../../frontend/assets/covers/cover.jpg');
        
        if (fs.existsSync(defaultCoverPath)) {
            const defaultCover = fs.readFileSync(defaultCoverPath);
            res.setHeader('Content-Type', 'image/jpeg');
            return res.send(defaultCover);
        }
        
        res.status(404).send('Cover not found');
    } catch (err) {
        console.error('Error in GET /tracks/:id/cover:', err);
        res.status(500).send('Server error');
    }
});

module.exports = router;