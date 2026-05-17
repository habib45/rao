import { Router } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pool from '../db/connection.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'orh-admin-jwt-secret-change-in-production';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ENCRYPTION_ALGORITHM = 'aes-256-cbc';

// Helper function to log audit events
async function logAudit(adminUserId, action, entityType, entityId, details, req) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (admin_user_id, action, entity_type, entity_id, details, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        adminUserId,
        action,
        entityType,
        entityId,
        JSON.stringify(details),
        req.ip || req.connection.remoteAddress,
        req.get('user-agent') || ''
      ]
    );
  } catch (error) {
    console.error('Failed to log audit:', error);
  }
}

// Helper function to hash token for storage
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Helper function to encrypt token
function encryptToken(token) {
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

// Helper function to decrypt token
function decryptToken(encryptedToken) {
  if (!encryptedToken) return null;
  try {
    const parts = encryptedToken.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
}

// GET /api/tokens - Get all tokens for the current admin
router.get('/', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, username, domain, issued_at, expiration_at, status, 
              last_used_at, usage_count, created_at
       FROM jwt_tokens 
       WHERE admin_user_id = ?
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json({ tokens: rows });
  } catch (error) {
    console.error('Get tokens error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/tokens/:id - Get specific token details
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM jwt_tokens 
       WHERE id = ? AND admin_user_id = ?`,
      [req.params.id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Token not found' });
    }

    const token = rows[0];
    const decryptedToken = decryptToken(token.encrypted_token);
    
    res.json({ 
      token: {
        ...token,
        token_value: decryptedToken
      }
    });
  } catch (error) {
    console.error('Get token error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/tokens - Generate a new JWT token
router.post('/', requireAuth, async (req, res) => {
  const { username, domain, expirationDays } = req.body;

  if (!username || !domain) {
    return res.status(400).json({ error: 'username and domain are required' });
  }

  try {
    // Validate expiration days (1-365)
    const days = expirationDays ? Math.min(Math.max(parseInt(expirationDays), 1), 365) : 30;
    const expirationAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const issuedAt = new Date();

    // Generate JWT token
    const token = jwt.sign(
      {
        username,
        domain,
        issued_at: issuedAt.toISOString(),
        expiration: expirationAt.toISOString()
      },
      JWT_SECRET,
      { expiresIn: `${days}d` }
    );

    // Hash token for storage
    const tokenHash = hashToken(token);

    // Store token in database
    const encryptedToken = encryptToken(token);
    const [result] = await pool.query(
      `INSERT INTO jwt_tokens (admin_user_id, token_hash, encrypted_token, username, domain, issued_at, expiration_at, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
      [req.user.id, tokenHash, encryptedToken, username, domain, issuedAt, expirationAt]
    );

    // Log token creation
    await logAudit(
      req.user.id,
      'TOKEN_CREATED',
      'jwt_token',
      result.insertId,
      { username, domain, expirationDays: days },
      req
    );

    res.status(201).json({
      id: result.insertId,
      token,
      username,
      domain,
      issued_at: issuedAt,
      expiration_at: expirationAt,
      status: 'active'
    });
  } catch (error) {
    console.error('Create token error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/tokens/:id/deactivate - Deactivate a token
router.put('/:id/deactivate', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM jwt_tokens 
       WHERE id = ? AND admin_user_id = ?`,
      [req.params.id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Token not found' });
    }

    const token = rows[0];
    if (token.status === 'deactivated') {
      return res.status(400).json({ error: 'Token is already deactivated' });
    }

    await pool.query(
      `UPDATE jwt_tokens 
       SET status = 'deactivated', updated_at = NOW()
       WHERE id = ? AND admin_user_id = ?`,
      [req.params.id, req.user.id]
    );

    // Log token deactivation
    await logAudit(
      req.user.id,
      'TOKEN_DEACTIVATED',
      'jwt_token',
      req.params.id,
      { username: token.username, domain: token.domain },
      req
    );

    res.json({ message: 'Token deactivated successfully' });
  } catch (error) {
    console.error('Deactivate token error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/tokens/:id/reactivate - Reactivate a token
router.put('/:id/reactivate', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM jwt_tokens 
       WHERE id = ? AND admin_user_id = ?`,
      [req.params.id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Token not found' });
    }

    const token = rows[0];
    if (token.status !== 'deactivated') {
      return res.status(400).json({ error: 'Token is not deactivated' });
    }

    // Check if token has expired
    if (new Date(token.expiration_at) < new Date()) {
      await pool.query(
        `UPDATE jwt_tokens 
         SET status = 'expired', updated_at = NOW()
         WHERE id = ?`,
        [req.params.id]
      );
      return res.status(400).json({ error: 'Token has expired and cannot be reactivated' });
    }

    await pool.query(
      `UPDATE jwt_tokens 
       SET status = 'active', updated_at = NOW()
       WHERE id = ? AND admin_user_id = ?`,
      [req.params.id, req.user.id]
    );

    // Log token reactivation
    await logAudit(
      req.user.id,
      'TOKEN_REACTIVATED',
      'jwt_token',
      req.params.id,
      { username: token.username, domain: token.domain },
      req
    );

    res.json({ message: 'Token reactivated successfully' });
  } catch (error) {
    console.error('Reactivate token error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/tokens/:id - Delete a token
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM jwt_tokens 
       WHERE id = ? AND admin_user_id = ?`,
      [req.params.id, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Token not found' });
    }

    const token = rows[0];

    await pool.query(
      `DELETE FROM jwt_tokens 
       WHERE id = ? AND admin_user_id = ?`,
      [req.params.id, req.user.id]
    );

    // Log token deletion
    await logAudit(
      req.user.id,
      'TOKEN_DELETED',
      'jwt_token',
      req.params.id,
      { username: token.username, domain: token.domain },
      req
    );

    res.json({ message: 'Token deleted successfully' });
  } catch (error) {
    console.error('Delete token error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/tokens/audit/logs - Get audit logs for tokens
router.get('/audit/logs', requireAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const [rows] = await pool.query(
      `SELECT al.*, au.username, au.email
       FROM audit_logs al
       LEFT JOIN admin_users au ON al.admin_user_id = au.id
       WHERE al.entity_type = 'jwt_token'
       ORDER BY al.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    res.json({ logs: rows });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
