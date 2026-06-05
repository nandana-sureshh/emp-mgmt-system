/**
 * routes/employeeRoutes.js
 * Employee routes — all protected by JWT middleware.
 *
 * GET  /employees              → List all employees
 * GET  /employees/add          → Add employee form
 * POST /employees/add          → Create employee (multipart/form-data for photo)
 * GET  /employees/:id          → View employee details
 * POST /employees/:id/delete   → Delete employee
 */

'use strict';

const express = require('express');
const router = express.Router();
const {
  getEmployeeList,
  getAddEmployeePage,
  addEmployee,
  getEmployeeDetails,
  deleteEmployee,
} = require('../controllers/employeeController');
const { authMiddleware } = require('../middleware/authMiddleware');
const upload = require('../config/multer');

// Employee list
router.get('/employees', authMiddleware, getEmployeeList);

// Add employee (IMPORTANT: /add must come before /:id to avoid route conflict)
router.get('/employees/add', authMiddleware, getAddEmployeePage);
router.post('/employees/add', authMiddleware, upload.single('photo'), addEmployee);

// Employee details (view only — no edit)
router.get('/employees/:id', authMiddleware, getEmployeeDetails);

// Delete employee
router.post('/employees/:id/delete', authMiddleware, deleteEmployee);

module.exports = router;
