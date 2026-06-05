# SETUP_GUIDE.md — Employee Management System

> **Audience:** Beginner AWS Cloud Engineers
> **Goal:** Configure all required AWS resources and get the application running from scratch

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Creating an S3 Bucket](#2-creating-an-s3-bucket)
3. [Creating a KMS Key](#3-creating-a-kms-key)
4. [Creating Secrets in AWS Secrets Manager](#4-creating-secrets-in-aws-secrets-manager)
5. [Creating IAM Roles and Policies](#5-creating-iam-roles-and-policies)
6. [Configuring MongoDB](#6-configuring-mongodb)
7. [Configuring SMTP](#7-configuring-smtp)
8. [Configuring the .env File](#8-configuring-the-env-file)
9. [Running the Application Locally](#9-running-the-application-locally)
10. [Deploying to EC2](#10-deploying-to-ec2)

---

## 1. Prerequisites

Before starting, make sure you have:

- ✅ An **AWS Account** (Free Tier works)
- ✅ **AWS CLI** installed and configured
- ✅ **Node.js 18+** installed
- ✅ A **MongoDB** database (MongoDB Atlas free tier is recommended for beginners)
- ✅ A **Gmail account** (or other SMTP provider) for sending emails

### Install AWS CLI

**Windows:**
1. Download the installer: https://aws.amazon.com/cli/
2. Run the `.msi` installer
3. Open a new terminal and run: `aws --version`

**Linux (Amazon Linux / Ubuntu):**
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
aws --version
```

### Configure AWS CLI

```bash
aws configure
```

You will be prompted for:
- **AWS Access Key ID** — from your IAM user
- **AWS Secret Access Key** — from your IAM user
- **Default region name** — e.g., `us-east-1`
- **Default output format** — enter `json`

> **On EC2:** You do NOT need to configure credentials. Instead, attach an IAM Role to the EC2 instance.

---

## 2. Creating an S3 Bucket

The S3 bucket stores employee profile photos.

### Step 1: Go to S3 in AWS Console
1. Open the **AWS Console** → Search for **S3** → Click **S3**
2. Click **"Create bucket"**

### Step 2: Configure the Bucket
Fill in the settings:

| Setting | Value |
|---|---|
| Bucket name | `your-company-employee-photos` (must be globally unique) |
| AWS Region | `us-east-1` (or your preferred region) |
| Object Ownership | ACLs disabled (recommended) |
| Block Public Access | ❌ Uncheck "Block all public access" |
| Versioning | Disabled |
| Encryption | Amazon S3-managed keys (SSE-S3) |

> ⚠️ **Important:** Uncheck "Block all public access" so employee photos can be displayed in the app. Acknowledge the warning that appears.

### Step 3: Add a Bucket Policy for Public Read

After creating the bucket:
1. Click on your bucket → **Permissions** tab
2. Scroll to **Bucket policy** → click **Edit**
3. Paste this policy (replace `your-bucket-name`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

4. Click **Save changes**

### Step 4: Note the Bucket Name
Write down your bucket name — you will need it for the `.env` file:
```
S3_BUCKET_NAME=your-company-employee-photos
```

### Using AWS CLI (Alternative)
```bash
# Create bucket
aws s3api create-bucket \
  --bucket your-company-employee-photos \
  --region us-east-1

# Note: For regions other than us-east-1, add:
# --create-bucket-configuration LocationConstraint=<region>

# Disable block public access
aws s3api put-public-access-block \
  --bucket your-company-employee-photos \
  --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"
```

---

## 3. Creating a KMS Key

The KMS key is used to encrypt and decrypt employee salary data.

### Step 1: Go to KMS in AWS Console
1. Open **AWS Console** → Search for **KMS** → Click **Key Management Service**
2. Click **"Create key"**

### Step 2: Configure the Key
| Setting | Value |
|---|---|
| Key type | Symmetric |
| Key usage | Encrypt and decrypt |
| Key material origin | KMS |

Click **Next**.

### Step 3: Add a Label
| Setting | Value |
|---|---|
| Alias | `employee-salary-key` |
| Description | `Key for encrypting employee salary data` |

Click **Next**.

### Step 4: Key Administrators
- Select your IAM user or role as the key administrator
- Click **Next**

### Step 5: Key Users
- Select the IAM Role or user that the application will use
- This allows the application to call Encrypt/Decrypt
- Click **Next**

### Step 6: Review and Create
- Review the key policy
- Click **Finish**

### Step 7: Note the Key ARN and Alias
After creation, you'll see a Key ARN like:
```
arn:aws:kms:us-east-1:123456789012:key/abcdef12-1234-1234-1234-abcdef123456
```

You can use either the ARN or alias in your `.env`:
```
KMS_KEY_ID=alias/employee-salary-key
```

### Using AWS CLI (Alternative)
```bash
# Create the key
aws kms create-key \
  --description "Employee Salary Encryption Key" \
  --key-usage ENCRYPT_DECRYPT \
  --origin AWS_KMS

# Note the KeyId from the output, then create an alias:
aws kms create-alias \
  --alias-name alias/employee-salary-key \
  --target-key-id <KeyId-from-above>
```

---

## 4. Creating Secrets in AWS Secrets Manager

You need to create **5 secrets** in AWS Secrets Manager.

> **Rule:** Never put the actual secret values in your application code or `.env` file. Only secret names (keys) go in `.env`.

### Go to Secrets Manager
1. Open **AWS Console** → Search for **Secrets Manager** → Click **Secrets Manager**
2. Click **"Store a new secret"** for each secret below

---

### Secret 1: MongoDB Credentials

| Setting | Value |
|---|---|
| Secret type | Other type of secret |
| Secret name | `emp-mgmt/mongodb` |

**Key/Value pairs — Option A (Full URI):**
| Key | Value |
|---|---|
| `uri` | `mongodb+srv://username:password@cluster.mongodb.net/employeedb` |

**Key/Value pairs — Option B (Individual fields):**
| Key | Value |
|---|---|
| `username` | `your-mongo-username` |
| `password` | `your-mongo-password` |
| `host` | `your-mongo-host` (e.g., `cluster.mongodb.net`) |
| `port` | `27017` |
| `database` | `employeedb` |

> 💡 **Tip:** For MongoDB Atlas, use Option A with the full connection string from your Atlas dashboard.

---

### Secret 2: Admin Login Credentials

| Setting | Value |
|---|---|
| Secret type | Other type of secret |
| Secret name | `emp-mgmt/admin-credentials` |

**Key/Value pairs:**
| Key | Value |
|---|---|
| `username` | `admin` |
| `password` | `YourStrongPassword123!` |

> 🔒 Use a strong password. This is what you type on the login page.

---

### Secret 3: JWT Secret

| Setting | Value |
|---|---|
| Secret type | Other type of secret |
| Secret name | `emp-mgmt/jwt-secret` |

**Key/Value pairs:**
| Key | Value |
|---|---|
| `secret` | `your-very-long-random-jwt-secret-key-at-least-32-characters` |

> 💡 **Generate a strong random secret:**
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

---

### Secret 4: SMTP Email Credentials

| Setting | Value |
|---|---|
| Secret type | Other type of secret |
| Secret name | `emp-mgmt/smtp-credentials` |

**Key/Value pairs (for Gmail):**
| Key | Value |
|---|---|
| `host` | `smtp.gmail.com` |
| `port` | `587` |
| `username` | `your-email@gmail.com` |
| `password` | `your-gmail-app-password` |

> 📧 **Gmail App Password Setup:**
> 1. Go to your Google Account → Security
> 2. Enable **2-Step Verification**
> 3. Go to Security → **App Passwords**
> 4. Select "Mail" and "Other (Custom name)"
> 5. Enter "Employee Management System"
> 6. Copy the 16-character password — this is your SMTP password

**For other providers:**
| Provider | Host | Port |
|---|---|---|
| Outlook/Hotmail | `smtp-mail.outlook.com` | `587` |
| Yahoo | `smtp.mail.yahoo.com` | `587` |
| AWS SES | `email-smtp.<region>.amazonaws.com` | `587` |

---

### Secret 5: SSH Private Key

| Setting | Value |
|---|---|
| Secret type | Other type of secret |
| Secret name | `emp-mgmt/ssh-private-key` |

**Key/Value pairs:**
| Key | Value |
|---|---|
| `privateKey` | `-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCA...` |

> 💡 **Purpose:** This secret demonstrates that AWS Secrets Manager can store any text-based secret, not just usernames and passwords. SSH private keys, API keys, certificates, etc. can all be securely stored.
>
> **Generate a test SSH key pair (Linux/Mac):**
> ```bash
> ssh-keygen -t rsa -b 2048 -C "ems-test-key" -f test_key
> cat test_key  # Copy the private key content
> ```
>
> Store the private key content (including BEGIN/END lines) as the value of `privateKey`.

---

### Using AWS CLI to Create All Secrets

```bash
# Secret 1: MongoDB
aws secretsmanager create-secret \
  --name "emp-mgmt/mongodb" \
  --description "MongoDB connection credentials" \
  --secret-string '{"uri":"mongodb+srv://user:pass@cluster.mongodb.net/employeedb"}'

# Secret 2: Admin credentials
aws secretsmanager create-secret \
  --name "emp-mgmt/admin-credentials" \
  --description "Admin login credentials" \
  --secret-string '{"username":"admin","password":"YourStrongPassword123!"}'

# Secret 3: JWT Secret
aws secretsmanager create-secret \
  --name "emp-mgmt/jwt-secret" \
  --description "JWT signing secret" \
  --secret-string '{"secret":"your-very-long-random-jwt-secret-key-here"}'

# Secret 4: SMTP Credentials
aws secretsmanager create-secret \
  --name "emp-mgmt/smtp-credentials" \
  --description "SMTP email credentials" \
  --secret-string '{"host":"smtp.gmail.com","port":587,"username":"your@gmail.com","password":"your-app-password"}'

# Secret 5: SSH Private Key
aws secretsmanager create-secret \
  --name "emp-mgmt/ssh-private-key" \
  --description "SSH private key (demonstration)" \
  --secret-string '{"privateKey":"-----BEGIN RSA PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END RSA PRIVATE KEY-----"}'
```

---

## 5. Creating IAM Roles and Policies

### For EC2 Deployment (Recommended)

When running on EC2, use an **IAM Role** — no credentials needed in code.

#### Step 1: Create the IAM Policy

1. Go to **AWS Console** → **IAM** → **Policies** → **Create policy**
2. Click the **JSON** tab
3. Paste the following policy (replace `<region>`, `<account-id>`, `<key-id>`, `your-bucket-name`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "SecretsManagerReadAccess",
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": "arn:aws:secretsmanager:us-east-1:123456789012:secret:emp-mgmt/*"
    },
    {
      "Sid": "KMSEncryptDecrypt",
      "Effect": "Allow",
      "Action": [
        "kms:Encrypt",
        "kms:Decrypt",
        "kms:GenerateDataKey",
        "kms:DescribeKey"
      ],
      "Resource": "arn:aws:kms:us-east-1:123456789012:key/YOUR-KEY-ID"
    },
    {
      "Sid": "S3PhotoManagement",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    },
    {
      "Sid": "S3ListBucket",
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::your-bucket-name"
    }
  ]
}
```

4. Click **Next** → Name it `EmployeeManagementSystemPolicy`
5. Click **Create policy**

#### Step 2: Create the IAM Role

1. Go to **IAM** → **Roles** → **Create role**
2. **Trusted entity type:** AWS service
3. **Use case:** EC2
4. Click **Next**
5. Search for and attach `EmployeeManagementSystemPolicy`
6. Click **Next** → Name it `EMSApplicationRole`
7. Click **Create role**

#### Step 3: Attach the Role to EC2

When launching an EC2 instance:
1. In the **Configure Instance Details** step
2. Find **IAM role** dropdown
3. Select `EMSApplicationRole`

Or attach to a running instance:
1. EC2 Console → Select your instance
2. **Actions** → **Security** → **Modify IAM Role**
3. Select `EMSApplicationRole` → **Update IAM Role**

---

### For Local Development (IAM User)

If you're running locally without EC2:

1. Go to **IAM** → **Users** → **Create user**
2. Name it `ems-local-dev`
3. Attach the `EmployeeManagementSystemPolicy` directly
4. Create **Access Keys**: User → **Security credentials** → **Create access key**
5. Add to `.env` (only for local — NOT for EC2!):

```env
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=your-secret-key
```

---

## 6. Configuring MongoDB

### Option A: MongoDB Atlas (Recommended for Beginners)

MongoDB Atlas is a cloud-hosted MongoDB service with a free tier.

#### Step 1: Create Atlas Account
1. Go to https://cloud.mongodb.com
2. Sign up for free
3. Create a new organization and project

#### Step 2: Create a Free Cluster
1. Click **"Build a Database"**
2. Choose **Free (M0 Sandbox)**
3. Select a cloud provider and region (choose the same region as your EC2)
4. Click **Create**

#### Step 3: Create a Database User
1. Go to **Security** → **Database Access**
2. Click **"Add New Database User"**
3. Authentication method: **Password**
4. Username: `ems-app-user`
5. Password: (auto-generate and save it)
6. Built-in Role: **Read and Write to Any Database**
7. Click **Add User**

#### Step 4: Allow Network Access
1. Go to **Security** → **Network Access**
2. Click **"Add IP Address"**
3. For testing: Click **"Allow Access from Anywhere"** (`0.0.0.0/0`)
4. For production: Add only your EC2 instance's Elastic IP
5. Click **Confirm**

#### Step 5: Get Connection String
1. Go to **Deployment** → **Database**
2. Click **Connect** on your cluster
3. Choose **"Connect your application"**
4. Driver: **Node.js**, Version: **5.5 or later**
5. Copy the connection string (looks like):
   ```
   mongodb+srv://ems-app-user:<password>@cluster0.xxxxx.mongodb.net/
   ```
6. Replace `<password>` with your actual password
7. Add the database name: `mongodb+srv://ems-app-user:password@cluster0.xxxxx.mongodb.net/employeedb`

#### Step 6: Store in Secrets Manager
Use this as your `emp-mgmt/mongodb` secret value:
```json
{
  "uri": "mongodb+srv://ems-app-user:yourpassword@cluster0.xxxxx.mongodb.net/employeedb"
}
```

---

### Option B: MongoDB on EC2 (Self-Hosted)

```bash
# Install MongoDB on Ubuntu
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# Install MongoDB on Amazon Linux
sudo yum install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# Create database user
mongosh
use admin
db.createUser({
  user: "ems-app-user",
  pwd: "SecurePassword123!",
  roles: [{ role: "readWrite", db: "employeedb" }]
})
exit
```

Store in Secrets Manager:
```json
{
  "username": "ems-app-user",
  "password": "SecurePassword123!",
  "host": "localhost",
  "port": "27017",
  "database": "employeedb"
}
```

---

## 7. Configuring SMTP

### Gmail Setup (Recommended)

Gmail requires an **App Password** (not your regular Gmail password) when 2FA is enabled.

#### Step 1: Enable 2-Factor Authentication on Gmail
1. Go to https://myaccount.google.com/security
2. Click **"2-Step Verification"**
3. Follow the setup process

#### Step 2: Generate App Password
1. Go to https://myaccount.google.com/apppasswords
2. Select app: **Mail**
3. Select device: **Other (Custom name)**
4. Type: `Employee Management System`
5. Click **Generate**
6. **Copy the 16-character password** (shown once — save it!)

#### Step 3: Store in Secrets Manager
```json
{
  "host": "smtp.gmail.com",
  "port": 587,
  "username": "your-email@gmail.com",
  "password": "abcd efgh ijkl mnop"
}
```
(The 16-character app password — spaces are optional)

---

### AWS SES (Production Alternative)

For production, use Amazon Simple Email Service (SES):

```bash
# Verify your email address in SES
aws ses verify-email-identity --email-address your-email@company.com

# Create SMTP credentials
aws iam create-user --user-name ses-smtp-user
aws iam attach-user-policy \
  --user-name ses-smtp-user \
  --policy-arn arn:aws:iam::aws:policy/AmazonSESFullAccess
```

SES SMTP settings:
```json
{
  "host": "email-smtp.us-east-1.amazonaws.com",
  "port": 587,
  "username": "SMTP_username_from_SES_console",
  "password": "SMTP_password_from_SES_console"
}
```

---

## 8. Configuring the .env File

After all AWS resources are created, configure your `.env`:

```bash
# Copy the template
cp .env.example .env
```

Edit `.env` with your values:

```env
# Server
PORT=3000
NODE_ENV=development

# AWS (non-secret configuration)
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-company-employee-photos
KMS_KEY_ID=alias/employee-salary-key

# Secret names in AWS Secrets Manager (NOT the actual values!)
SECRET_MONGO=emp-mgmt/mongodb
SECRET_ADMIN=emp-mgmt/admin-credentials
SECRET_JWT=emp-mgmt/jwt-secret
SECRET_SMTP=emp-mgmt/smtp-credentials
SECRET_SSH=emp-mgmt/ssh-private-key

# AWS Credentials (only for local dev - remove when on EC2!)
# AWS_ACCESS_KEY_ID=AKIA...
# AWS_SECRET_ACCESS_KEY=...
```

> ⚠️ **Never commit `.env` to Git.** The `.gitignore` should already exclude it.

---

## 9. Running the Application Locally

```bash
# Navigate to project
cd employee-management-system

# Install dependencies
npm install

# Verify .env is configured
cat .env

# Start in development mode (with auto-reload)
npm run dev

# Start in production mode
npm start
```

### Expected Startup Output

```
╔═══════════════════════════════════════════════════════╗
║       Employee Management System — Starting Up        ║
╚═══════════════════════════════════════════════════════╝

  Region:       us-east-1
  S3 Bucket:    your-company-employee-photos
  KMS Key:      alias/employee-salary-key
  Environment:  development

📦 Pre-loading all secrets from AWS Secrets Manager...
   🔑 Fetching secret: emp-mgmt/mongodb
   ✅ Secret retrieved and cached: emp-mgmt/mongodb
   🔑 Fetching secret: emp-mgmt/admin-credentials
   ✅ Secret retrieved and cached: emp-mgmt/admin-credentials
   ... (all 5 secrets loaded)
✅ All secrets loaded successfully.

🔑 Retrieving MongoDB credentials from AWS Secrets Manager...
✅ MongoDB Connected Successfully
   Host: cluster0.xxxxx.mongodb.net
   Database: employeedb

╔═══════════════════════════════════════════════════════╗
║   ✅  Server running at http://localhost:3000          ║
╠═══════════════════════════════════════════════════════╣
║   🔒  AWS Secrets Manager: Enabled                    ║
║   🔑  AWS KMS Encryption:  Enabled                    ║
║   📦  AWS S3 Storage:      Enabled                    ║
║   🛡️   JWT Authentication:  Enabled                    ║
║   📧  SMTP Email Service:  Enabled                    ║
╚═══════════════════════════════════════════════════════╝
```

Open your browser at **http://localhost:3000**

---

## 10. Deploying to EC2

### Step 1: Launch EC2 Instance

1. Go to **EC2** → **Launch Instance**
2. Configure:
   | Setting | Value |
   |---|---|
   | Name | `employee-management-system` |
   | AMI | Amazon Linux 2023 (Free Tier) |
   | Instance type | t2.micro (Free Tier) |
   | Key pair | Create or select your key pair |
   | Security Group | Allow SSH (22), HTTP (80), Custom TCP (3000) |
   | IAM Instance Profile | `EMSApplicationRole` |

3. Launch the instance

### Step 2: Connect to EC2

```bash
ssh -i your-key.pem ec2-user@<EC2-PUBLIC-IP>
```

### Step 3: Install Node.js

```bash
# Amazon Linux 2023
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs

# Verify
node --version
npm --version
```

### Step 4: Copy the Application

**Option A: Using SCP from your local machine:**
```bash
# From your local machine (not EC2):
scp -i your-key.pem -r ./employee-management-system ec2-user@<EC2-IP>:~/
```

**Option B: Using Git:**
```bash
# On EC2:
sudo dnf install -y git
git clone https://github.com/your-repo/employee-management-system.git
```

### Step 5: Install Dependencies

```bash
cd employee-management-system
npm install --production
```

### Step 6: Configure .env

```bash
cp .env.example .env
nano .env
```

Fill in `AWS_REGION`, `S3_BUCKET_NAME`, `KMS_KEY_ID`, `PORT`.

> On EC2 with IAM Role, **do NOT add** `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY`.

### Step 7: Test Manual Start

```bash
node server.js
```

If it starts successfully, press `Ctrl+C` to stop.

### Step 8: Install PM2 (Process Manager)

PM2 keeps the application running after you disconnect from SSH.

```bash
sudo npm install -g pm2

# Start the application
pm2 start server.js --name "ems"

# Make PM2 start on system reboot
pm2 startup
# (run the command it outputs, e.g., sudo env PATH=...)
pm2 save

# Check status
pm2 status
pm2 logs ems
```

### Step 9: Access the Application

Open your browser:
```
http://<EC2-PUBLIC-IP>:3000
```

### Step 10 (Optional): Set Up Nginx Reverse Proxy on Port 80

```bash
sudo dnf install -y nginx

sudo nano /etc/nginx/conf.d/ems.conf
```

Paste:
```nginx
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
sudo systemctl start nginx
sudo systemctl enable nginx

# Test config
sudo nginx -t

# Reload
sudo systemctl reload nginx
```

Now access at: `http://<EC2-PUBLIC-IP>` (no port needed)

---

## Verification Checklist

After completing setup, verify each component:

```
AWS Resources:
[ ] S3 bucket created and public access enabled
[ ] KMS key created with alias
[ ] All 5 secrets created in Secrets Manager
[ ] IAM Role created with correct permissions
[ ] IAM Role attached to EC2 instance

Application:
[ ] .env file configured (no secrets — only names!)
[ ] npm install completed without errors
[ ] Application starts without errors
[ ] All 5 secrets loaded in startup logs

Functional Testing:
[ ] Login page loads
[ ] Login succeeds with admin credentials
[ ] Dashboard shows employee count
[ ] Add Employee form works
[ ] Photo appears in S3 after upload
[ ] Salary is encrypted in MongoDB (not plaintext)
[ ] Employee details shows decrypted salary
[ ] Welcome email received
[ ] Delete removes from DB and S3
[ ] Logout clears session
```

---

## Common Errors and Fixes

| Error | Fix |
|---|---|
| `AccessDeniedException` | IAM Role missing the required permission. Check Section 5. |
| `ResourceNotFoundException` | Secret doesn't exist in Secrets Manager. Re-check secret names match `.env`. |
| `NoCredentialsError` | Not on EC2 with IAM Role, and no credentials in `.env`. Configure AWS CLI or add keys to `.env`. |
| `MongoServerError: bad auth` | Wrong MongoDB credentials in the secret. Update the `emp-mgmt/mongodb` secret. |
| `Error: Invalid login` (SMTP) | Gmail App Password not set up correctly. See Section 7. |
| `KMS.NotFoundException` | `KMS_KEY_ID` in `.env` doesn't match the alias/key you created. |
| Photo not showing | S3 bucket not public. Apply bucket policy from Section 2. |
| Port 3000 not accessible | EC2 Security Group doesn't allow port 3000. Add inbound rule. |
