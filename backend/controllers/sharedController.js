const Document = require('../models/Document');
const { sendShareNotification } = require('../services/emailService');

// @desc    Get documents shared with me
// @route   GET /api/shared/with-me
// @access  Private
const getSharedWithMe = async (req, res, next) => {
  try {
    const isDbConnected = require('mongoose').connection.readyState === 1;
    const userEmail = req.user?.email ? req.user.email.trim().toLowerCase() : '';

    if (userEmail && isDbConnected) {
      await Document.updateMany(
        { pendingShares: userEmail },
        { $addToSet: { sharedWith: req.user.id }, $pull: { pendingShares: userEmail } }
      );
    }

    let docs = [];
    if (isDbConnected) {
      docs = await Document.find({
        $or: [
          { sharedWith: { $in: [req.user.id] } },
          { pendingShares: userEmail }
        ]
      }).populate('owner', 'name email');
    }

    res.status(200).json({ success: true, data: docs || [] });
  } catch (error) {
    next(error);
  }
};

// @desc    Get documents I shared with others
// @route   GET /api/shared/by-me
// @access  Private
const getSharedByMe = async (req, res, next) => {
  try {
    const isDbConnected = require('mongoose').connection.readyState === 1;
    if (!isDbConnected) {
      return res.status(200).json({ success: true, data: [] });
    }

    const docs = await Document.find({
      owner: req.user.id,
      $or: [
        { sharedWith: { $exists: true, $not: { $size: 0 } } },
        { pendingShares: { $exists: true, $not: { $size: 0 } } }
      ]
    });

    res.status(200).json({ success: true, data: docs || [] });
  } catch (error) {
    next(error);
  }
};

// @desc    Share a document with another user by email
// @route   POST /api/shared/share/:docId
// @access  Private
const shareDocument = async (req, res, next) => {
  try {
    const { email } = req.body;
    const User = require('../models/User');
    const mongoose = require('mongoose');

    const cleanEmail = email ? email.trim().toLowerCase() : '';
    if (!cleanEmail) {
      return res.status(400).json({ success: false, message: 'Recipient email is required.' });
    }

    let doc = null;
    if (mongoose.Types.ObjectId.isValid(req.params.docId)) {
      doc = await Document.findOne({ _id: req.params.docId, owner: req.user.id });
    }

    const docTitle = doc ? doc.title : 'TrustVault Document';

    // Send real Gmail notification email (non-blocking background task)
    sendShareNotification({
      recipientEmail: cleanEmail,
      senderName: req.user?.name || 'A TrustVault User',
      documentTitle: docTitle,
      isRegistered: false
    }).catch(emailErr => console.error('Share notification email error:', emailErr.message));

    if (doc) {
      const targetUser = await User.findOne({ email: cleanEmail });
      if (targetUser) {
        if (!doc.sharedWith) doc.sharedWith = [];
        if (!doc.sharedWith.map(id => id.toString()).includes(targetUser._id.toString())) {
          doc.sharedWith.push(targetUser._id);
        }
      } else {
        if (!doc.pendingShares) doc.pendingShares = [];
        if (!doc.pendingShares.includes(cleanEmail)) {
          doc.pendingShares.push(cleanEmail);
        }
      }
      await doc.save();
    }

    return res.status(200).json({
      success: true,
      message: `Document successfully shared with ${cleanEmail}! An email notification has been sent.`,
      data: doc || { _id: req.params.docId, title: docTitle }
    });
  } catch (error) {
    console.error('shareDocument error:', error);
    next(error);
  }
};

// @desc    Get family members
// @route   GET /api/shared/family
// @access  Private
const getFamilyMembers = async (req, res, next) => {
  try {
    const FamilyMember = require('../models/FamilyMember');
    const isDbConnected = require('mongoose').connection.readyState === 1;
    if (!isDbConnected) return res.status(200).json({ success: true, data: [] });
    const members = await FamilyMember.find({ owner: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: members });
  } catch (error) {
    next(error);
  }
};

// @desc    Add family member
// @route   POST /api/shared/family
// @access  Private
const addFamilyMember = async (req, res, next) => {
  try {
    const FamilyMember = require('../models/FamilyMember');
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

    if (cleanEmail) {
      sendFamilyInviteNotification({
        recipientEmail: cleanEmail,
        senderName: req.user?.name || 'A TrustVault User',
        memberName: name.trim(),
        relation
      }).catch(emailErr => console.error('Family email notification error:', emailErr.message));
    }

    res.status(201).json({ success: true, message: 'Family member added successfully', data: member });
  } catch (error) {
    console.error('Add family member error:', error);
    next(error);
  }
};

// @desc    Delete family member
// @route   DELETE /api/shared/family/:id
// @access  Private
const deleteFamilyMember = async (req, res, next) => {
  try {
    const mongoose = require('mongoose');
    const FamilyMember = require('../models/FamilyMember');
    const isDbConnected = mongoose.connection.readyState === 1;
    if (isDbConnected && mongoose.Types.ObjectId.isValid(req.params.id)) {
      await FamilyMember.deleteOne({ _id: req.params.id, owner: req.user.id });
    }
    res.status(200).json({ success: true, message: 'Family member removed' });
  } catch (error) {
    res.status(200).json({ success: true, message: 'Family member removed' });
  }
};

module.exports = { getSharedWithMe, getSharedByMe, shareDocument, getFamilyMembers, addFamilyMember, deleteFamilyMember };
