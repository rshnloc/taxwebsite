const Application = require('../models/Application');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');

// @route   GET /api/applications
const getApplications = async (req, res) => {
  try {
    const { status, priority, search, page = 1, limit = 20, assignedEmployee } = req.query;
    const query = {};

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignedEmployee) query.assignedEmployee = assignedEmployee;

    if (req.user.role === 'employee') {
      query.assignedEmployee = req.user._id;
    }

    if (search) {
      query.$or = [
        { applicationId: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Application.countDocuments(query);
    const applications = await Application.find(query)
      .populate('client', 'name email phone companyName')
      .populate('service', 'name slug category')
      .populate('assignedEmployee', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      applications,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @route   GET /api/applications/my
const getMyApplications = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = { client: req.user._id };
    if (status) query.status = status;

    const total = await Application.countDocuments(query);
    const applications = await Application.find(query)
      .populate('service', 'name slug category icon')
      .populate('assignedEmployee', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      applications,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @route   GET /api/applications/:id
const getApplicationById = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('client', 'name email phone companyName address pan gst')
      .populate('service', 'name slug category pricing requiredDocuments')
      .populate('assignedEmployee', 'name email phone')
      .populate('notes.author', 'name role')
      .populate('timeline.updatedBy', 'name role');

    if (!application) return res.status(404).json({ error: 'Application not found' });

    // Check authorization
    if (req.user.role === 'client' && application.client._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json({ application });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @route   POST /api/applications
const createApplication = async (req, res) => {
  try {
    const { serviceId, formData, notes } = req.body;

    const documents = [];
    if (req.files) {
      req.files.forEach(file => {
        documents.push({
          name: file.originalname,
          originalName: file.originalname,
          path: `/uploads/applications/${file.filename}`,
          mimeType: file.mimetype,
          size: file.size,
          uploadedBy: req.user._id,
        });
      });
    }

    const application = await Application.create({
      client: req.user._id,
      service: serviceId,
      documents,
      formData: formData ? JSON.parse(formData) : {},
      timeline: [{
        status: 'submitted',
        message: 'Application submitted',
        updatedBy: req.user._id,
      }],
      notes: notes ? [{ text: notes, author: req.user._id }] : [],
    });

    const populated = await Application.findById(application._id)
      .populate('service', 'name slug')
      .populate('client', 'name email');

    // Notify admins
    const User = require('../models/User');
    const admins = await User.find({ role: 'admin', isActive: true });
    for (const admin of admins) {
      await Notification.create({
        user: admin._id,
        title: 'New Application',
        message: `New application ${application.applicationId} submitted by ${req.user.name}`,
        type: 'application',
        link: `/admin/applications/${application._id}`,
      });
    }

    await ActivityLog.create({
      user: req.user._id,
      action: 'Application created',
      entity: 'application',
      entityId: application._id,
    });

    res.status(201).json({ application: populated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @route   PUT /api/applications/:id
const updateApplication = async (req, res) => {
  try {
    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    ).populate('client service assignedEmployee');
    if (!application) return res.status(404).json({ error: 'Application not found' });
    res.json({ application });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @route   PUT /api/applications/:id/status
const updateApplicationStatus = async (req, res) => {
  try {
    const { status, message } = req.body;
    const application = await Application.findById(req.params.id);
    if (!application) return res.status(404).json({ error: 'Application not found' });

    application.status = status;
    application.timeline.push({
      status,
      message: message || `Status updated to ${status}`,
      updatedBy: req.user._id,
    });

    if (status === 'completed') {
      application.completedAt = new Date();
    }

    await application.save();

    // Notify client
    await Notification.create({
      user: application.client,
      title: 'Application Update',
      message: `Your application ${application.applicationId} status changed to ${status}`,
      type: 'application',
      link: `/dashboard/applications/${application._id}`,
    });

    const populated = await Application.findById(application._id)
      .populate('client service assignedEmployee');

    res.json({ application: populated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @route   PUT /api/applications/:id/assign
const assignEmployee = async (req, res) => {
  try {
    const { employeeId } = req.body;
    const application = await Application.findById(req.params.id);
    if (!application) return res.status(404).json({ error: 'Application not found' });

    application.assignedEmployee = employeeId;
    application.timeline.push({
      status: application.status,
      message: 'Employee assigned',
      updatedBy: req.user._id,
    });
    await application.save();

    // Notify employee
    await Notification.create({
      user: employeeId,
      title: 'New Task Assigned',
      message: `You have been assigned application ${application.applicationId}`,
      type: 'task',
      link: `/employee/applications/${application._id}`,
    });

    const populated = await Application.findById(application._id)
      .populate('client service assignedEmployee');

    res.json({ application: populated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @route   POST /api/applications/:id/documents
const uploadDocuments = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) return res.status(404).json({ error: 'Application not found' });

    if (req.files) {
      const targetArray = req.body.isCompleted === 'true' ? 'completedDocuments' : 'documents';
      req.files.forEach(file => {
        application[targetArray].push({
          name: file.originalname,
          originalName: file.originalname,
          path: `/uploads/applications/${file.filename}`,
          mimeType: file.mimetype,
          size: file.size,
          uploadedBy: req.user._id,
        });
      });
    }

    await application.save();
    res.json({ application });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getApplications, getApplicationById, createApplication, updateApplication,
  updateApplicationStatus, assignEmployee, uploadDocuments, getMyApplications
};
