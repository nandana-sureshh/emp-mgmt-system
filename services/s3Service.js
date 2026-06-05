/**
 * services/s3Service.js
 * =====================
 * AWS S3 service for employee profile photo management.
 *
 * Purpose:
 * - Uploads employee photos to S3.
 * - Returns the public S3 URL to store in MongoDB.
 * - Deletes photos from S3 when an employee is deleted.
 *
 * Requirements:
 *   - S3_BUCKET_NAME must be set in .env
 *   - AWS_REGION must be set in .env
 *   - IAM Role must have s3:PutObject, s3:DeleteObject, s3:GetObject permissions
 *   - S3 bucket must allow public read (or use presigned URLs — see README)
 */

'use strict';

const {
  PutObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');
const { getS3Client } = require('../config/aws');
const fs = require('fs');
const path = require('path');

/**
 * Uploads an employee profile photo to AWS S3.
 * The local temp file (created by Multer) is deleted after upload.
 *
 * @param {Express.Multer.File} file - The Multer file object
 * @returns {Promise<{url: string, key: string}>} The S3 URL and object key
 */
const uploadPhoto = async (file) => {
  if (!process.env.S3_BUCKET_NAME) {
    throw new Error('S3_BUCKET_NAME is not set in environment variables.');
  }

  const client = getS3Client();

  // Generate a unique S3 object key
  const ext = path.extname(file.originalname).toLowerCase();
  const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  const key = `employees/photos/${uniqueId}${ext}`;

  // Read the temp file from disk
  const fileContent = fs.readFileSync(file.path);

  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    Body: fileContent,
    ContentType: file.mimetype,
  });

  await client.send(command);
  console.log(`📦 Photo uploaded to S3: s3://${process.env.S3_BUCKET_NAME}/${key}`);

  // Clean up the local temp file
  try {
    fs.unlinkSync(file.path);
    console.log(`🗑️  Temp file deleted: ${file.path}`);
  } catch (cleanupError) {
    console.warn(`⚠️  Could not delete temp file: ${file.path}`, cleanupError.message);
  }

  // Construct the public S3 URL
  const url = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

  return { url, key };
};

/**
 * Deletes an employee photo from AWS S3.
 * Called when an employee record is deleted.
 *
 * @param {string} photoKey - The S3 object key (e.g., "employees/photos/123.jpg")
 * @returns {Promise<void>}
 */
const deletePhoto = async (photoKey) => {
  if (!photoKey || !process.env.S3_BUCKET_NAME) {
    console.warn('⚠️  deletePhoto called with missing key or bucket name. Skipping.');
    return;
  }

  const client = getS3Client();

  const command = new DeleteObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: photoKey,
  });

  await client.send(command);
  console.log(`🗑️  Photo deleted from S3: ${photoKey}`);
};

module.exports = {
  uploadPhoto,
  deletePhoto,
};
