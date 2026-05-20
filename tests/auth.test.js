const request = require('supertest');
const { app } = require('./setup');

describe('🔐 Аутентификация', () => {
  const testUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: '123456',
    confirmPassword: '123456'
  };

  describe('POST /api/auth/register', () => {
    test('✅ Успешная регистрация', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);
      
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toHaveProperty('id');
    });

    test('❌ Регистрация с коротким паролем (<6)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...testUser, email: 'test2@example.com', password: '123', confirmPassword: '123' });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/пароль.*6/i);
    });

    test('❌ Регистрация с несовпадающими паролями', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...testUser, email: 'test3@example.com', confirmPassword: 'wrong' });
      
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/не совпадают/i);
    });

    test('❌ Регистрация с уже существующим email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);
      
      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    test('✅ Успешный вход', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user).toHaveProperty('role');
    });

    test('❌ Неверный пароль', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'wrongpassword' });
      
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('❌ Несуществующий email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: '123456' });
      
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    test('❌ Пустые поля', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({});
      
      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/auth/register - роль артиста', () => {
    test('✅ Регистрация артиста', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testartist',
          email: 'artist@example.com',
          password: '123456',
          confirmPassword: '123456',
          role: 'artist'
        });
      
      expect(res.statusCode).toBe(201);
      expect(res.body.data.user.role).toBe('artist');
    });
  });
});