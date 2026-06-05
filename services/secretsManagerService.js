/**
 * services/secretsManagerService.js
 * ===================================
 * Centralized service for retrieving secrets from AWS Secrets Manager.
 *
 * Design:
 * - Secrets are fetched ONCE at startup and cached in memory.
 * - Subsequent calls return the cached value without hitting AWS API.
 * - This prevents rate limiting and reduces latency.
 * - No secret values are ever hardcoded in source code.
 *
 * Secrets retrieved:
 *   1. MongoDB credentials      → SECRET_MONGO
 *   2. Admin login credentials  → SECRET_ADMIN
 *   3. JWT secret key           → SECRET_JWT
 *   4. SMTP email credentials   → SECRET_SMTP
 *   5. SSH private key          → SECRET_SSH
 */

'use strict';

const {
  GetSecretValueCommand,
} = require('@aws-sdk/client-secrets-manager');
const { getSecretsManagerClient } = require('../config/aws');

// In-memory cache — populated at startup
const secretsCache = new Map();

/**
 * Retrieves a secret from AWS Secrets Manager by name.
 * Returns the parsed JSON object (or raw string if not JSON).
 * Results are cached so each secret is only fetched once.
 *
 * @param {string} secretName - The name or ARN of the secret
 * @returns {Promise<object|string>} The secret value
 */
const getSecret = async (secretName) => {
  if (!secretName) {
    throw new Error('Secret name is undefined. Check your .env file for SECRET_* variables.');
  }

  // Return cached value if available
  if (secretsCache.has(secretName)) {
    return secretsCache.get(secretName);
  }

  const client = getSecretsManagerClient();
  const command = new GetSecretValueCommand({ SecretId: secretName });

  try {
    console.log(`   🔑 Fetching secret: ${secretName}`);
    const response = await client.send(command);

    let secretValue;
    if (response.SecretString) {
      // Try to parse as JSON; if it fails, return as plain string
      try {
        secretValue = JSON.parse(response.SecretString);
      } catch {
        secretValue = response.SecretString;
      }
    } else if (response.SecretBinary) {
      // Binary secret — decode from base64
      secretValue = Buffer.from(response.SecretBinary, 'base64').toString('utf-8');
      try {
        secretValue = JSON.parse(secretValue);
      } catch {
        // Return as string if not JSON
      }
    }

    // Cache the result
    secretsCache.set(secretName, secretValue);
    console.log(`   ✅ Secret retrieved and cached: ${secretName}`);
    return secretValue;

  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      throw new Error(
        `Secret "${secretName}" not found in AWS Secrets Manager. ` +
        `Please create the secret and try again.`
      );
    }
    if (error.name === 'AccessDeniedException') {
      throw new Error(
        `Access denied to secret "${secretName}". ` +
        `Ensure the IAM Role has secretsmanager:GetSecretValue permission.`
      );
    }
    throw error;
  }
};

/**
 * Pre-fetches all required secrets at application startup.
 * This ensures all secrets are available before any HTTP requests are served.
 */
const preloadAllSecrets = async () => {
  console.log('📦 Pre-loading all secrets from AWS Secrets Manager...');
  const secretNames = [
    process.env.SECRET_MONGO,
    process.env.SECRET_ADMIN,
    process.env.SECRET_JWT,
    process.env.SECRET_SMTP,
    process.env.SECRET_SSH,
  ];

  for (const secretName of secretNames) {
    if (secretName) {
      await getSecret(secretName);
    }
  }
  console.log('✅ All secrets loaded successfully.\n');
};

// ── Named Helper Functions ──────────────────────────────────────────────────

/**
 * Returns MongoDB connection credentials.
 * Expected secret format: { uri } or { username, password, host, port, database }
 */
const getMongoCredentials = () => getSecret(process.env.SECRET_MONGO);

/**
 * Returns admin login credentials.
 * Expected secret format: { username, password }
 */
const getAdminCredentials = () => getSecret(process.env.SECRET_ADMIN);

/**
 * Returns the JWT signing secret.
 * Expected secret format: { secret: "your-jwt-secret" } or plain string
 */
const getJwtSecret = () => getSecret(process.env.SECRET_JWT);

/**
 * Returns SMTP email credentials.
 * Expected secret format: { host, port, username, password }
 */
const getSmtpCredentials = () => getSecret(process.env.SECRET_SMTP);

/**
 * Returns the SSH private key (for demonstration purposes).
 * The SSH key is stored in Secrets Manager to show it can store non-password secrets.
 * Expected secret format: { privateKey: "-----BEGIN RSA PRIVATE KEY-----..." }
 */
const getSshPrivateKey = () => getSecret(process.env.SECRET_SSH);

module.exports = {
  getSecret,
  preloadAllSecrets,
  getMongoCredentials,
  getAdminCredentials,
  getJwtSecret,
  getSmtpCredentials,
  getSshPrivateKey,
};
