/**
 * services/kmsService.js
 * ======================
 * AWS KMS encryption and decryption service.
 *
 * Purpose:
 * - Encrypts the employee Salary field before storing in MongoDB.
 * - Decrypts the encrypted salary when viewing employee details.
 *
 * Only the salary field is encrypted. No other fields are encrypted.
 *
 * Workflow:
 *   Add Employee   → encryptSalary(plaintext) → store Base64 ciphertext in MongoDB
 *   View Employee  → decryptSalary(ciphertext) → display original value
 *
 * Requirements:
 *   - KMS_KEY_ID must be set in .env (ARN or alias of your KMS key)
 *   - IAM Role must have kms:Encrypt and kms:Decrypt permissions
 */

'use strict';

const {
  EncryptCommand,
  DecryptCommand,
} = require('@aws-sdk/client-kms');
const { getKMSClient } = require('../config/aws');

/**
 * Encrypts a salary value using AWS KMS.
 * Returns a Base64-encoded ciphertext string safe for MongoDB storage.
 *
 * @param {string|number} salaryValue - The plaintext salary value
 * @returns {Promise<string>} Base64-encoded encrypted salary
 */
const encryptSalary = async (salaryValue) => {
  if (!process.env.KMS_KEY_ID) {
    throw new Error('KMS_KEY_ID is not set in environment variables.');
  }

  const client = getKMSClient();
  const plaintext = String(salaryValue).trim();

  const command = new EncryptCommand({
    KeyId: process.env.KMS_KEY_ID,
    Plaintext: Buffer.from(plaintext, 'utf-8'),
  });

  const response = await client.send(command);

  // Convert the CiphertextBlob (Uint8Array) to a Base64 string
  const encryptedBase64 = Buffer.from(response.CiphertextBlob).toString('base64');
  console.log('🔒 Salary encrypted successfully using AWS KMS');
  return encryptedBase64;
};

/**
 * Decrypts an encrypted salary value using AWS KMS.
 * Returns the original plaintext salary string.
 *
 * @param {string} encryptedSalary - Base64-encoded ciphertext from MongoDB
 * @returns {Promise<string>} Decrypted plaintext salary
 */
const decryptSalary = async (encryptedSalary) => {
  const client = getKMSClient();

  // Convert Base64 string back to Uint8Array
  const ciphertextBlob = Buffer.from(encryptedSalary, 'base64');

  const command = new DecryptCommand({
    CiphertextBlob: ciphertextBlob,
    // KeyId is optional here as KMS can determine it from the ciphertext
    // but we include it for explicitness
    KeyId: process.env.KMS_KEY_ID,
  });

  const response = await client.send(command);

  // Convert the Plaintext (Uint8Array) to a UTF-8 string
  const decryptedValue = Buffer.from(response.Plaintext).toString('utf-8');
  console.log('🔓 Salary decrypted successfully using AWS KMS');
  return decryptedValue;
};

module.exports = {
  encryptSalary,
  decryptSalary,
};
