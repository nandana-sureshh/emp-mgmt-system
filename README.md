# Employee Management System

> A production-style, monolithic Node.js web application demonstrating practical integration of AWS Secrets Manager, AWS KMS, AWS S3, JWT Authentication, and MongoDB — built as an AWS Cloud Engineering learning project.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Business Purpose](#2-business-purpose)
3. [Architecture Diagram](#3-architecture-diagram)
4. [Folder Structure](#4-folder-structure)
5. [Application Screens](#5-application-screens)
6. [AWS Services Used](#6-aws-services-used)
7. [Secrets Manager Integration](#7-secrets-manager-integration)
8. [KMS Integration](#8-kms-integration)
9. [S3 Integration](#9-s3-integration)
10. [JWT Authentication Flow](#10-jwt-authentication-flow)
11. [SMTP Email Flow](#11-smtp-email-flow)
12. [MongoDB Schema](#12-mongodb-schema)
13. [Installation Steps](#13-installation-steps)
14. [AWS Setup Steps](#14-aws-setup-steps)
15. [IAM Permissions Required](#15-iam-permissions-required)
16. [EC2 Deployment Steps](#16-ec2-deployment-steps)
17. [Application Workflow](#17-application-workflow)
18. [Testing Procedure](#18-testing-procedure)
19. [Troubleshooting Guide](#19-troubleshooting-guide)
20. [Future Enhancements](#20-future-enhancements)

---

## 1. Project Overview

The **Employee Management System (EMS)** is a full-featured HR web application that demonstrates how enterprise applications integrate with AWS cloud services. It is intentionally built as a **monolithic** Node.js application to keep the architecture simple and focused on the AWS service integrations rather than infrastructure complexity.

**Key Technologies:**

| Technology | Version | Purpose |
|---|---|---|
| Node.js | ≥ 18.x | Runtime |
| Express.js | ^4.19 | Web framework |
| MongoDB + Mongoose | ^8.4 | Database + ODM |
| EJS | ^3.1 | Server-side templating |
| Bootstrap | 5.3 | UI framework |
| AWS SDK v3 | ^3.620 | AWS service clients |
| JWT (jsonwebtoken) | ^9.0 | Authentication |
| Multer | ^1.4.5 | File upload handling |
| Nodemailer | ^6.9 | SMTP email |
| dotenv | ^16.4 | Environment config |

---

## 2. Business Purpose

This project simulates a real-world employee management scenario where:

- **Sensitive data** (salary) must be encrypted at rest using industry-standard key management.
- **Access credentials** (database passwords, SMTP passwords, JWT secrets) must never be hardcoded.
- **File assets** (employee photos) must be stored in scalable cloud object storage.
- **Access control** must be enforced using token-based authentication.
- **Audit trail** is maintained by storing all employee records with timestamps.

---

## 3. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         EC2 Instance                           │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │               Node.js Express Application               │   │
│  │                                                         │   │
│  │   Browser ──→ Routes ──→ Middleware ──→ Controllers     │   │
│  │                              │                          │   │
│  │                         JWT Verify                      │   │
│  │                              │                          │   │
│  │              ┌───────────────┼───────────────┐          │   │
│  │              ↓               ↓               ↓          │   │
│  │         SecretsManager   KMSService      S3Service      │   │
│  │           Service                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                    │            │          │                     │
└────────────────────┼────────────┼──────────┼─────────────────────┘
                     │            │          │
         ┌───────────┘   ┌────────┘  ┌───────┘
         ↓               ↓           ↓
  ┌──────────────┐ ┌──────────┐ ┌─────────┐
  │ AWS Secrets  │ │  AWS KMS │ │  AWS S3 │
  │   Manager    │ │          │ │  Bucket │
  │              │ │  Encrypt │ │         │
  │ • MongoDB    │ │  Decrypt │ │ Employee│
  │ • Admin creds│ │  Salary  │ │  Photos │
  │ • JWT Secret │ └──────────┘ └─────────┘
  │ • SMTP creds │
  │ • SSH Key    │
  └──────────────┘
         │
         ↓
  ┌──────────────┐
  │   MongoDB    │
  │  (Atlas or   │
  │  EC2 Instance│
  │              │
  │  employees   │
  │  collection  │
  └──────────────┘
         │
         ↓ (SMTP via Nodemailer)
  ┌──────────────┐
  │  Email SMTP  │
  │   (Gmail /   │
  │   SES / etc) │
  └──────────────┘
```

---

## 4. Folder Structure

```
employee-management-system/
│
├── config/
│   ├── aws.js              # AWS SDK v3 client factories (S3, KMS, SecretsManager)
│   ├── db.js               # MongoDB connection using Secrets Manager credentials
│   └── multer.js           # Multer disk storage config for photo uploads
│
├── controllers/
│   ├── authController.js       # Login / logout
│   ├── dashboardController.js  # Dashboard stats
│   └── employeeController.js   # Employee CRUD (Add, List, View, Delete)
│
├── middleware/
│   └── authMiddleware.js   # JWT verification for protected routes
│
├── models/
│   └── Employee.js         # Mongoose schema
│
├── routes/
│   ├── authRoutes.js       # /login, /logout
│   ├── dashboardRoutes.js  # /dashboard
│   └── employeeRoutes.js   # /employees/*
│
├── services/
│   ├── secretsManagerService.js  # GetSecretValue + in-memory cache
│   ├── kmsService.js             # encryptSalary / decryptSalary
│   ├── s3Service.js              # uploadPhoto / deletePhoto
│   └── emailService.js           # sendWelcomeEmail (Nodemailer)
│
├── views/
│   ├── partials/
│   │   ├── header.ejs      # HTML <head> with Bootstrap 5 CDN
│   │   └── navbar.ejs      # Dark sidebar navigation
│   ├── login.ejs           # Login page
│   ├── dashboard.ejs       # Dashboard with stats
│   ├── addEmployee.ejs     # Add employee form
│   ├── employeeList.ejs    # Employee table
│   ├── employeeDetails.ejs # Employee profile view
│   └── error.ejs           # Error / 404 page
│
├── public/
│   ├── css/
│   │   └── style.css       # Custom design system
│   └── js/
│       └── main.js         # Client-side JS
│
├── uploads/                # Temporary multer staging directory (auto-created)
│
├── app.js                  # Express app setup (middleware, routes, error handlers)
├── server.js               # Entry point (load secrets → connect DB → start server)
├── package.json
├── .env.example            # Template for non-secret environment variables
├── README.md
└── SETUP_GUIDE.md
```

---

## 5. Application Screens

### Login Page
- Split-panel design with brand information and login form
- Floating label inputs with password visibility toggle
- Credentials validated against AWS Secrets Manager

### Dashboard
- Total employee count stat card
- AWS service status indicators (Secrets Manager, KMS, S3, JWT)
- Department breakdown bar chart
- Quick action buttons: **Add Employee**, **View Employees**

### Add Employee Page
- Form fields: Employee ID, Full Name, Email, Phone, Department, Salary
- Drag-and-drop photo upload with real-time preview
- AWS flow info panel showing what happens step-by-step on save

### Employee List Page
- Bootstrap data table with avatar/initials display
- Live client-side search
- Actions: **View**, **Delete** (with confirmation modal)

### Employee Details Page
- Profile photo (from S3)
- All fields including **decrypted salary** (labeled as KMS Decrypted)
- AWS technical details panel showing storage metadata

---

## 6. AWS Services Used

| Service | How Used | SDK Command |
|---|---|---|
| **Secrets Manager** | Retrieve all credentials at startup | `GetSecretValueCommand` |
| **KMS** | Encrypt salary on add, decrypt on view | `EncryptCommand`, `DecryptCommand` |
| **S3** | Upload employee photos, delete on employee removal | `PutObjectCommand`, `DeleteObjectCommand` |

---

## 7. Secrets Manager Integration

### Design
All secrets are retrieved **once at application startup** using `preloadAllSecrets()` and cached in a `Map`. Subsequent requests use the cached values, avoiding repeated AWS API calls.

### Secrets Required

| Secret Name (in .env) | Default Secret Name | JSON Format |
|---|---|---|
| `SECRET_MONGO` | `emp-mgmt/mongodb` | `{ "uri": "mongodb://..." }` OR `{ "username", "password", "host", "port", "database" }` |
| `SECRET_ADMIN` | `emp-mgmt/admin-credentials` | `{ "username": "admin", "password": "secret" }` |
| `SECRET_JWT` | `emp-mgmt/jwt-secret` | `{ "secret": "your-jwt-signing-key" }` |
| `SECRET_SMTP` | `emp-mgmt/smtp-credentials` | `{ "host": "smtp.gmail.com", "port": 587, "username": "...", "password": "..." }` |
| `SECRET_SSH` | `emp-mgmt/ssh-private-key` | `{ "privateKey": "-----BEGIN RSA PRIVATE KEY-----\n..." }` |

### Code Location
```
services/secretsManagerService.js
```

---

## 8. KMS Integration

### Design
- Only the **salary field** is encrypted using AWS KMS.
- On **Add Employee**: `encryptSalary()` → AES-256 via KMS → Base64 ciphertext stored in MongoDB.
- On **View Employee**: `decryptSalary()` → KMS decrypts → plaintext displayed.

### Workflow

```
Add Employee:
  Salary (plaintext) → KMSClient.send(EncryptCommand) → CiphertextBlob → Base64 → MongoDB

View Employee:
  Base64 (from MongoDB) → Buffer → KMSClient.send(DecryptCommand) → Plaintext → Display
```

### Code Location
```
services/kmsService.js
```

### Required Environment Variable
```
KMS_KEY_ID=alias/employee-salary-key
```

---

## 9. S3 Integration

### Design
- Employee photos are uploaded via Multer to a local `uploads/` temp directory.
- `uploadPhoto()` reads the temp file, uploads to S3, then **deletes the local file**.
- Only the **S3 URL** and **S3 object key** are stored in MongoDB.
- When an employee is deleted, `deletePhoto()` removes the S3 object.

### S3 Object Key Format
```
employees/photos/<timestamp>-<random>.jpg
```

### Public URL Format
```
https://<bucket-name>.s3.<region>.amazonaws.com/employees/photos/<key>
```

### Code Location
```
services/s3Service.js
```

---

## 10. JWT Authentication Flow

```
1. User submits /login with username + password
2. authController.js retrieves admin credentials from Secrets Manager
3. Credentials are compared (plain comparison — admin creds are stored plaintext)
4. On success: jwt.sign({ username, role }, jwtSecret, { expiresIn: '8h' })
5. JWT stored in HTTP-only cookie named "token"
6. All subsequent requests to /dashboard, /employees/* check the cookie
7. authMiddleware.js verifies the JWT using the Secrets Manager secret
8. On logout: cookie is cleared
```

**HTTP-only cookie** prevents JavaScript access, protecting against XSS attacks.

---

## 11. SMTP Email Flow

```
1. Employee is successfully saved to MongoDB
2. emailService.sendWelcomeEmail(employee) is called
3. SMTP credentials retrieved from Secrets Manager cache
4. Nodemailer transporter created with SMTP settings
5. HTML welcome email sent to employee's email address
6. If email fails: warning is logged, employee save is NOT rolled back
```

Email is treated as a **non-critical** operation. A failed email does not prevent the employee from being saved.

---

## 12. MongoDB Schema

```javascript
// Collection: employees
{
  employeeId:      String,   // Unique, uppercase (e.g., "EMP001")
  name:            String,   // Full name
  email:           String,   // Unique, lowercase
  phone:           String,   // Phone number
  department:      String,   // Enum of predefined departments
  encryptedSalary: String,   // Base64-encoded KMS ciphertext (NEVER plaintext)
  photoUrl:        String,   // Public S3 URL for display
  photoKey:        String,   // S3 object key for deletion
  createdAt:       Date,     // Timestamp (default: now)
}
```

**Important:** `encryptedSalary` stores the KMS ciphertext, never the actual salary. The original value can only be recovered by calling KMS decrypt.

---

## 13. Installation Steps

### Prerequisites
- Node.js ≥ 18.x ([download](https://nodejs.org))
- AWS CLI configured (`aws configure`)
- MongoDB running (Atlas or local)
- AWS account with Secrets Manager, KMS, S3 access

### Steps

```bash
# 1. Clone or copy the project
cd employee-management-system

# 2. Install dependencies
npm install

# 3. Copy environment template
cp .env.example .env

# 4. Edit .env with your values (see Section 14)
nano .env

# 5. Start the application
npm start

# Or for development with auto-reload:
npm run dev
```

---

## 14. AWS Setup Steps

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for complete step-by-step instructions.

### Quick Reference

```bash
# Create S3 bucket
aws s3api create-bucket --bucket your-bucket-name --region us-east-1

# Create KMS key
aws kms create-key --description "Employee Salary Encryption Key"

# Create KMS alias
aws kms create-alias --alias-name alias/employee-salary-key --target-key-id <key-id>

# Create secrets
aws secretsmanager create-secret \
  --name emp-mgmt/admin-credentials \
  --secret-string '{"username":"admin","password":"YourStrongPassword123!"}'
```

---

## 15. IAM Permissions Required

Create an IAM Role (for EC2) or IAM User (for local dev) with this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "SecretsManagerAccess",
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": "arn:aws:secretsmanager:<region>:<account-id>:secret:emp-mgmt/*"
    },
    {
      "Sid": "KMSAccess",
      "Effect": "Allow",
      "Action": [
        "kms:Encrypt",
        "kms:Decrypt",
        "kms:DescribeKey"
      ],
      "Resource": "arn:aws:kms:<region>:<account-id>:key/<your-key-id>"
    },
    {
      "Sid": "S3Access",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:PutObjectAcl"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    },
    {
      "Sid": "S3BucketAccess",
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name"
    }
  ]
}
```

---

## 16. EC2 Deployment Steps

```bash
# 1. Launch EC2 (Amazon Linux 2023 or Ubuntu 22.04)
#    - Attach IAM Role with permissions above
#    - Open Security Group port 3000 (or 80)

# 2. Connect via SSH
ssh -i your-key.pem ec2-user@<ec2-public-ip>

# 3. Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# 4. Copy project files (use SCP, git clone, or S3)
git clone https://github.com/your-repo/employee-management-system.git
cd employee-management-system

# 5. Install dependencies
npm install --production

# 6. Create .env
cp .env.example .env
nano .env  # Set AWS_REGION, S3_BUCKET_NAME, KMS_KEY_ID, PORT

# 7. Run as a background service (using pm2)
sudo npm install -g pm2
pm2 start server.js --name "ems"
pm2 startup
pm2 save

# 8. Access the application
# http://<ec2-public-ip>:3000
```

---

## 17. Application Workflow

### Add Employee Workflow
```
User fills form → POST /employees/add
  → Multer saves photo to uploads/ (temp)
  → S3Service.uploadPhoto() → S3 PutObject → returns URL + key
  → KMSService.encryptSalary() → KMS Encrypt → returns Base64
  → Employee.save() → MongoDB insert
  → EmailService.sendWelcomeEmail() → SMTP → welcome email
  → Redirect to /employees?success=...
```

### View Employee Workflow
```
User clicks "View" → GET /employees/:id
  → Employee.findById() → MongoDB fetch
  → KMSService.decryptSalary() → KMS Decrypt → plaintext salary
  → Render employeeDetails.ejs with decrypted salary
```

### Delete Employee Workflow
```
User confirms delete → POST /employees/:id/delete
  → Employee.findById() → get photoKey
  → S3Service.deletePhoto(photoKey) → S3 DeleteObject
  → Employee.findByIdAndDelete() → MongoDB delete
  → Redirect to /employees?success=...
```

---

## 18. Testing Procedure

### Manual Testing Checklist

```
[ ] Login with correct credentials → should redirect to dashboard
[ ] Login with wrong password → should show error
[ ] Access /dashboard without token → should redirect to /login
[ ] Add employee with all fields → should succeed with email confirmation
[ ] Add employee with duplicate ID → should show error
[ ] View employee → salary should be decrypted (not ciphertext)
[ ] Delete employee → record removed from DB, photo removed from S3
[ ] Logout → cookie cleared, redirect to login
[ ] Access any route after logout → redirect to login
```

### Verify AWS Integration

```bash
# Check Secrets Manager secret was fetched (look at startup logs)
# You should see: "✅ Secret retrieved and cached: emp-mgmt/..."

# Check S3 photo was uploaded
aws s3 ls s3://your-bucket-name/employees/photos/

# Check MongoDB record has encrypted salary (not plaintext)
# Use MongoDB Compass or mongosh:
db.employees.findOne({}, { encryptedSalary: 1 })
# Should show a long Base64 string, NOT the actual number

# Verify KMS decrypt works by viewing employee details page
# Salary should show as a readable number (e.g., $75,000)
```

---

## 19. Troubleshooting Guide

| Problem | Cause | Solution |
|---|---|---|
| `AccessDeniedException` on startup | IAM permissions missing | Attach the IAM policy from Section 15 |
| `ResourceNotFoundException` | Secret not created in Secrets Manager | Run `aws secretsmanager create-secret ...` |
| `KMS.InvalidKeyUsageException` | KMS key type wrong | Create key with key usage: `ENCRYPT_DECRYPT` |
| MongoDB connection failed | Wrong secret format | Check `emp-mgmt/mongodb` has `uri` or all individual fields |
| Photos not displaying | S3 bucket not public | Enable public access on S3 bucket (see SETUP_GUIDE.md) |
| Email not sending | Wrong SMTP credentials | Verify `emp-mgmt/smtp-credentials` secret values |
| `TokenExpiredError` in logs | JWT expired after 8 hours | Re-login to get a new token |
| `Error: KMS_KEY_ID is not set` | Missing `.env` variable | Add `KMS_KEY_ID=alias/...` to `.env` |

---

## 20. Future Enhancements

- [ ] **AWS CloudWatch** — Centralized logging and metrics
- [ ] **AWS SES** — Replace SMTP with Amazon SES for email delivery
- [ ] **AWS RDS** — Replace MongoDB with Amazon DocumentDB (MongoDB-compatible)
- [ ] **HTTPS / SSL** — Add SSL certificate using AWS Certificate Manager + ALB
- [ ] **Password Hashing** — Hash admin password with bcrypt in Secrets Manager
- [ ] **Employee Search** — Server-side search with pagination
- [ ] **Department Management** — CRUD for departments
- [ ] **Export to CSV** — Download employee data
- [ ] **Audit Log** — Track all actions with timestamps
- [ ] **Multi-Admin** — Support multiple admin users stored in DynamoDB
