const request = require('supertest');
const { app } = require('./setup');

describe('🎵 Треки', () => {
  let adminToken = null;
  let artistToken = null;
  let testTrackId = null;

  beforeAll(async () => {
    // Создаём тестового артиста
    await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testartist2',
        email: 'artist2@example.com',
        password: '123456',
        confirmPassword: '123456',
        role: 'artist'
      });
    
    const artistLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'artist2@example.com', password: '123456' });
    
    artistToken = artistLogin.body.data.token;

    // Создаём тестовый трек
    const trackRes = await request(app)
      .post('/api/tracks')
      .set('Authorization', `Bearer ${artistToken}`)
      .field('title', 'Test Song')
      .field('artist', 'Test Artist')
      .field('genre', 'rock')
      .field('duration', '3:30')
      .attach('audio', Buffer.from('fake MP3 data', 'utf-8'), 'test.mp3');
    
    if (trackRes.body.success) {
      testTrackId = trackRes.body.data.id;
    }

    // Админ (опционально)
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'admin123' });
    if (adminLogin.body.success) {
      adminToken = adminLogin.body.data.token;
    }
  });

  describe('GET /api/tracks', () => {
    test('✅ Получение списка треков (публичный доступ)', async () => {
      const res = await request(app).get('/api/tracks');
      
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('✅ Фильтрация по жанру', async () => {
      const res = await request(app).get('/api/tracks?genre=pop');
      
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('✅ Поиск по названию', async () => {
      const res = await request(app).get('/api/tracks?search=love');
      
      expect(res.statusCode).toBe(200);
    });
  });

  describe('GET /api/tracks/popular', () => {
    test('✅ Получение популярных треков', async () => {
      const res = await request(app).get('/api/tracks/popular');
      
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('POST /api/tracks (загрузка трека)', () => {
    test('✅ Загрузка трека артистом', async () => {
      const res = await request(app)
        .post('/api/tracks')
        .set('Authorization', `Bearer ${artistToken}`)
        .field('title', 'Test Song 2')
        .field('artist', 'Test Artist')
        .field('genre', 'rock')
        .field('duration', '3:30')
        .attach('audio', Buffer.from('fake MP3 data', 'utf-8'), 'test.mp3');
      
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('pending');
    });

    test('❌ Загрузка без аудиофайла', async () => {
      const res = await request(app)
        .post('/api/tracks')
        .set('Authorization', `Bearer ${artistToken}`)
        .field('title', 'No Audio')
        .field('artist', 'Test')
        .field('genre', 'pop')
        .field('duration', '3:00');
      
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/аудио/i);
    });

    test('❌ Загрузка без авторизации', async () => {
      const res = await request(app)
        .post('/api/tracks')
        .field('title', 'Unauth Track');
      
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/tracks/:id', () => {
    test('✅ Получение деталей трека', async () => {
      if (!testTrackId) {
        console.warn('⚠️ Пропуск: нет тестового трека');
        return;
      }
      const res = await request(app).get(`/api/tracks/${testTrackId}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id');
    });

    test('❌ Несуществующий трек', async () => {
      const res = await request(app).get('/api/tracks/999999');
      
      expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /api/tracks/:id/audio', () => {
    test('✅ Получение аудиофайла', async () => {
      if (!testTrackId) {
        console.warn('⚠️ Пропуск: нет тестового трека');
        return;
      }
      const res = await request(app).get(`/api/tracks/${testTrackId}/audio`);
      
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toMatch(/audio/);
    });
  });

  describe('PUT /api/tracks/:id/play', () => {
    test('✅ Увеличение счётчика прослушиваний', async () => {
      if (!testTrackId) {
        console.warn('⚠️ Пропуск: нет тестового трека');
        return;
      }
      const before = await request(app).get(`/api/tracks/${testTrackId}`);
      const beforePlays = before.body.plays || 0;
      
      await request(app).put(`/api/tracks/${testTrackId}/play`);
      
      const after = await request(app).get(`/api/tracks/${testTrackId}`);
      expect(after.body.plays).toBe(beforePlays + 1);
    });
  });

  describe('GET /api/tracks/my (треки артиста)', () => {
    test('✅ Получение своих треков (артист)', async () => {
      const res = await request(app)
        .get('/api/tracks/my')
        .set('Authorization', `Bearer ${artistToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('❌ Доступ для слушателя запрещён', async () => {
      // Создаём слушателя
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'listener',
          email: 'listener@example.com',
          password: '123456',
          confirmPassword: '123456'
        });
      const listenerLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'listener@example.com', password: '123456' });
      const listenerToken = listenerLogin.body.data.token;

      const res = await request(app)
        .get('/api/tracks/my')
        .set('Authorization', `Bearer ${listenerToken}`);
      
      expect(res.statusCode).toBe(403);
    });
  });
});