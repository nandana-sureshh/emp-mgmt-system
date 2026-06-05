/**
 * controllers/authController.js
 * ==============================
 * Handles user authentication: login and logout.
 *
 * Login Flow:
 *   1. Receive username and password from login form
 *   2. Retrieve admin credentials from AWS Secrets Manager
 *   3. Compare submitted credentials (plain comparison — admin creds are not hashed)
 *   4. On success: generate JWT, set HTTP-only cookie, redirect to dashboard
 *   5. On failure: re-render login page with error message
 *
 * Logout Flow:
 *   - Clear the JWT cookie and redirect to login page
 */

'use strict';

const jwt = require('jsonwebtoken');
const {
  getAdminCredentials,
  getJwtSecret,
} = require('../services/secretsManagerService');

/**
 * GET /login
 * Render the login page.
 * Redirects to dashboard if already logged in.
 */
const getLoginPage = (req, res) => {
  // If already authenticated, redirect to dashboard
  if (req.cookies?.token) {
    return res.redirect('/dashboard');
  }

  const errorMsg = req.query.error || null;
  res.render('login', {
    title: 'Login | Employee Management System',
    error: errorMsg,
  });
};

/**
 * POST /login
 * Authenticate the user and issue a JWT.
 */
const login = async (req, res) => {
  const { username, password } = req.body;

  // Basic input validation
  if (!username || !password) {
    return res.render('login', {
      title: 'Login | Employee Management System',
      error: 'Username and password are required.',
    });
  }

  try {
    // Retrieve credentials from Secrets Manager
    const [adminCredentials, jwtSecretData] = await Promise.all([
      getAdminCredentials(),
      getJwtSecret(),
    ]);

    // Extract JWT secret from various possible formats
    const jwtSecret =
      typeof jwtSecretData === 'object'
        ? jwtSecretData.secret || jwtSecretData.value
        : jwtSecretData;

    // Validate credentials (direct comparison — admin creds stored as plaintext in Secrets Manager)
    const isUsernameValid = username === adminCredentials.username;
    const isPasswordValid = password === adminCredentials.password;

    if (!isUsernameValid || !isPasswordValid) {
      console.warn(`⚠️  Failed login attempt for username: "${username}"`);
      return res.render('login', {
        title: 'Login | Employee Management System',
        error: 'Invalid username or password. Please try again.',
      });
    }

    // Generate JWT (expires in 8 hours)
    const payload = {
      username: adminCredentials.username,
      role: 'admin',
    };
    const token = jwt.sign(payload, jwtSecret, { expiresIn: '8h' });

    // Store JWT in an HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'strict',
      maxAge: 8 * 60 * 60 * 1000, // 8 hours in milliseconds
    });

    console.log(`✅ Successful login for user: ${username}`);
    return res.redirect('/dashboard');

  } catch (error) {
    console.error('❌ Login error:', error.message);
    return res.render('login', {
      title: 'Login | Employee Management System',
      error: 'Authentication service is unavailable. Please try again later.',
    });
  }
};

/**
 * GET /logout
 * Clear the JWT cookie and redirect to login.
 */
const logout = (req, res) => {
  res.clearCookie('token');
  console.log('👋 User logged out');
  res.redirect('/login');
};

module.exports = {
  getLoginPage,
  login,
  logout,
};
