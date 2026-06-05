/**
 * services/emailService.js
 * ========================
 * Nodemailer SMTP email service.
 *
 * Purpose:
 * - Sends a welcome email when a new employee is successfully added.
 * - SMTP credentials are retrieved from AWS Secrets Manager (never hardcoded).
 *
 * Expected SMTP secret format in Secrets Manager:
 * {
 *   "host": "smtp.gmail.com",
 *   "port": 587,
 *   "username": "your-email@gmail.com",
 *   "password": "your-app-password"
 * }
 *
 * Note: If email sending fails, it is logged as a warning but does NOT
 * prevent the employee from being saved. Email is a non-critical operation.
 */

'use strict';

const nodemailer = require('nodemailer');
const { getSmtpCredentials } = require('./secretsManagerService');

/**
 * Creates a Nodemailer transporter using SMTP credentials from Secrets Manager.
 * @returns {Promise<nodemailer.Transporter>}
 */
const createTransporter = async () => {
  const creds = await getSmtpCredentials();

  return nodemailer.createTransport({
    host: creds.host,
    port: Number(creds.port) || 587,
    secure: Number(creds.port) === 465, // true for port 465, false for 587
    auth: {
      user: creds.username,
      pass: creds.password,
    },
    tls: {
      rejectUnauthorized: false, // Allow self-signed certificates
    },
  });
};

/**
 * Sends a professional welcome email to a newly added employee.
 *
 * @param {object} employee - Employee details
 * @param {string} employee.name - Full name
 * @param {string} employee.email - Email address
 * @param {string} employee.employeeId - Employee ID
 * @param {string} employee.department - Department
 * @returns {Promise<void>}
 */
const sendWelcomeEmail = async (employee) => {
  const { name, email, employeeId, department } = employee;

  try {
    const transporter = await createTransporter();
    const creds = await getSmtpCredentials();

    const mailOptions = {
      from: `"Employee Management System" <${creds.username}>`,
      to: email,
      subject: `🎉 Welcome to the Team, ${name}!`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f1f5f9;">
  <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
    
    <!-- Header Banner -->
    <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); padding: 40px 32px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
        Welcome to Our Company!
      </h1>
      <p style="color: #bfdbfe; margin: 8px 0 0; font-size: 15px;">
        Employee Management System
      </p>
    </div>

    <!-- Content -->
    <div style="padding: 40px 32px;">
      <p style="color: #1e293b; font-size: 17px; margin: 0 0 20px; line-height: 1.6;">
        Dear <strong>${name}</strong>,
      </p>
      <p style="color: #475569; font-size: 15px; margin: 0 0 28px; line-height: 1.8;">
        We are thrilled to welcome you to our team! Your employee profile has been successfully created in our Employee Management System. Below are your onboarding details:
      </p>

      <!-- Details Card -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 24px; margin-bottom: 28px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 0; color: #64748b; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; width: 40%; vertical-align: top; border-bottom: 1px solid #e2e8f0;">Employee ID</td>
            <td style="padding: 10px 0; color: #1e293b; font-size: 15px; font-weight: 600; border-bottom: 1px solid #e2e8f0;">${employeeId}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #64748b; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; vertical-align: top; border-bottom: 1px solid #e2e8f0;">Full Name</td>
            <td style="padding: 10px 0; color: #1e293b; font-size: 15px; border-bottom: 1px solid #e2e8f0;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #64748b; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; vertical-align: top; border-bottom: 1px solid #e2e8f0;">Department</td>
            <td style="padding: 10px 0; color: #1e293b; font-size: 15px; border-bottom: 1px solid #e2e8f0;">${department}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #64748b; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; vertical-align: top;">Email</td>
            <td style="padding: 10px 0; color: #1e293b; font-size: 15px;">${email}</td>
          </tr>
        </table>
      </div>

      <p style="color: #475569; font-size: 15px; margin: 0 0 32px; line-height: 1.8;">
        We look forward to working with you and are confident you will make a great contribution to our team. If you have any questions, please don't hesitate to reach out to the HR department.
      </p>

      <div style="text-align: center; margin-bottom: 16px;">
        <p style="color: #1e293b; font-size: 15px; font-weight: 600; margin: 0;">Welcome aboard! 🚀</p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 32px; text-align: center;">
      <p style="color: #94a3b8; font-size: 13px; margin: 0; line-height: 1.6;">
        This is an automated message from the Employee Management System.<br>
        Powered by <strong>AWS Secrets Manager</strong> • <strong>AWS KMS</strong> • <strong>AWS S3</strong>
      </p>
    </div>

  </div>
</body>
</html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${email} (Message ID: ${info.messageId})`);

  } catch (error) {
    // Email failure is non-critical — log and continue
    console.error(`⚠️  Failed to send welcome email to ${email}:`, error.message);
    throw error; // Re-throw so the controller can handle gracefully
  }
};

module.exports = { sendWelcomeEmail };
