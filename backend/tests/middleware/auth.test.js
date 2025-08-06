const request = require('supertest');
const app = require('../../app');
const jwt = require('jsonwebtoken');
const auth = require('../../middleware/auth');
const config = require('../../config/config');

describe('Authentication Middleware', () => {
  test('should allow access with valid token', () => {
    const token = jwt.sign({ userId: 1, email: 'test@example.com' }, config.jwtSecret);
    
    const req = {
      header: jest.fn().mockReturnValue(`Bearer ${token}`)
    };
    const res = {};
    const next = jest.fn();

    auth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user.userId).toBe(1);
  });

  test('should deny access without token', () => {
    const req = {
      header: jest.fn().mockReturnValue(null)
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();

    auth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'No token, authorization denied' });
    expect(next).not.toHaveBeenCalled();
  });
});