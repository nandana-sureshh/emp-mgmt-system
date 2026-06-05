/**
 * controllers/employeeController.js
 * ====================================
 * Handles all employee CRUD operations.
 *
 * Actions:
 *   GET  /employees              → List all employees
 *   GET  /employees/add          → Show Add Employee form
 *   POST /employees/add          → Create new employee (S3 + KMS + Email)
 *   GET  /employees/:id          → View employee details (KMS decrypt)
 *   POST /employees/:id/delete   → Delete employee (MongoDB + S3)
 */

'use strict';

const Employee = require('../models/Employee');
const { encryptSalary, decryptSalary } = require('../services/kmsService');
const { uploadPhoto, deletePhoto } = require('../services/s3Service');
const { sendWelcomeEmail } = require('../services/emailService');

// ── GET /employees ──────────────────────────────────────────────────────────

/**
 * Lists all employees in a Bootstrap table.
 */
const getEmployeeList = async (req, res) => {
  try {
    const employees = await Employee.find({}).sort({ createdAt: -1 });
    const success = req.query.success || null;
    const error = req.query.error || null;

    res.render('employeeList', {
      title: 'Employee List | Employee Management System',
      user: req.user,
      employees,
      success,
      error,
    });
  } catch (err) {
    console.error('❌ Employee list error:', err.message);
    res.status(500).render('error', {
      title: 'Error | Employee Management System',
      message: 'Failed to load employee list.',
      user: req.user,
    });
  }
};

// ── GET /employees/add ──────────────────────────────────────────────────────

/**
 * Renders the Add Employee form.
 */
const getAddEmployeePage = (req, res) => {
  res.render('addEmployee', {
    title: 'Add Employee | Employee Management System',
    user: req.user,
    error: null,
    success: null,
  });
};

// ── POST /employees/add ─────────────────────────────────────────────────────

/**
 * Creates a new employee:
 *   1. Upload photo to AWS S3
 *   2. Encrypt salary using AWS KMS
 *   3. Save employee to MongoDB
 *   4. Send welcome email via SMTP (non-critical)
 */
const addEmployee = async (req, res) => {
  const { employeeId, name, email, phone, department, salary } = req.body;

  // Validate required fields
  if (!employeeId || !name || !email || !phone || !department || !salary) {
    return res.render('addEmployee', {
      title: 'Add Employee | Employee Management System',
      user: req.user,
      error: 'All fields are required. Please fill in every field.',
      success: null,
    });
  }

  let uploadedPhotoKey = null; // Track for cleanup on error

  try {
    // ── Step 1: Check for duplicate Employee ID or Email ──────────────────
    const existing = await Employee.findOne({
      $or: [
        { employeeId: employeeId.toUpperCase() },
        { email: email.toLowerCase() },
      ],
    });

    if (existing) {
      const field = existing.employeeId === employeeId.toUpperCase() ? 'Employee ID' : 'Email';
      return res.render('addEmployee', {
        title: 'Add Employee | Employee Management System',
        user: req.user,
        error: `An employee with this ${field} already exists.`,
        success: null,
      });
    }

    // ── Step 2: Upload Photo to AWS S3 ────────────────────────────────────
    let photoUrl = null;
    let photoKey = null;

    if (req.file) {
      console.log(`📸 Uploading photo to S3 for employee: ${employeeId}`);
      const s3Result = await uploadPhoto(req.file);
      photoUrl = s3Result.url;
      photoKey = s3Result.key;
      uploadedPhotoKey = photoKey; // Track for potential cleanup
    }

    // ── Step 3: Encrypt Salary using AWS KMS ─────────────────────────────
    console.log(`🔒 Encrypting salary for employee: ${employeeId}`);
    const encryptedSalary = await encryptSalary(salary);

    // ── Step 4: Save Employee to MongoDB ──────────────────────────────────
    const employee = new Employee({
      employeeId: employeeId.trim().toUpperCase(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      department,
      encryptedSalary,
      photoUrl,
      photoKey,
    });

    await employee.save();
    console.log(`✅ Employee saved to MongoDB: ${employeeId}`);

    // ── Step 5: Send Welcome Email (non-critical) ─────────────────────────
    try {
      await sendWelcomeEmail({ name, email, employeeId, department });
    } catch (emailError) {
      // Email failure should NOT block the user's success
      console.warn(`⚠️  Welcome email failed for ${email}: ${emailError.message}`);
    }

    // ── Redirect to Employee List with success message ────────────────────
    return res.redirect(
      `/employees?success=Employee "${name}" (${employeeId}) added successfully!`
    );

  } catch (err) {
    console.error('❌ Add employee error:', err.message);

    // Attempt to clean up S3 photo if MongoDB save failed
    if (uploadedPhotoKey) {
      try {
        await deletePhoto(uploadedPhotoKey);
        console.log('🧹 Cleaned up S3 photo after failed employee save');
      } catch (cleanupErr) {
        console.error('⚠️  Failed to clean up S3 photo:', cleanupErr.message);
      }
    }

    return res.render('addEmployee', {
      title: 'Add Employee | Employee Management System',
      user: req.user,
      error: `Failed to add employee: ${err.message}`,
      success: null,
    });
  }
};

// ── GET /employees/:id ──────────────────────────────────────────────────────

/**
 * Displays a single employee's details.
 * Decrypts the salary using AWS KMS before rendering.
 */
const getEmployeeDetails = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.status(404).render('error', {
        title: '404 | Employee Management System',
        message: 'Employee not found.',
        user: req.user,
      });
    }

    // Decrypt salary using AWS KMS
    console.log(`🔓 Decrypting salary for employee: ${employee.employeeId}`);
    const decryptedSalary = await decryptSalary(employee.encryptedSalary);

    res.render('employeeDetails', {
      title: `${employee.name} | Employee Management System`,
      user: req.user,
      employee,
      salary: decryptedSalary,
    });

  } catch (err) {
    console.error('❌ Employee details error:', err.message);
    res.status(500).render('error', {
      title: 'Error | Employee Management System',
      message: 'Failed to load employee details. KMS decryption may have failed.',
      user: req.user,
    });
  }
};

// ── POST /employees/:id/delete ──────────────────────────────────────────────

/**
 * Deletes an employee record and their S3 photo.
 *   1. Delete photo from AWS S3
 *   2. Delete employee record from MongoDB
 */
const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return res.redirect('/employees?error=Employee not found.');
    }

    const employeeName = employee.name;
    const employeeId = employee.employeeId;

    // ── Step 1: Delete Photo from AWS S3 ─────────────────────────────────
    if (employee.photoKey) {
      console.log(`🗑️  Deleting S3 photo for employee: ${employeeId}`);
      try {
        await deletePhoto(employee.photoKey);
      } catch (s3Err) {
        // Log but continue — employee should still be deleted from DB
        console.warn(`⚠️  S3 photo deletion failed: ${s3Err.message}`);
      }
    }

    // ── Step 2: Delete from MongoDB ───────────────────────────────────────
    await Employee.findByIdAndDelete(req.params.id);
    console.log(`✅ Employee deleted from MongoDB: ${employeeId}`);

    return res.redirect(
      `/employees?success=Employee "${employeeName}" (${employeeId}) deleted successfully.`
    );

  } catch (err) {
    console.error('❌ Delete employee error:', err.message);
    return res.redirect(`/employees?error=Failed to delete employee: ${err.message}`);
  }
};

module.exports = {
  getEmployeeList,
  getAddEmployeePage,
  addEmployee,
  getEmployeeDetails,
  deleteEmployee,
};
