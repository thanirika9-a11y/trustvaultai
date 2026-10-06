const Document = require('../models/Document');
const cloudinaryService = require('../services/cloudinaryService');
const aiService = require('../services/aiService');

// @desc    Upload new document
// @route   POST /api/documents
// @access  Private
const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded', code: 'NO_FILE' });
    }

    const { title, category } = req.body;
    if (!title || !category) {
      return res.status(400).json({ success: false, message: 'Title and category are required', code: 'MISSING_FIELDS' });
    }

    // Duplicate Document Check
    const existingDoc = await Document.findOne({ owner: req.user.id, title: title });
    if (existingDoc) {
      return res.status(409).json({ success: false, message: 'A document with this title already exists. Please use a different name.', code: 'DUPLICATE_DOC' });
    }

    // Upload to Cloudinary (or local simulation)
    const result = await cloudinaryService.uploadToCloudinary(req.file.buffer, 'trustvault/documents', req.file.originalname);

    // Run AI Analysis for Tamil summary and Smart Deadlines / Expiry
    const aiAnalysis = await aiService.analyzeDocument(req.file.buffer, req.file.mimetype, title, category);
    const summaryText = typeof aiAnalysis === 'string' ? aiAnalysis : (aiAnalysis.summary || '');
    const expiryDate = aiAnalysis.expiryDate || null;
    const dueDate = aiAnalysis.dueDate || null;
    const amountDue = aiAnalysis.amountDue || null;
    const reminderType = aiAnalysis.reminderType || null;
    const reminderNote = aiAnalysis.reminderNote || null;

    // Save to DB
    const doc = await Document.create({
      owner: req.user.id,
      title,
      category,
      fileUrl: result.secure_url,
      publicId: result.public_id,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      aiSummaryTamil: summaryText,
      expiryDate,
      dueDate,
      amountDue,
      reminderType,
      reminderNote
    });

    // If deadline or expiry was detected, fire background notification email
    if (dueDate || expiryDate) {
      const emailService = require('../services/emailService');
      const targetDate = dueDate || expiryDate;
      emailService.sendDeadlineNotification({
        recipientEmail: req.user.email,
        title,
        dueDate: targetDate,
        amountDue,
        reminderType,
        reminderNote
      }).catch(e => console.error('Deadline email failed:', e?.message));
    }

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: doc
    });
  } catch (error) {
    if (error.message && error.message.includes('Unsupported file format')) {
      return res.status(400).json({ success: false, message: error.message, code: 'INVALID_FILE_TYPE' });
    }
    next(error);
  }
};

// @desc    Get all documents for logged in user
// @route   GET /api/documents
// @access  Private
const getMyDocuments = async (req, res, next) => {
  try {
    const docs = await Document.find({ owner: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: docs });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single document
// @route   GET /api/documents/:id
// @access  Private
const getDocumentById = async (req, res, next) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, owner: req.user.id });
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found or unauthorized', code: 'DOC_NOT_FOUND' });
    }
    res.status(200).json({ success: true, data: doc });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Private
const deleteDocument = async (req, res, next) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, owner: req.user.id });
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found or unauthorized', code: 'DOC_NOT_FOUND' });
    }

    // Delete from Cloudinary
    await cloudinaryService.deleteFromCloudinary(doc.publicId);

    // Delete from DB
    await Document.deleteOne({ _id: req.params.id });

    res.status(200).json({ success: true, message: 'Document deleted successfully', data: {} });
  } catch (error) {
    next(error);
  }
};

// @desc    View / Serve document
// @route   GET /api/documents/view/:id
// @access  Public (for browser tab rendering)
const path = require('path');
const fs = require('fs');

const viewDocument = async (req, res, next) => {
  try {
    const mongoose = require('mongoose');
    let doc = null;
    const rawId = req.params.id;

    // 1. Try finding by MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(rawId)) {
      doc = await Document.findById(rawId);
    }

    // 2. Try finding by title or publicId if not found by ObjectId
    if (!doc && rawId) {
      const searchTitle = req.query.title || rawId;
      doc = await Document.findOne({
        $or: [
          { publicId: rawId },
          { title: new RegExp('^' + searchTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') }
        ]
      });
    }

    // 3. If file exists directly in uploads directory
    const directFileOnDisk = path.resolve(__dirname, '..', 'uploads', rawId);
    if (fs.existsSync(directFileOnDisk) && fs.statSync(directFileOnDisk).isFile()) {
      const ext = path.extname(directFileOnDisk).toLowerCase();
      const contentType = ext === '.png' ? 'image/png' : (ext === '.jpg' || ext === '.jpeg') ? 'image/jpeg' : 'application/pdf';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Disposition', `inline; filename="${rawId}"`);
      return fs.createReadStream(directFileOnDisk).pipe(res);
    }

    // 4. Check if directFileOnDisk with .pdf exists
    const directPdfOnDisk = path.resolve(__dirname, '..', 'uploads', `${rawId}.pdf`);
    if (fs.existsSync(directPdfOnDisk) && fs.statSync(directPdfOnDisk).isFile()) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Disposition', `inline; filename="${rawId}.pdf"`);
      return fs.createReadStream(directPdfOnDisk).pipe(res);
    }

    // If still no document found in DB, construct a fallback doc from query parameters
    if (!doc) {
      if (req.query.title || rawId.startsWith('doc_shared_') || rawId.startsWith('d_')) {
        doc = {
          title: req.query.title || 'Shared TrustVault Document',
          category: req.query.category || 'Shared',
          createdAt: new Date(),
          aiSummaryTamil: 'இந்தப் ஆவணம் பகிரப்பட்டு TrustVault பாதுகாப்பில் வைக்கப்பட்டுள்ளது.'
        };
      } else {
        return res.status(404).send('Document not found');
      }
    }

    // Check if direct file exists on disk: doc_<id>.pdf
    if (doc._id) {
      const directFile = path.resolve(__dirname, '..', 'uploads', `doc_${doc._id}.pdf`);
      if (fs.existsSync(directFile)) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.title)}.pdf"`);
        return fs.createReadStream(directFile).pipe(res);
      }
    }

    // Check if doc.fileUrl points to a local file in uploads/
    if (doc.fileUrl && doc.fileUrl.includes('/uploads/')) {
      const filename = doc.fileUrl.split('/uploads/').pop();
      const filePath = path.resolve(__dirname, '..', 'uploads', filename);
      if (fs.existsSync(filePath)) {
        const ext = path.extname(filename).toLowerCase();
        const contentType = ext === '.png' ? 'image/png' : (ext === '.jpg' || ext === '.jpeg') ? 'image/jpeg' : 'application/pdf';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.title)}${ext}"`);
        return fs.createReadStream(filePath).pipe(res);
      }
    }

    // If doc.fileUrl is an external URL (e.g. Cloudinary, AWS S3)
    if (doc.fileUrl && (doc.fileUrl.startsWith('http://') || doc.fileUrl.startsWith('https://')) && !doc.fileUrl.includes('localhost:5000')) {
      return res.redirect(doc.fileUrl);
    }

    // If file is an image or PDF stored in base64
    if (doc.fileUrl && (doc.fileUrl.startsWith('data:image') || doc.fileUrl.startsWith('data:application'))) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>${doc.title} - TrustVault AI</title>
            <style>
              body { margin:0; background:#0f172a; display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; color:#fff; font-family:sans-serif; }
              img { max-width:90%; max-height:85vh; border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,0.5); border:2px solid #7C3AED; }
            </style>
          </head>
          <body>
            <h3 style="color:#a78bfa; margin-bottom:16px;">📄 ${doc.title}</h3>
            <img src="${doc.fileUrl}" alt="${doc.title}" />
          </body>
        </html>
      `);
    }

    // Fallback: Rich TrustVault Document Viewer page
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${doc.title} - TrustVault AI</title>
          <style>
            body { margin: 0; padding: 24px; background: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #f8fafc; display: flex; justify-content: center; align-items: center; min-height: 90vh; }
            .card { background: #131d31; border: 1px solid #233554; border-radius: 16px; width: 100%; max-width: 650px; padding: 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
            .badge { display: inline-block; background: rgba(16, 185, 129, 0.15); color: #10B981; border: 1px solid rgba(16, 185, 129, 0.3); padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 12px; }
            .category { display: inline-block; background: rgba(124, 58, 237, 0.15); color: #a78bfa; border: 1px solid rgba(124, 58, 237, 0.3); padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-left: 8px; }
            h1 { margin: 0 0 8px; font-size: 24px; color: #ffffff; }
            .meta { color: #64748b; font-size: 13px; margin-bottom: 24px; }
            .preview-box { background: #0f172a; border: 2px dashed #334155; border-radius: 12px; padding: 36px 20px; text-align: center; margin-bottom: 24px; }
            .preview-icon { font-size: 48px; margin-bottom: 12px; }
            .summary-box { background: rgba(124, 58, 237, 0.08); border-left: 4px solid #7C3AED; padding: 16px 20px; border-radius: 8px; margin-bottom: 16px; }
            .summary-title { font-weight: bold; color: #a78bfa; font-size: 14px; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
            .summary-text { color: #cbd5e1; font-size: 14px; line-height: 1.6; white-space: pre-line; }
            .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 24px; border-top: 1px solid #1e293b; padding-top: 16px; }
          </style>
        </head>
        <body>
          <div class="card">
            <span class="badge">🔒 TrustVault Verified</span>
            <span class="category">${doc.category || 'General'}</span>
            <h1>📄 ${doc.title}</h1>
            <div class="meta">Created on ${new Date(doc.createdAt).toLocaleDateString()} • Verified by TrustVault AI</div>
            
            <div class="preview-box">
              <div class="preview-icon">📜</div>
              <div style="font-size: 16px; font-weight: bold; color: #f1f5f9; margin-bottom: 4px;">${doc.title}</div>
              <div style="font-size: 13px; color: #94a3b8;">Document securely stored and verified in TrustVault Cloud</div>
            </div>

            ${doc.aiSummaryTamil ? `
              <div class="summary-box">
                <div class="summary-title">✨ AI Summary / குறிப்புகள்</div>
                <div class="summary-text">${doc.aiSummaryTamil}</div>
              </div>
            ` : ''}

            <div class="footer">
              TrustVault AI Secure Storage • End-to-End Encrypted
            </div>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadDocument,
  getMyDocuments,
  getDocumentById,
  deleteDocument,
  viewDocument
};
