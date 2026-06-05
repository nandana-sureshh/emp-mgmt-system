/**
 * middleware/authMiddleware.js
 * ============================
 * JWT authentication middleware.
 *
 * Protects routes that require a logged-in user.
 * Reads the JWT from the HTTP-only cookie named "token".
 * Verifies the token using the JWT secret from AWS Secrets Manager.
 *
 * If valid: attaches decoded payload to req.user and calls next().
 * If invalid or missing: clears the cookie and redirects to /login.
 */

'use strict';

const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../services/secretsManagerService');

/**
 * Express middleware that validates JWT from the HTTP-only cookie.
 */
const authMiddleware = async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.redirect('/login');
  }

  try {
    const jwtSecretData = await getJwtSecret();
    // Support both { secret: "..." } and plain string formats
    const jwtSecret =
      typeof jwtSecretData === 'object'
        ? jwtSecretData.secret || jwtSecretData.value
        : jwtSecretData;

    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    next();

  } catch (error) {
    // Token is expired or tampered with
    res.clearCookie('token');

    if (error.name === 'TokenExpiredError') {
      return res.redirect('/login?error=Session expired. Please log in again.');
    }

    return res.redirect('/login?error=Invalid session. Please log in again.');
  }
};

module.exports = { authMiddleware };
