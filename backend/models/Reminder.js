const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
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
  dueDate: {
    type: Date,
    required: true
  },
  type: {
    type: String,
    enum: ['Loan EMI', 'Passport Expiry', 'Insurance Renewal', 'Property Tax', 'Medical Reminder', 'Other'],
    default: 'Other'
  },
  isCompleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Reminder', reminderSchema);
