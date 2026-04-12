const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  applicationId: {
    type: String,
    unique: true,
    required: true,
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true,
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'under-review', 'in-progress', 'pending-documents', 'completed', 'rejected', 'cancelled'],
    default: 'submitted',
  },
  assignedEmployee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  documents: [{
    name: { type: String, required: true },
    originalName: { type: String },
    path: { type: String, required: true },
    mimeType: { type: String },
    size: { type: Number },
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    category: { type: String, default: 'general' },
  }],
  completedDocuments: [{
    name: { type: String, required: true },
    originalName: { type: String },
    path: { type: String, required: true },
    mimeType: { type: String },
    size: { type: Number },
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  }],
  notes: [{
    text: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    isInternal: { type: Boolean, default: false },
  }],
  formData: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  payment: {
    amount: { type: Number, default: 0 },
    gst: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'partial', 'paid', 'refunded'], default: 'pending' },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    paidAt: Date,
  },
  timeline: [{
    status: String,
    message: String,
    timestamp: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  }],
  dueDate: Date,
  completedAt: Date,
}, {
  timestamps: true,
});

// Auto-generate application ID
applicationSchema.pre('validate', async function(next) {
  if (!this.applicationId) {
    const count = await mongoose.model('Application').countDocuments();
    this.applicationId = `HS-${String(count + 1001).padStart(6, '0')}`;
  }
  next();
});

applicationSchema.index({ client: 1, status: 1 });
applicationSchema.index({ assignedEmployee: 1, status: 1 });
applicationSchema.index({ applicationId: 1 });
applicationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Application', applicationSchema);
