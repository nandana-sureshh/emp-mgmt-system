/**
 * server.js
 * =========
 * Application entry point.
 *
 * Startup Sequence:
 *   1. Load environment variables from .env
 *   2. Pre-load all secrets from AWS Secrets Manager (cached)
 *   3. Connect to MongoDB using credentials from Secrets Manager
 *   4. Start the HTTP server
 *
 * This order ensures all AWS services are ready before accepting requests.
 */

'use strict';

require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');
const { preloadAllSecrets } = require('./services/secretsManagerService');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║       Employee Management System — Starting Up        ║');
  console.log('╚═══════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`  Region:       ${process.env.AWS_REGION || 'us-east-1'}`);
  console.log(`  S3 Bucket:    ${process.env.S3_BUCKET_NAME || '(not set)'}`);
  console.log(`  KMS Key:      ${process.env.KMS_KEY_ID || '(not set)'}`);
  console.log(`  Environment:  ${process.env.NODE_ENV || 'development'}`);
  console.log('');

  try {
    // ── Step 1: Load all secrets from AWS Secrets Manager ──────────────
    await preloadAllSecrets();

    // ── Step 2: Connect to MongoDB ──────────────────────────────────────
    await connectDB();

    // ── Step 3: Start HTTP Server ───────────────────────────────────────
    app.listen(PORT, () => {
      console.log('');
      console.log('╔═══════════════════════════════════════════════════════╗');
      console.log(`║   ✅  Server running at http://localhost:${PORT}         ║`);
      console.log('╠═══════════════════════════════════════════════════════╣');
      console.log('║   🔒  AWS Secrets Manager: Enabled                    ║');
      console.log('║   🔑  AWS KMS Encryption:  Enabled                    ║');
      console.log('║   📦  AWS S3 Storage:      Enabled                    ║');
      console.log('║   🛡️   JWT Authentication:  Enabled                    ║');
      console.log('║   📧  SMTP Email Service:  Enabled                    ║');
      console.log('╚═══════════════════════════════════════════════════════╝');
      console.log('');
    });

  } catch (error) {
    console.error('');
    console.error('╔═══════════════════════════════════════════════════════╗');
    console.error('║              ❌  STARTUP FAILED                       ║');
    console.error('╚═══════════════════════════════════════════════════════╝');
    console.error('');
    console.error('Error:', error.message);
    console.error('');
    console.error('Common causes:');
    console.error('  • AWS credentials not configured (run: aws configure)');
    console.error('  • Secrets not created in AWS Secrets Manager');
    console.error('  • IAM Role missing required permissions');
    console.error('  • .env file not configured correctly');
    console.error('');
    console.error('See SETUP_GUIDE.md for detailed setup instructions.');
    process.exit(1);
  }
};

startServer();
