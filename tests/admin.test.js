const request = require('supertest');
const { app } = require('./setup');

describe('👑 Административная панель', () => {
  let adminToken = null;
  let testUserId = null;

  beforeAll(async () => {
    // Получаем токен админа (нужен реальный админ в БД)
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'admin123' });
    
    if (loginRes.body.success) {
      adminToken = loginRes.body.data.token;
    } else {
      console.warn('⚠️ Нет админа в БД, тесты админки пропущены');
    }
  });

  describe('GET /api/admin/users', () => {
    test('✅ Получение списка пользователей (админ)', async () => {
      if (!adminToken) return;
      
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      if (res.body.length > 0) {
        testUserId = res.body[0].id;
      }
    });

    test('❌ Доступ для не-админа', async () => {
      // Создаём обычного пользователя
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'normaluser',
          email: 'normal@example.com',
          password: '123456',
          confirmPassword: '123456'
        });
      const userLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'normal@example.com', password: '123456' });
      const userToken = userLogin.body.data.token;

      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.statusCode).toBe(403);
    });
  });

  describe('PUT /api/admin/users/:id/role', () => {
    test('✅ Смена роли пользователя', async () => {
      if (!adminToken || !testUserId) return;
      
      const res = await request(app)
        .put(`/api/admin/users/${testUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'artist' });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});