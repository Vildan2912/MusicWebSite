// tests/setup.js
const express = require('express');
const multiparty = require('multiparty');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Мок-данные
let users = [];
let tracks = [];
let playlists = [];
let nextUserId = 1;
let nextTrackId = 1;
let nextPlaylistId = 1;

// Добавляем админа по умолчанию
users.push({ id: nextUserId++, username: 'admin', email: 'admin@example.com', role: 'admin' });

// Аутентификация
// Регистрация
app.post('/api/auth/register', (req, res) => {
  const { username, email, password, confirmPassword, role = 'listener' } = req.body;
  
  if (!username || !email || !password || !confirmPassword) {
    return res.status(400).json({ success: false, message: 'Все поля обязательны' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ success: false, message: 'Пароли не совпадают' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Пароль должен быть минимум 6 символов' });
  }
  if (users.find(u => u.email === email)) {
    return res.status(409).json({ success: false, message: 'Пользователь уже существует' });
  }
  
  const newUser = { id: nextUserId++, username, email, role };
  users.push(newUser);
  
  res.status(201).json({ 
    success: true, 
    data: { user: newUser, message: 'Регистрация прошла успешно!' }
  });
});

// Логин
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email и пароль обязательны' });
  }
  
  const user = users.find(u => u.email === email);
  if (!user || password !== '123456') {
    return res.status(401).json({ success: false, message: 'Неверный email или пароль' });
  }
  
  let token = 'fake-jwt-token';
  if (user.role === 'admin') token = 'admin-token';
  if (user.role === 'artist') token = 'artist-token';
  if (user.email === 'other@example.com') token = 'other-token';
  
  res.json({ 
    success: true, 
    data: { 
      token: token, 
      user: user 
    }
  });
});

// ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ ПАРСИНГА MULTIPART
function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const form = new multiparty.Form();
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

// Треки
// Получение списка треков
app.get('/api/tracks', (req, res) => {
  const { genre, search } = req.query;
  let result = tracks.filter(t => t.status === 'approved' || t.status === 'pending');
  
  if (genre && genre !== 'all') {
    result = result.filter(t => t.genre === genre);
  }
  if (search) {
    const searchLower = search.toLowerCase();
    result = result.filter(t => 
      t.title.toLowerCase().includes(searchLower) || 
      t.artist.toLowerCase().includes(searchLower)
    );
  }
  
  res.json(result);
});

// Популярные треки
app.get('/api/tracks/popular', (req, res) => {
  const popular = [...tracks].sort((a, b) => (b.plays || 0) - (a.plays || 0)).slice(0, 10);
  res.json(popular);
});

// Мои треки (для артиста)
app.get('/api/tracks/my', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'Требуется авторизация' });
  }
  
  const token = authHeader.split(' ')[1];
  
  // Для artist-token (артист) - возвращаем 200 и список треков
  if (token === 'artist-token') {
    const myTracks = tracks.filter(t => t.artist === 'Test Artist');
    return res.status(200).json(myTracks);
  }
  
  // Для fake-jwt-token (обычный слушатель) - возвращаем 403
  if (token === 'fake-jwt-token') {
    return res.status(403).json({ success: false, message: 'Доступ только для артистов' });
  }
  
  // Для всех остальных случаев
  return res.status(401).json({ success: false, message: 'Неверный токен' });
});

// Загрузка трека (с поддержкой multipart)
app.post('/api/tracks', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'Требуется авторизация' });
  }
  
  let title, artist, genre, duration;
  let hasAudio = false;
  
  // Проверяем, пришли ли данные как multipart
  if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
    try {
      const { fields, files } = await parseMultipart(req);
      title = fields.title?.[0];
      artist = fields.artist?.[0];
      genre = fields.genre?.[0];
      duration = fields.duration?.[0];
      hasAudio = files.audio && files.audio.length > 0;
    } catch (err) {
      return res.status(400).json({ success: false, message: 'Ошибка парсинга формы' });
    }
  } else {
    // Обычный JSON
    title = req.body.title;
    artist = req.body.artist;
    genre = req.body.genre;
    duration = req.body.duration;
    hasAudio = !!req.body.audio;
  }
  
  if (!title || !artist || !genre || !duration) {
    return res.status(400).json({ success: false, message: 'Все поля обязательны' });
  }
  
  if (!hasAudio) {
    return res.status(400).json({ success: false, message: 'Аудиофайл обязателен' });
  }
  
  const newTrack = {
    id: nextTrackId++,
    title,
    artist,
    genre,
    duration,
    plays: 0,
    status: 'pending',
    created_at: new Date().toISOString()
  };
  tracks.push(newTrack);
  
  res.status(201).json({ 
    success: true, 
    data: { id: newTrack.id, status: 'pending' }
  });
});

// Получение трека по ID
app.get('/api/tracks/:id', (req, res) => {
  const track = tracks.find(t => t.id === parseInt(req.params.id));
  if (!track) {
    return res.status(404).json({ success: false, message: 'Трек не найден' });
  }
  res.json(track);
});

// Получение аудио
app.get('/api/tracks/:id/audio', (req, res) => {
  const track = tracks.find(t => t.id === parseInt(req.params.id));
  if (!track) {
    return res.status(404).send('Audio not found');
  }
  res.setHeader('Content-Type', 'audio/mpeg');
  res.send(Buffer.from('fake audio data'));
});

// Увеличение счётчика прослушиваний
app.put('/api/tracks/:id/play', (req, res) => {
  const track = tracks.find(t => t.id === parseInt(req.params.id));
  if (track) {
    track.plays = (track.plays || 0) + 1;
  }
  res.json({ success: true });
});

// Плейлисты
// Создание плейлиста
app.post('/api/playlists', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { name, description } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Название обязательно' });
  }
  
  const newPlaylist = {
    id: nextPlaylistId++,
    name,
    description: description || '',
    tracks: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  playlists.push(newPlaylist);
  
  res.status(201).json(newPlaylist);
});

// Получение плейлистов пользователя
app.get('/api/playlists', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  res.json(playlists.map(p => ({ ...p, tracks: [] })));
});

// Обновление плейлиста
app.put('/api/playlists/:id', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const token = authHeader.split(' ')[1];
  const playlistId = parseInt(req.params.id);
  const playlist = playlists.find(p => p.id === playlistId);
  
  if (!playlist) {
    return res.status(404).json({ error: 'Not found' });
  }
  
  if (token === 'other-token') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  const { name, description } = req.body;
  if (name) playlist.name = name;
  if (description) playlist.description = description;
  
  res.json({ success: true });
});

// Добавление трека в плейлист
app.post('/api/playlists/:id/tracks', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.json({ success: true });
});

// Удаление трека из плейлиста
app.delete('/api/playlists/:id/tracks/:trackId', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.json({ success: true });
});

// Удаление плейлиста
app.delete('/api/playlists/:id', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const playlistId = parseInt(req.params.id);
  const index = playlists.findIndex(p => p.id === playlistId);
  if (index !== -1) {
    playlists.splice(index, 1);
  }
  
  res.json({ success: true });
});

// Админ
// Получение всех пользователей
app.get('/api/admin/users', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const token = authHeader.split(' ')[1];
  if (token !== 'admin-token') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  res.json(users);
});

// Смена роли пользователя
app.put('/api/admin/users/:id/role', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.json({ success: true });
});

module.exports = { app };

afterAll(() => {});