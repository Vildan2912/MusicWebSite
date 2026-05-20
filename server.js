require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const pool = require('./db');
const fs = require('fs');
const path = require('path');
const authenticate = require('./middleware/auth');

const authRoutes = require('./routes/auth');
const trackRoutes = require('./routes/tracks');
const playlistRoutes = require('./routes/playlists');

const app = express();

app.use(cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/tracks', trackRoutes);
app.use('/api/playlists', playlistRoutes);

// Админские эндпоинты
app.get('/api/admin/users', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT id, username, email, role FROM users');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/admin/users/:id/role', async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        await pool.execute('UPDATE users SET role = ? WHERE id = ?', [role, id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/admin/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // Проверяем токен, чтобы админ не удалил сам себя
        const authHeader = req.headers.authorization;
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (parseInt(id) === decoded.id) {
            return res.status(403).json({ error: 'Нельзя удалить самого себя' });
        }
        
        await pool.execute('DELETE FROM users WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// PUT /api/users/:id — обновление профиля пользователя
app.put('/api/users/:id', authenticate, async (req, res) => {
    try {
        const userId = req.params.id;
        const { username, email, password } = req.body;
        
        // Проверяем, что пользователь обновляет свой профиль
        if (parseInt(userId) !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Нет прав' });
        }
        
        let query = 'UPDATE users SET username = ?, email = ?';
        const params = [username, email];
        
        if (password) {
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash(password, 10);
            query += ', password = ?';
            params.push(hashedPassword);
        }
        
        query += ' WHERE id = ?';
        params.push(userId);
        
        await pool.execute(query, params);
        
        res.json({ success: true, message: 'Профиль обновлён' });
    } catch (err) {
        console.error('Error updating user:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server listening on port ${PORT}`);
});