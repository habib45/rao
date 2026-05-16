import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import authRouter from '../src/routes/auth.js';
import pool from '../src/db/connection.js';

// Mock the database connection
jest.mock('../src/db/connection.js');

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRouter);

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return 400 if email or password is missing', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com' });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'email and password are required');
  });

  test('should return 400 if only password is provided', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ password: 'password123' });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'email and password are required');
  });

  test('should return 401 if user does not exist', async () => {
    pool.query.mockResolvedValue([[]]);

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nonexistent@example.com', password: 'password123' });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error', 'Invalid credentials');
  });

  test('should return 401 if password is incorrect', async () => {
    const mockUser = {
      id: 1,
      email: 'admin@example.com',
      password_hash: '$2a$10$hashedpassword',
      role: 'admin',
      name: 'Admin User',
      is_active: 1
    };
    
    pool.query.mockResolvedValue([[mockUser]]);
    const bcrypt = await import('bcryptjs');
    bcrypt.compare.mockResolvedValue(false);

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'wrongpassword' });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error', 'Invalid credentials');
  });

  test('should return 200 with user data and set cookie on successful login', async () => {
    const mockUser = {
      id: 1,
      email: 'admin@example.com',
      password_hash: '$2a$10$hashedpassword',
      role: 'admin',
      name: 'Admin User',
      is_active: 1
    };
    
    pool.query.mockResolvedValue([[mockUser]]);
    const bcrypt = await import('bcryptjs');
    bcrypt.compare.mockResolvedValue(true);

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'correctpassword' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', 1);
    expect(response.body).toHaveProperty('email', 'admin@example.com');
    expect(response.body).toHaveProperty('role', 'admin');
    expect(response.body).toHaveProperty('name', 'Admin User');
    expect(response.headers['set-cookie']).toBeDefined();
  });

  test('should query database with correct parameters', async () => {
    pool.query.mockResolvedValue([[]]);

    await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'password123' });

    expect(pool.query).toHaveBeenCalledWith(
      'SELECT * FROM admin_users WHERE email = ? AND is_active = 1 LIMIT 1',
      ['admin@example.com']
    );
  });
});

describe('GET /api/auth/me', () => {
  test('should return 401 if no token in cookie', async () => {
    const response = await request(app)
      .get('/api/auth/me');

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error', 'Not authenticated');
  });

  test('should return 401 if token is invalid', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Cookie', ['admin_token=invalid_token']);

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error', 'Invalid or expired token');
  });

  test('should return user data if token is valid', async () => {
    const jwt = await import('jsonwebtoken');
    const mockPayload = {
      sub: 1,
      email: 'admin@example.com',
      role: 'admin',
      name: 'Admin User'
    };
    
    const validToken = jwt.sign(mockPayload, process.env.JWT_SECRET || 'orh-admin-jwt-secret-change-in-production', { expiresIn: '7d' });

    const response = await request(app)
      .get('/api/auth/me')
      .set('Cookie', [`admin_token=${validToken}`]);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', 1);
    expect(response.body).toHaveProperty('email', 'admin@example.com');
    expect(response.body).toHaveProperty('role', 'admin');
    expect(response.body).toHaveProperty('name', 'Admin User');
  });
});

describe('POST /api/auth/logout', () => {
  test('should clear cookie and return success', async () => {
    const response = await request(app)
      .post('/api/auth/logout');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
  });
});
