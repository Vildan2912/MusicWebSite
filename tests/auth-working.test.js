const request = require('supertest');
const { app } = require('./setup');

describe('🔐 Функциональные тесты авторизации', () => {
  
  test('TC-01: Успешная регистрация', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'ТестовыйUser',
        email: 'test@example.com',
        password: '123456',
        confirmPassword: '123456'
      });
    
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toHaveProperty('id');
  });

  test('TC-02: Регистрация с коротким паролем - ошибка', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'User2',
        email: 'test2@example.com',
        password: '123',
        confirmPassword: '123'
      });
    
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/минимум 6 символов/i);
  });

  test('TC-03: Регистрация с несовпадающими паролями - ошибка', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'User3',
        email: 'test3@example.com',
        password: '123456',
        confirmPassword: 'wrong'
      });
    
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/не совпадают/i);
  });

  test('TC-04: Успешный вход', async () => {
    // Сначала регистрируем пользователя
    await request(app)
      .post('/api/auth/register')
      .send({
        username: 'LoginUser',
        email: 'login@example.com',
        password: '123456',
        confirmPassword: '123456'
      });
    
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@example.com',
        password: '123456'
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
  });

  test('TC-05: Вход с неверным паролем - ошибка', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'login@example.com',
        password: 'wrongpassword'
      });
    
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('TC-06: Регистрация артиста', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'ArtistUser',
        email: 'artist@example.com',
        password: '123456',
        confirmPassword: '123456',
        role: 'artist'
      });
    
    expect(res.statusCode).toBe(201);
    expect(res.body.data.user.role).toBe('artist');
  });
});