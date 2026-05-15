const Book = require('../models/Book.model');
const User = require('../models/User.model');
const Assignment = require('../models/Assignment.model');

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get dashboard summary statistics
// @route   GET /api/dashboard/stats
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalBooks,
      totalUsers,
      totalAssignments,
      overdueAssignments,
      availableBooks,
      activeUsers,
      recentBooks,
      recentAssignments,
      categoryStats,
    ] = await Promise.all([
      Book.countDocuments(),
      User.countDocuments(),
      Assignment.countDocuments({ status: { $in: ['Issued', 'Overdue'] } }),
      Assignment.countDocuments({ status: 'Overdue' }),
      Book.countDocuments({ status: 'Available' }),
      User.countDocuments({ status: 'Active' }),
      Book.find().sort({ createdAt: -1 }).limit(5).lean({ virtuals: true }),
      Assignment.find({ status: { $in: ['Issued', 'Overdue'] } })
        .sort({ issueDate: -1 })
        .limit(5)
        .lean({ virtuals: true }),
      Book.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 },
      ]),
    ]);

    // Calculate books returned this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const returnedThisMonth = await Assignment.countDocuments({
      status: 'Returned',
      returnDate: { $gte: startOfMonth },
    });

    res.json({
      stats: {
        totalBooks,
        totalUsers,
        totalAssignments,
        overdueAssignments,
        availableBooks,
        activeUsers,
        returnedThisMonth,
        borrowedBooks: totalBooks - availableBooks,
      },
      recentBooks,
      recentAssignments,
      categoryStats: categoryStats.map((c) => ({ category: c._id, count: c.count })),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats };
