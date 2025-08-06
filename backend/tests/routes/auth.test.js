const request = require('supertest');
const app = require('../../app');

describe('Authentication Routes', () => {
  test('POST /api/auth/register should create new user', async () => {
    const userData = {
      username: 'testuser123',
      email: 'testuser123@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      phone: '+1234567890',
      primaryAddress: '123 Test St',
      locationId: 1
    };

    const response = await request(app)
      .post('/api/auth/register')
      .send(userData);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('token');
    expect(response.body.user.email).toBe(userData.email);
  });

  test('POST /api/auth/login should login existing user', async () => {
    const loginData = {
      email: 'john@example.com',
      password: 'password123'
    };

    const response = await request(app)
      .post('/api/auth/login')
      .send(loginData);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });

  test('POST /api/auth/login should fail with invalid credentials', async () => {
    const loginData = {
      email: 'wrong@example.com',
      password: 'wrongpassword'
    };

    const response = await request(app)
      .post('/api/auth/login')
      .send(loginData);

    expect(response.status).toBe(400);
  });
});