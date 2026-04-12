const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true,
    unique: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  shortDescription: {
    type: String,
    required: true,
    maxlength: 200,
  },
  description: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    default: 'FileText',
  },
  category: {
    type: String,
    enum: ['tax', 'registration', 'compliance', 'licensing', 'legal', 'other'],
    required: true,
  },
  pricing: {
    basePrice: { type: Number, default: 0 },
    gstPercent: { type: Number, default: 18 },
    totalPrice: { type: Number, default: 0 },
    isCustom: { type: Boolean, default: false },
    pricingNote: { type: String },
  },
  requiredDocuments: [{
    name: { type: String, required: true },
    description: { type: String },
    isMandatory: { type: Boolean, default: true },
  }],
  timeline: {
    type: String,
    default: '7-10 working days',
  },
  features: [String],
  process: [{
    step: Number,
    title: String,
    description: String,
  }],
  faqs: [{
    question: String,
    answer: String,
  }],
  isActive: { type: Boolean, default: true },
  isPopular: { type: Boolean, default: false },
  sortOrder: { type: Number, default: 0 },
}, {
  timestamps: true,
});

serviceSchema.index({ name: 'text', description: 'text', category: 1 });

module.exports = mongoose.model('Service', serviceSchema);
