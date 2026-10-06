const mongoose = require('mongoose');

const familyMemberSchema = new mongoose.Schema({
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
  relation: {
    type: String,
    enum: ['Wife', 'Son', 'Daughter', 'Father', 'Mother', 'Husband', 'Sibling', 'Other'],
    required: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('FamilyMember', familyMemberSchema);
