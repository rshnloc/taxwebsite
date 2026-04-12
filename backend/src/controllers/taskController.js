const Task = require('../models/Task');
const Notification = require('../models/Notification');

// @route   GET /api/tasks
const getTasks = async (req, res) => {
  try {
    const { status, priority, assignedTo, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;

    const total = await Task.countDocuments(query);
    const tasks = await Task.find(query)
      .populate('application', 'applicationId status')
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ tasks, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @route   GET /api/tasks/my
const getMyTasks = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = { assignedTo: req.user._id };
    if (status) query.status = status;

    const total = await Task.countDocuments(query);
    const tasks = await Task.find(query)
      .populate('application', 'applicationId status client')
      .populate({
        path: 'application',
        populate: [
          { path: 'client', select: 'name email phone' },
          { path: 'service', select: 'name category' }
        ]
      })
      .sort({ priority: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ tasks, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @route   GET /api/tasks/:id
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('application')
      .populate('assignedTo', 'name email phone')
      .populate('assignedBy', 'name')
      .populate('remarks.author', 'name');
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ task });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @route   POST /api/tasks
const createTask = async (req, res) => {
  try {
    const task = await Task.create({ ...req.body, assignedBy: req.user._id });

    await Notification.create({
      user: task.assignedTo,
      title: 'New Task',
      message: `New task: ${task.title}`,
      type: 'task',
      link: `/employee/tasks/${task._id}`,
    });

    const populated = await Task.findById(task._id)
      .populate('application assignedTo assignedBy');

    res.status(201).json({ task: populated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @route   PUT /api/tasks/:id
const updateTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true
    }).populate('application assignedTo assignedBy');
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ task });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @route   PUT /api/tasks/:id/status
const updateTaskStatus = async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    task.status = status;
    if (status === 'completed') task.completedAt = new Date();
    if (remarks) {
      task.remarks.push({ text: remarks, author: req.user._id });
    }
    await task.save();

    // Notify admin
    const User = require('../models/User');
    const admins = await User.find({ role: 'admin', isActive: true });
    for (const admin of admins) {
      await Notification.create({
        user: admin._id,
        title: 'Task Update',
        message: `Task "${task.title}" status changed to ${status}`,
        type: 'task',
        link: `/admin/tasks/${task._id}`,
      });
    }

    const populated = await Task.findById(task._id)
      .populate('application assignedTo assignedBy');
    res.json({ task: populated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getTasks, getTaskById, createTask, updateTask, updateTaskStatus, getMyTasks };
