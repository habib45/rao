import 'dotenv/config';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pool from '../db/connection.js';

const JWT_SECRET = process.env.JWT_SECRET || 'orh-admin-jwt-secret-change-in-production';
const COOKIE_NAME = 'admin_token';

export function requireApiKey(req, res, next) {
  const key = req.headers['api-key'] || req.headers['x-api-key'];
  if (!key || key !== process.env.API_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// Helper function to hash token for database lookup
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Middleware that accepts either API key or valid JWT token
export async function requireApiKeyOrJwt(req, res, next) {
  // First check for API key
  const apiKey = req.headers['api-key'] || req.headers['x-api-key'];
  if (apiKey && apiKey === process.env.API_SECRET) {
    return next();
  }

  // Then check for JWT token in Authorization header
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: API key or JWT token required' });
  }

  try {
    // Verify JWT signature and expiration
    const payload = jwt.verify(token, JWT_SECRET);

    // Check if token exists in database and is active
    const tokenHash = hashToken(token);
    const [rows] = await pool.query(
      `SELECT id, status, expiration_at FROM jwt_tokens 
       WHERE token_hash = ? AND status = 'active'`,
      [tokenHash]
    );

    if (!rows || rows.length === 0) {
      return res.status(401).json({ error: 'Unauthorized: Token not found or inactive' });
    }

    const tokenRecord = rows[0];

    // Check if token is expired
    if (new Date(tokenRecord.expiration_at) < new Date()) {
      return res.status(401).json({ error: 'Unauthorized: Token expired' });
    }

    // Attach token info to request
    req.jwtToken = {
      id: tokenRecord.id,
      username: payload.username,
      domain: payload.domain
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Unauthorized: Token expired' });
    }
    console.error('JWT validation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export function requireAuth(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME] || req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      name: payload.name
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}
