/**
 * controllers/dashboardController.js
 * ====================================
 * Handles the main dashboard page.
 * Displays total employee count and quick action buttons.
 */

'use strict';

const Employee = require('../models/Employee');

/**
 * GET /dashboard
 * Renders the dashboard with employee statistics.
 */
const getDashboard = async (req, res) => {
  try {
    const [totalEmployees, departmentStats] = await Promise.all([
      Employee.countDocuments(),
      Employee.aggregate([
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
    ]);

    res.render('dashboard', {
      title: 'Dashboard | Employee Management System',
      user: req.user,
      totalEmployees,
      departmentStats,
    });

  } catch (error) {
    console.error('❌ Dashboard error:', error.message);
    res.status(500).render('error', {
      title: 'Error | Employee Management System',
      message: 'Failed to load dashboard. Please try again.',
      user: req.user,
    });
  }
};

module.exports = { getDashboard };
