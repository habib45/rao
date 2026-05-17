import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pool from '../db/connection.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'orh-admin-jwt-secret-change-in-production';
const COOKIE_NAME = 'admin_token';

// Helper function to create cookie options
const getCookieOpts = (rememberMe = false) => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7, // 30 days if remember me, else 7 days
  path: '/',
});

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

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password, rememberMe } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'email and password are required' });

  try {
    const [rows] = await pool.query(
      'SELECT * FROM admin_users WHERE email = ? AND is_active = 1 LIMIT 1',
      [email]
    );
    const user = rows[0];
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return res.status(403).json({ error: 'Account is temporarily locked. Please try again later.' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      // Increment failed login attempts
      await pool.query(
        'UPDATE admin_users SET failed_login_attempts = failed_login_attempts + 1 WHERE id = ?',
        [user.id]
      );
      
      // Lock account after 5 failed attempts
      if (user.failed_login_attempts >= 4) {
        const lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        await pool.query(
          'UPDATE admin_users SET locked_until = ?, failed_login_attempts = 0 WHERE id = ?',
          [lockedUntil, user.id]
        );
      }
      
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Reset failed login attempts on successful login
    await pool.query(
      'UPDATE admin_users SET failed_login_attempts = 0, locked_until = NULL, last_login_at = NOW(), last_login_ip = ? WHERE id = ?',
      [req.ip || req.connection.remoteAddress, user.id]
    );

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role, name: user.full_name },
      JWT_SECRET,
      { expiresIn: rememberMe ? '30d' : '7d' }
    );

    res.cookie(COOKIE_NAME, token, getCookieOpts(rememberMe));
    
    // Log successful login
    await logAudit(user.id, 'LOGIN', 'admin_user', user.id, { email: user.email }, req);
    
    res.json({ 
      id: user.id, 
      email: user.email, 
      role: user.role, 
      name: user.full_name,
      username: user.username
    });
  } catch (error) {
    console.error('Login error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me  — verify current session
router.get('/me', async (req, res) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    
    // Fetch fresh user data
    const [rows] = await pool.query(
      'SELECT id, email, username, full_name, role, is_active FROM admin_users WHERE id = ?',
      [payload.sub]
    );
    const user = rows[0];
    
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }
    
    res.json({ 
      id: user.id, 
      email: user.email, 
      role: user.role, 
      name: user.full_name,
      username: user.username
    });
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (token) {
      try {
        const payload = jwt.verify(token, JWT_SECRET);
        await logAudit(payload.sub, 'LOGOUT', 'admin_user', payload.sub, {}, req);
      } catch (error) {
        // Token might be expired, but still clear cookie
      }
    }
    res.clearCookie(COOKIE_NAME, { path: '/' });
    res.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    res.clearCookie(COOKIE_NAME, { path: '/' });
    res.json({ success: true });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email)
    return res.status(400).json({ error: 'email is required' });

  try {
    const [rows] = await pool.query(
      'SELECT * FROM admin_users WHERE email = ? AND is_active = 1 LIMIT 1',
      [email]
    );
    const user = rows[0];
    
    if (!user) {
      // Don't reveal if email exists for security
      return res.json({ message: 'If the email exists, a reset link has been sent.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Delete any existing reset tokens for this user
    await pool.query('DELETE FROM password_reset_tokens WHERE admin_user_id = ?', [user.id]);

    // Insert new reset token
    await pool.query(
      'INSERT INTO password_reset_tokens (admin_user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, resetToken, expiresAt]
    );

    // Log password reset request
    await logAudit(user.id, 'PASSWORD_RESET_REQUEST', 'admin_user', user.id, { email }, req);

    // In production, send email here
    // For now, return the token (development only)
    if (process.env.NODE_ENV !== 'production') {
      res.json({ 
        message: 'If the email exists, a reset link has been sent.',
        resetToken: resetToken,
        resetLink: `${req.protocol}://${req.get('host')}/admin/reset-password?token=${resetToken}`
      });
    } else {
      res.json({ message: 'If the email exists, a reset link has been sent.' });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword)
    return res.status(400).json({ error: 'token and newPassword are required' });

  try {
    // Validate token
    const [rows] = await pool.query(
      'SELECT * FROM password_reset_tokens WHERE token = ? AND used_at IS NULL AND expires_at > NOW() LIMIT 1',
      [token]
    );
    const resetToken = rows[0];
    
    if (!resetToken) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update user password
    await pool.query(
      'UPDATE admin_users SET password_hash = ? WHERE id = ?',
      [passwordHash, resetToken.admin_user_id]
    );

    // Mark token as used
    await pool.query(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?',
      [resetToken.id]
    );

    // Log password reset
    await logAudit(resetToken.admin_user_id, 'PASSWORD_RESET', 'admin_user', resetToken.admin_user_id, {}, req);

    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
