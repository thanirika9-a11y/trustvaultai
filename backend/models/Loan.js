const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
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
  outstandingBalance: {
    type: Number,
    required: true,
    default: 0
  },
  monthlyEmi: {
    type: Number,
    required: true,
    default: 0
  },
  nextDueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'closed'],
    default: 'active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Loan', loanSchema);
