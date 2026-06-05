/**
 * routes/dashboardRoutes.js
 * Dashboard route — protected by JWT middleware.
 */

'use strict';

const express = require('express');
const router = express.Router();
const { getDashboard } = require('../controllers/dashboardController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/dashboard', authMiddleware, getDashboard);

module.exports = router;
