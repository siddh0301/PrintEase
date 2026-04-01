import crypto from 'crypto';

/**
 * CSRF Protection Middleware
 * Protects against Cross-Site Request Forgery attacks
 * 
 * Usage:
 * 1. Initialize tokens store in session/database
 * 2. Add middleware to protected routes
 * 3. Client must send token in X-CSRF-Token header
 */

// Simple in-memory token store (in production, use Redis or database)
const csrfTokens = new Map();

/**
 * Generate CSRF token for session
 */
export const generateCSRFToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * CSRF protection middleware
 * Validates CSRF tokens on state-changing requests (POST, PUT, DELETE)
 */
export const csrfProtection = (req, res, next) => {
  // Skip CSRF check for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // For state-changing requests, verify CSRF token
  const token = req.headers['x-csrf-token'] || req.body._csrf;

  if (!token) {
    return res.status(403).json({
      message: 'CSRF token missing',
    });
  }

  // Verify token (in production, check against session/database)
  const sessionId = req.sessionID || req.headers['x-session-id'];
  if (!sessionId || !csrfTokens.has(sessionId) || csrfTokens.get(sessionId) !== token) {
    return res.status(403).json({
      message: 'Invalid CSRF token',
    });
  }

  next();
};

/**
 * Middleware to set CSRF token on response
 * Client should include this token in X-CSRF-Token header for state-changing requests
 */
export const setCSRFToken = (req, res, next) => {
  const sessionId = req.sessionID || crypto.randomBytes(16).toString('hex');
  
  if (!csrfTokens.has(sessionId)) {
    csrfTokens.set(sessionId, generateCSRFToken());
  }

  const token = csrfTokens.get(sessionId);
  res.set('X-CSRF-Token', token);
  res.set('X-Session-Id', sessionId);
  
  next();
};

/**
 * Invalidate CSRF token (call on logout)
 */
export const invalidateCSRFToken = (sessionId) => {
  csrfTokens.delete(sessionId);
};

export default {
  generateCSRFToken,
  csrfProtection,
  setCSRFToken,
  invalidateCSRFToken,
};
