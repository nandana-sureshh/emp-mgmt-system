/**
 * app.js
 * =======
 * Express application factory.
 * Configures middleware, view engine, static files, and routes.
 * The server startup and DB connection live in server.js.
 */

'use strict';

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');

// Routes
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const employeeRoutes = require('./routes/employeeRoutes');

const app = express();

// ── View Engine ─────────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ── Static Files ────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── Body Parsers ────────────────────────────────────────────────────────────
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));

// ── Cookie Parser (required for JWT cookie) ─────────────────────────────────
app.use(cookieParser());

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/', authRoutes);
app.use('/', dashboardRoutes);
app.use('/', employeeRoutes);

// ── Root redirect ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => res.redirect('/login'));

// ── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).render('error', {
    title: '404 Not Found | Employee Management System',
    message: 'The page you are looking for does not exist.',
    user: null,
  });
});

// ── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('🔥 Unhandled error:', err.stack);

  // Handle Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).render('error', {
      title: 'Error | Employee Management System',
      message: 'File size exceeds the 5MB limit.',
      user: req.user || null,
    });
  }
  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(400).render('error', {
      title: 'Error | Employee Management System',
      message: err.message,
      user: req.user || null,
    });
  }

  res.status(500).render('error', {
    title: 'Server Error | Employee Management System',
    message: 'An unexpected error occurred. Please try again.',
    user: req.user || null,
  });
});

module.exports = app;
