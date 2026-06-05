/**
 * config/db.js
 * ============
 * MongoDB connection using credentials retrieved from AWS Secrets Manager.
 * Supports two secret formats:
 *   1. { uri: "mongodb://..." }  — full connection string
 *   2. { username, password, host, port, database } — individual fields
 */

'use strict';

const mongoose = require('mongoose');
const { getMongoCredentials } = require('../services/secretsManagerService');

/**
 * Establishes a Mongoose connection to MongoDB.
 * Called once at application startup from server.js.
 */
const connectDB = async () => {
  try {
    console.log('🔑 Retrieving MongoDB credentials from AWS Secrets Manager...');
    const credentials = await getMongoCredentials();

    let mongoUri;

    if (credentials.uri) {
      // Format 1: full URI stored in secret
      mongoUri = credentials.uri;
    } else {
      // Format 2: individual components stored in secret
      const { username, password, host, port, database } = credentials;
      const portStr = port ? `:${port}` : ':27017';
      const auth = username && password
        ? `${encodeURIComponent(username)}:${encodeURIComponent(password)}@`
        : '';
      mongoUri = `mongodb://${auth}${host}${portStr}/${database}`;
    }

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log('✅ MongoDB Connected Successfully');
    console.log(`   Host: ${mongoose.connection.host}`);
    console.log(`   Database: ${mongoose.connection.name}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
    });

  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error.message);
    console.error('   Ensure your Secrets Manager secret is correctly configured.');
    process.exit(1);
  }
};

module.exports = connectDB;
