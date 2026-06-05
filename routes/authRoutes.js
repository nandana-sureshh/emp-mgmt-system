/**
 * routes/authRoutes.js
 * Authentication routes: login and logout.
 */

'use strict';

const express = require('express');
const router = express.Router();
const { getLoginPage, login, logout } = require('../controllers/authController');

router.get('/login', getLoginPage);
router.post('/login', login);
router.get('/logout', logout);

module.exports = router;
