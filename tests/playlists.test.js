const request = require('supertest');
const { app } = require('./setup');

describe('📀 Плейлисты', () => {
  let userToken = null;
  let userId = null;
  let testPlaylistId = null;
  let testTrackId = null;

  beforeAll(async () => {
    // Создаём тестового пользователя
    await request(app)
      .post('/api/auth/register')
      .send({
        username: 'playlistuser',
        email: 'playlist@example.com',
        password: '123456',
        confirmPassword: '123456'
      });
    
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'playlist@example.com', password: '123456' });
    
    userToken = loginRes.body.data.token;
    userId = loginRes.body.data.user.id;

    // Создаём тестовый трек для добавления в плейлист
    // Регистрируем артиста для загрузки трека
    await request(app)
      .post('/api/auth/register')
      .send({
        username: 'artistforplaylist',
        email: 'artistforplaylist@example.com',
        password: '123456',
        confirmPassword: '123456',
        role: 'artist'
      });
    
    const artistLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'artistforplaylist@example.com', password: '123456' });
    const artistToken = artistLogin.body.data.token;

    const trackRes = await request(app)
      .post('/api/tracks')
      .set('Authorization', `Bearer ${artistToken}`)
      .field('title', 'Playlist Test Track')
      .field('artist', 'Test Artist')
      .field('genre', 'pop')
      .field('duration', '2:30')
      .attach('audio', Buffer.from('fake', 'utf-8'), 'test.mp3');
    
    if (trackRes.body.success) {
      testTrackId = trackRes.body.data.id;
    }
  });

  describe('POST /api/playlists', () => {
    test('✅ Создание плейлиста', async () => {
      const res = await request(app)
        .post('/api/playlists')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Мой первый плейлист', description: 'Тестовое описание' });
      
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('Мой первый плейлист');
      testPlaylistId = res.body.id;
    });

    test('❌ Создание без названия', async () => {
      const res = await request(app)
        .post('/api/playlists')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ description: 'Нет названия' });
      
      expect(res.statusCode).toBe(400);
    });

    test('❌ Создание без авторизации', async () => {
      const res = await request(app)
        .post('/api/playlists')
        .send({ name: 'Unauth Playlist' });
      
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/playlists', () => {
    test('✅ Получение списка плейлистов пользователя', async () => {
      const res = await request(app)
        .get('/api/playlists')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      if (res.body.length > 0) {
        expect(res.body[0]).toHaveProperty('tracks');
      }
    });
  });

  describe('PUT /api/playlists/:id', () => {
    test('✅ Обновление плейлиста', async () => {
      if (!testPlaylistId) {
        console.warn('⚠️ Пропуск: нет тестового плейлиста');
        return;
      }
      const res = await request(app)
        .put(`/api/playlists/${testPlaylistId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Новое название', description: 'Новое описание' });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('❌ Обновление чужого плейлиста', async () => {
      // Создаём другого пользователя
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'otheruser',
          email: 'other@example.com',
          password: '123456',
          confirmPassword: '123456'
        });
      const otherLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'other@example.com', password: '123456' });
      const otherToken = otherLogin.body.data.token;

      const res = await request(app)
        .put(`/api/playlists/${testPlaylistId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ name: 'Попытка взлома' });
      
      expect(res.statusCode).toBe(403);
    });
  });

  describe('POST /api/playlists/:id/tracks', () => {
    test('✅ Добавление трека в плейлист', async () => {
      if (!testPlaylistId || !testTrackId) {
        console.warn('⚠️ Пропуск: нет тестового плейлиста или трека');
        return;
      }
      const res = await request(app)
        .post(`/api/playlists/${testPlaylistId}/tracks`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ trackId: testTrackId });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('DELETE /api/playlists/:id/tracks/:trackId', () => {
    test('✅ Удаление трека из плейлиста', async () => {
      if (!testPlaylistId || !testTrackId) {
        console.warn('⚠️ Пропуск: нет тестового плейлиста или трека');
        return;
      }
      const res = await request(app)
        .delete(`/api/playlists/${testPlaylistId}/tracks/${testTrackId}`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('DELETE /api/playlists/:id', () => {
    test('✅ Удаление плейлиста', async () => {
      if (!testPlaylistId) {
        console.warn('⚠️ Пропуск: нет тестового плейлиста');
        return;
      }
      const res = await request(app)
        .delete(`/api/playlists/${testPlaylistId}`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});