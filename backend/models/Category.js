const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  icon: {
    type: String,
    required: true
  },
  color: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Ensure compound index for uniqueness per user
categorySchema.index({ owner: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);
