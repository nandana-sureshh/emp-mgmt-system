/**
 * models/Employee.js
 * ==================
 * Mongoose schema for the Employee collection.
 *
 * Notes:
 * - encryptedSalary stores the KMS-encrypted Base64 ciphertext (never plaintext)
 * - photoUrl is the public S3 URL of the employee's profile photo
 * - photoKey is the S3 object key (used for deletion from S3)
 */

'use strict';

const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
      enum: [
        'Engineering',
        'Human Resources',
        'Finance',
        'Marketing',
        'Sales',
        'Operations',
        'Legal',
        'IT',
        'Design',
        'Customer Support',
        'Management',
        'Other',
      ],
    },
    encryptedSalary: {
      type: String,
      required: [true, 'Salary is required'],
    },
    photoUrl: {
      type: String,
      default: null,
    },
    photoKey: {
      type: String,
      default: null, // S3 object key for deletion
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false, // We manage createdAt manually
    collection: 'employees',
  }
);

// Index for faster queries
employeeSchema.index({ department: 1 });
employeeSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Employee', employeeSchema);
