/**
 * config/aws.js
 * =============
 * Centralized AWS SDK v3 client configuration.
 * Reads the AWS_REGION from environment variables.
 * On EC2 with an IAM Role, no credentials need to be specified —
 * the SDK automatically picks them up from the EC2 instance metadata.
 * For local development, configure credentials via AWS CLI or .env.
 */

'use strict';

const { SecretsManagerClient } = require('@aws-sdk/client-secrets-manager');
const { KMSClient } = require('@aws-sdk/client-kms');
const { S3Client } = require('@aws-sdk/client-s3');

/**
 * Returns a base AWS SDK configuration object.
 * @returns {{ region: string }}
 */
const getAWSConfig = () => ({
  region: process.env.AWS_REGION || 'us-east-1',
});

/**
 * Creates and returns a new SecretsManagerClient.
 * @returns {SecretsManagerClient}
 */
const getSecretsManagerClient = () =>
  new SecretsManagerClient(getAWSConfig());

/**
 * Creates and returns a new KMSClient.
 * @returns {KMSClient}
 */
const getKMSClient = () =>
  new KMSClient(getAWSConfig());

/**
 * Creates and returns a new S3Client.
 * @returns {S3Client}
 */
const getS3Client = () =>
  new S3Client(getAWSConfig());

module.exports = {
  getAWSConfig,
  getSecretsManagerClient,
  getKMSClient,
  getS3Client,
};
