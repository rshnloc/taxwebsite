const Service = require('../models/Service');

// @route   GET /api/services
const getServices = async (req, res) => {
  try {
    const { category, search, active } = req.query;
    const query = {};

    if (category) query.category = category;
    if (active !== undefined) query.isActive = active === 'true';
    else query.isActive = true;
    if (search) {
      query.$text = { $search: search };
    }

    const services = await Service.find(query).sort({ sortOrder: 1, name: 1 });
    res.json({ services });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @route   GET /api/services/:slug
const getServiceBySlug = async (req, res) => {
  try {
    const service = await Service.findOne({ slug: req.params.slug, isActive: true });
    if (!service) return res.status(404).json({ error: 'Service not found' });
    res.json({ service });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @route   POST /api/services
const createService = async (req, res) => {
  try {
    const slug = req.body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    const service = await Service.create({ ...req.body, slug });
    res.status(201).json({ service });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @route   PUT /api/services/:id
const updateService = async (req, res) => {
  try {
    if (req.body.name) {
      req.body.slug = req.body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!service) return res.status(404).json({ error: 'Service not found' });
    res.json({ service });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @route   DELETE /api/services/:id
const deleteService = async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!service) return res.status(404).json({ error: 'Service not found' });
    res.json({ message: 'Service deactivated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getServices, getServiceBySlug, createService, updateService, deleteService };
