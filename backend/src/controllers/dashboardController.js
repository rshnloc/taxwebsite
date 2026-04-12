const User = require('../models/User');
const Application = require('../models/Application');
const Task = require('../models/Task');
const Invoice = require('../models/Invoice');
const ActivityLog = require('../models/ActivityLog');

// @route   GET /api/dashboard/admin
const getAdminDashboard = async (req, res) => {
  try {
    const [
      totalClients,
      totalEmployees,
      totalApplications,
      pendingApplications,
      inProgressApplications,
      completedApplications,
      totalRevenue,
      recentApplications,
      recentActivity,
    ] = await Promise.all([
      User.countDocuments({ role: 'client', isActive: true }),
      User.countDocuments({ role: 'employee', isActive: true }),
      Application.countDocuments(),
      Application.countDocuments({ status: { $in: ['submitted', 'under-review'] } }),
      Application.countDocuments({ status: 'in-progress' }),
      Application.countDocuments({ status: 'completed' }),
      Application.aggregate([
        { $match: { 'payment.status': 'paid' } },
        { $group: { _id: null, total: { $sum: '$payment.total' } } },
      ]),
      Application.find()
        .populate('client', 'name email')
        .populate('service', 'name')
        .sort({ createdAt: -1 })
        .limit(10),
      ActivityLog.find()
        .populate('user', 'name role')
        .sort({ createdAt: -1 })
        .limit(20),
    ]);

    // Monthly stats (last 12 months)
    const monthlyStats = await Application.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
          revenue: {
            $sum: { $cond: [{ $eq: ['$payment.status', 'paid'] }, '$payment.total', 0] },
          },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Status distribution
    const statusDistribution = await Application.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Service popularity
    const serviceStats = await Application.aggregate([
      { $group: { _id: '$service', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'services',
          localField: '_id',
          foreignField: '_id',
          as: 'service',
        },
      },
      { $unwind: '$service' },
      { $project: { name: '$service.name', count: 1 } },
    ]);

    res.json({
      stats: {
        totalClients,
        totalEmployees,
        totalApplications,
        pendingApplications,
        inProgressApplications,
        completedApplications,
        totalRevenue: totalRevenue[0]?.total || 0,
      },
      monthlyStats,
      statusDistribution,
      serviceStats,
      recentApplications,
      recentActivity,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @route   GET /api/dashboard/employee
const getEmployeeDashboard = async (req, res) => {
  try {
    const [
      totalTasks,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      assignedApplications,
      recentTasks,
    ] = await Promise.all([
      Task.countDocuments({ assignedTo: req.user._id }),
      Task.countDocuments({ assignedTo: req.user._id, status: 'pending' }),
      Task.countDocuments({ assignedTo: req.user._id, status: 'in-progress' }),
      Task.countDocuments({ assignedTo: req.user._id, status: 'completed' }),
      Application.countDocuments({ assignedEmployee: req.user._id }),
      Task.find({ assignedTo: req.user._id })
        .populate('application', 'applicationId')
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    res.json({
      stats: { totalTasks, pendingTasks, inProgressTasks, completedTasks, assignedApplications },
      recentTasks,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @route   GET /api/dashboard/client
const getClientDashboard = async (req, res) => {
  try {
    const [
      totalApplications,
      activeApplications,
      completedApplications,
      pendingPayments,
      recentApplications,
    ] = await Promise.all([
      Application.countDocuments({ client: req.user._id }),
      Application.countDocuments({ client: req.user._id, status: { $in: ['submitted', 'under-review', 'in-progress'] } }),
      Application.countDocuments({ client: req.user._id, status: 'completed' }),
      Application.countDocuments({ client: req.user._id, 'payment.status': 'pending' }),
      Application.find({ client: req.user._id })
        .populate('service', 'name slug icon')
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    res.json({
      stats: { totalApplications, activeApplications, completedApplications, pendingPayments },
      recentApplications,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @route   GET /api/dashboard/reports
const getReports = async (req, res) => {
  try {
    const { period = 'monthly', year = new Date().getFullYear() } = req.query;

    const startDate = new Date(`${year}-01-01`);
    const endDate = new Date(`${parseInt(year) + 1}-01-01`);

    const revenueReport = await Application.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lt: endDate },
          'payment.status': 'paid',
        },
      },
      {
        $group: {
          _id: period === 'monthly'
            ? { month: { $month: '$createdAt' } }
            : { quarter: { $ceil: { $divide: [{ $month: '$createdAt' }, 3] } } },
          revenue: { $sum: '$payment.total' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.month': 1 } },
    ]);

    const serviceReport = await Application.aggregate([
      { $match: { createdAt: { $gte: startDate, $lt: endDate } } },
      { $group: { _id: '$service', count: { $sum: 1 }, revenue: { $sum: '$payment.total' } } },
      { $lookup: { from: 'services', localField: '_id', foreignField: '_id', as: 'service' } },
      { $unwind: '$service' },
      { $project: { name: '$service.name', count: 1, revenue: 1 } },
      { $sort: { count: -1 } },
    ]);

    res.json({ revenueReport, serviceReport, year });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAdminDashboard, getEmployeeDashboard, getClientDashboard, getReports };
