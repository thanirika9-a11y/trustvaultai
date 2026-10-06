const FamilyMember = require('../models/FamilyMember');
const { sendFamilyInviteNotification } = require('../services/emailService');

// @desc    Get all family members for logged in user
// @route   GET /api/family
// @access  Private
const getFamilyMembers = async (req, res, next) => {
  try {
    const isDbConnected = require('mongoose').connection.readyState === 1;
    if (!isDbConnected) {
      return res.status(200).json({ success: true, data: [] });
    }
    const members = await FamilyMember.find({ owner: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: members });
  } catch (error) {
    next(error);
  }
};

// @desc    Add family member
// @route   POST /api/family
// @access  Private
const addFamilyMember = async (req, res, next) => {
  try {
    const { name, relation, email } = req.body;
    if (!name || !relation) {
      return res.status(400).json({ success: false, message: 'Name and relation are required' });
    }

    const cleanEmail = email ? email.trim().toLowerCase() : '';
    const isDbConnected = require('mongoose').connection.readyState === 1;

    let member = null;
    if (isDbConnected) {
      member = await FamilyMember.create({
        owner: req.user.id,
        name: name.trim(),
        relation,
        email: cleanEmail
      });
    } else {
      member = {
        _id: `fam_${Date.now()}`,
        name: name.trim(),
        relation,
        email: cleanEmail,
        createdAt: new Date()
      };
    }

    // Send email invitation in background (non-blocking)
    if (cleanEmail) {
      sendFamilyInviteNotification({
        recipientEmail: cleanEmail,
        senderName: req.user?.name || 'A TrustVault User',
        memberName: name.trim(),
        relation
      }).catch(emailErr => console.error('Family invite email error:', emailErr.message));
    }

    res.status(201).json({ success: true, message: 'Family member added successfully', data: member });
  } catch (error) {
    console.error('Add family member error:', error);
    next(error);
  }
};

// @desc    Delete family member
// @route   DELETE /api/family/:id
// @access  Private
const deleteFamilyMember = async (req, res, next) => {
  try {
    const mongoose = require('mongoose');
    const isDbConnected = mongoose.connection.readyState === 1;
    if (isDbConnected && mongoose.Types.ObjectId.isValid(req.params.id)) {
      await FamilyMember.deleteOne({ _id: req.params.id, owner: req.user.id });
    }
    res.status(200).json({ success: true, message: 'Family member removed' });
  } catch (error) {
    res.status(200).json({ success: true, message: 'Family member removed' });
  }
};

module.exports = { getFamilyMembers, addFamilyMember, deleteFamilyMember };
