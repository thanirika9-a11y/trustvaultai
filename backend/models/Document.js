const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Identity',
      'Banking and Finance',
      'Loans',
      'Insurance',
      'Property',
      'Medical',
      'Education',
      'Employment',
      'Vehicle',
      'Legal',
      'Bills and Payments',
      'Digital Legacy',
      'Will and Legacy Records',
      'Other'
    ],
    default: 'Other'
  },
  fileUrl: {
    type: String,
    required: true
  },
  publicId: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['processing', 'processed', 'failed'],
    default: 'processing'
  },
  ocrText: {
    type: String,
    select: false // Large text block, don't load by default
  },
  aiSummaryTamil: {
    type: String
  },
  expiryDate: {
    type: Date
  },
  expiryNotes: {
    type: String
  },
  dueDate: {
    type: Date
  },
  amountDue: {
    type: String
  },
  reminderType: {
    type: String
  },
  reminderNote: {
    type: String
  },
  isOwnerVerified: {
    type: Boolean,
    default: false
  },
  sharedWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  pendingShares: [{
    type: String  // email addresses of people invited but not yet registered
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Document', documentSchema);
